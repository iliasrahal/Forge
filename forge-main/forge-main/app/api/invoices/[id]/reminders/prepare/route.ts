import OpenAI from "openai";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { sumIssuedCreditsCents } from "@/src/lib/credit-notes";
import { resolveDocumentEmailSignature } from "@/src/lib/document-email-signature";
import {
  buildStandardInvoiceReminderMessage,
  getInvoiceReminderState,
  getManualInvoiceReminderLevel,
  validateInvoiceReminderMessage,
} from "@/src/lib/invoice-reminders";
import { computeInvoicePaymentState } from "@/src/lib/payments";
import { checkRateLimit } from "@/src/lib/rate-limit";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

type RouteProps = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteProps) {
  try {
    const context = await requireWorkspaceContext("write");
    const { id: invoiceId } = await params;
    const limit = checkRateLimit(`invoice-reminder-prepare:${context.user.id}:${invoiceId}`, 10, 60_000);
    if (!limit.allowed) return NextResponse.json({ error: "Trop de demandes. Réessayez dans un instant." }, { status: 429 });

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: context.workspace.id },
      include: {
        client: true,
        reminders: { select: { sentAt: true } },
        payments: { select: { status: true, amountCents: true, feeCents: true, refundedCents: true, paidAt: true } },
        creditNotes: { select: { status: true, amountCents: true } },
      },
    });
    if (!invoice) return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
    if (invoice.status !== "ENVOYEE" && invoice.status !== "EN_RETARD") {
      return NextResponse.json({ error: "Seule une facture envoyée peut être relancée." }, { status: 409 });
    }
    if (!invoice.client.email) return NextResponse.json({ error: "Aucune adresse e-mail n’est renseignée pour ce client." }, { status: 400 });

    const creditedCents = sumIssuedCreditsCents(invoice.creditNotes);
    const paymentState = computeInvoicePaymentState(invoice.amountCents, invoice.payments, creditedCents);
    if (paymentState.isFullyPaid) {
      return NextResponse.json({ error: "Cette facture est déjà réglée." }, { status: 409 });
    }

    // Relance automatique proposée (délai atteint) ou, à défaut, relance
    // manuelle à l'initiative de l'artisan — toujours possible tant que la
    // facture reste impayée, indépendamment du délai configuré.
    const reminderState = getInvoiceReminderState({
      status: invoice.status,
      dueDate: invoice.dueDate,
      sentAt: invoice.sentAt,
      createdAt: invoice.createdAt,
      reminders: invoice.reminders,
      delay1Days: context.workspace.invoiceReminderDelay1Days,
      delay2Days: context.workspace.invoiceReminderDelay2Days,
      delay3Days: context.workspace.invoiceReminderDelay3Days,
    });

    const clientName = invoice.client.type === "PROFESSIONNEL"
      ? invoice.client.companyName?.trim() || "Madame, Monsieur"
      : `${invoice.client.firstName ?? ""} ${invoice.client.lastName ?? ""}`.trim() || "Madame, Monsieur";
    const artisanSignature = resolveDocumentEmailSignature(context.workspace, context.user);
    const level = reminderState.eligible && reminderState.level
      ? reminderState.level
      : getManualInvoiceReminderLevel(invoice.reminders.length);
    const fallback = buildStandardInvoiceReminderMessage({
      level,
      clientName,
      reference: invoice.reference,
      dueDate: invoice.dueDate,
      remainingCents: paymentState.remainingCents,
      artisanSignature,
    });
    let message = fallback;

    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.35,
          max_tokens: 260,
          messages: [
            { role: "system", content: "Rédige uniquement un e-mail de relance de facture impayée, court, courtois, professionnel et non agressif en français. Ne crée aucune information. Conserve la signature fournie. Aucun objet d’e-mail ni markdown." },
            { role: "user", content: `Niveau de relance : ${level}/3\nClient : ${clientName}\nRéférence : ${invoice.reference}\nTitre : ${invoice.title}\nÉchéance : ${invoice.dueDate?.toISOString() ?? "date inconnue"}\nMontant restant dû : ${(paymentState.remainingCents / 100).toFixed(2)} €\nSignature : ${artisanSignature}` },
          ],
        });
        const generated = validateInvoiceReminderMessage(response.choices[0]?.message?.content);
        if (generated.value) message = generated.value;
      } catch (error) {
        console.warn("INVOICE REMINDER OPENAI FALLBACK", error);
      }
    }

    return NextResponse.json({ message, level, recipient: invoice.client.email });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("PREPARE INVOICE REMINDER ERROR", error);
    return NextResponse.json({ error: "La relance n’a pas pu être préparée." }, { status: 500 });
  }
}
