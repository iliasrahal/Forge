import { NextResponse } from "next/server";

import { sumIssuedCreditsCents } from "@/src/lib/credit-notes";
import { sendInvoiceReminderEmail } from "@/src/lib/email";
import {
  createInvoicePublicToken,
  hashInvoicePublicToken,
} from "@/src/lib/invoice-public-access";
import {
  isInvoiceReminderCoolingDown,
  validateInvoiceReminderMessage,
} from "@/src/lib/invoice-reminders";
import { computeInvoicePaymentState } from "@/src/lib/payments";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limit";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

type RouteProps = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteProps) {
  let pendingAccessId: string | null = null;
  try {
    const context = await requireWorkspaceContext("write");
    if (!context.user.smartRemindersEnabled) {
      return NextResponse.json({ error: "Les rappels intelligents sont désactivés." }, { status: 403 });
    }
    const { id: invoiceId } = await params;
    const limit = checkRateLimit(`invoice-reminder-send:${context.user.id}:${invoiceId}`, 1, 30_000);
    if (!limit.allowed) return NextResponse.json({ error: "Trop de tentatives. Réessayez dans un instant." }, { status: 429 });
    const body = (await request.json()) as Record<string, unknown>;
    const validatedMessage = validateInvoiceReminderMessage(body.message);
    if (validatedMessage.error) return NextResponse.json({ error: validatedMessage.error }, { status: 400 });

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: context.workspace.id },
      include: {
        client: true,
        reminders: { select: { sentAt: true }, orderBy: { sentAt: "desc" } },
        payments: { select: { status: true, amountCents: true, feeCents: true, refundedCents: true, paidAt: true } },
        creditNotes: { select: { status: true, amountCents: true } },
      },
    });
    if (!invoice) return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
    if (invoice.status !== "ENVOYEE" && invoice.status !== "EN_RETARD") {
      return NextResponse.json({ error: "Cette facture ne peut plus être relancée." }, { status: 409 });
    }
    if (!invoice.client.email) return NextResponse.json({ error: "Aucune adresse e-mail n’est renseignée pour ce client." }, { status: 400 });
    // La relance manuelle reste possible tant que la facture est impayée,
    // même avant le délai automatique — seul le cooldown anti-doublon s'applique.
    if (isInvoiceReminderCoolingDown(invoice.reminders[0]?.sentAt ?? null)) {
      return NextResponse.json({ error: "Une relance a déjà été envoyée récemment. Réessayez plus tard." }, { status: 409 });
    }

    const creditedCents = sumIssuedCreditsCents(invoice.creditNotes);
    const paymentState = computeInvoicePaymentState(invoice.amountCents, invoice.payments, creditedCents);
    if (paymentState.isFullyPaid) {
      return NextResponse.json({ error: "Cette facture est déjà réglée." }, { status: 409 });
    }

    // Nouvelle vérification au plus près de l'appel au fournisseur : la
    // facture peut avoir été réglée après l'ouverture du panneau.
    const stillDue = await prisma.invoice.findFirst({
      where: {
        id: invoice.id,
        organizationId: context.workspace.id,
        status: { in: ["ENVOYEE", "EN_RETARD"] },
      },
      select: { id: true },
    });
    if (!stillDue) return NextResponse.json({ error: "Cette facture ne peut plus être relancée." }, { status: 409 });

    const rawToken = createInvoicePublicToken();
    const access = await prisma.invoicePublicAccess.create({
      data: { invoiceId: invoice.id, tokenHash: hashInvoicePublicToken(rawToken) },
      select: { id: true },
    });
    pendingAccessId = access.id;
    const origin = new URL(request.url).origin;
    const delivery = await sendInvoiceReminderEmail(
      invoice.client.email,
      invoice.reference,
      validatedMessage.value!,
      `${origin}/facture/${rawToken}`,
    );
    if (delivery.error) throw new Error("La relance n’a pas pu être envoyée.");
    pendingAccessId = null;

    const sentAt = new Date();
    await prisma.$transaction([
      prisma.invoiceReminder.create({
        data: { invoiceId: invoice.id, sentAt, channel: "EMAIL", createdByUserId: context.user.id },
      }),
      prisma.invoicePublicAccess.updateMany({
        where: { invoiceId: invoice.id, id: { not: access.id }, revokedAt: null },
        data: { revokedAt: sentAt },
      }),
    ]);
    return NextResponse.json({ success: true, sentAt });
  } catch (error) {
    if (pendingAccessId) {
      await prisma.invoicePublicAccess.delete({ where: { id: pendingAccessId } }).catch(() => undefined);
    }
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("SEND INVOICE REMINDER ERROR", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "La relance n’a pas pu être envoyée." }, { status: 500 });
  }
}
