import { NextResponse } from "next/server";

import { sumIssuedCreditsCents } from "@/src/lib/credit-notes";
import { resolveDocumentEmailSignature } from "@/src/lib/document-email-signature";
import { sendInvoiceReminderEmail, sendQuoteReminderEmail } from "@/src/lib/email";
import {
  createInvoicePublicToken,
  hashInvoicePublicToken,
} from "@/src/lib/invoice-public-access";
import {
  buildStandardInvoiceReminderMessage,
  getInvoiceReminderState,
  isInvoiceReminderCoolingDown,
} from "@/src/lib/invoice-reminders";
import { computeInvoicePaymentState } from "@/src/lib/payments";
import { prisma } from "@/src/lib/prisma";
import { createQuotePublicToken, hashQuotePublicToken } from "@/src/lib/quote-public-access";
import {
  buildStandardReminderMessage,
  getQuoteReminderState,
  isReminderCoolingDown,
} from "@/src/lib/quote-reminders";

// Route déclenchée par une tâche planifiée (voir vercel.json) — elle envoie
// elle-même les relances éligibles pour les organisations ayant activé
// l'envoi automatique, sans validation humaine. Le message utilisé est
// toujours le modèle standard déterministe (jamais l'IA) : personne ne
// relit ce texte avant qu'il ne parte, il doit rester prévisible.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorizedCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  // En local, sans secret configuré, on laisse passer pour pouvoir tester la
  // route à la main. En production, le secret est obligatoire.
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

type ReminderOrgIdentity = {
  type: "PERSONAL" | "TEAM";
  name: string;
  legalName: string | null;
  personalOwner: { firstName: string; emailSignature: string | null } | null;
};

function resolveSignature(organization: ReminderOrgIdentity) {
  return resolveDocumentEmailSignature(organization, {
    emailSignature: organization.personalOwner?.emailSignature ?? null,
    firstName: organization.personalOwner?.firstName ?? null,
  });
}

const organizationSignatureSelect = {
  id: true,
  type: true,
  name: true,
  legalName: true,
  quoteReminderDelay1Days: true,
  quoteReminderDelay2Days: true,
  invoiceReminderDelay1Days: true,
  invoiceReminderDelay2Days: true,
  invoiceReminderDelay3Days: true,
  personalOwner: { select: { firstName: true, emailSignature: true } },
} as const;

async function sendAutomaticQuoteReminders(now: Date) {
  const quotes = await prisma.quote.findMany({
    where: { status: "ENVOYE", organization: { quoteReminderAutoSend: true } },
    include: {
      client: true,
      organization: { select: organizationSignatureSelect },
      reminders: { select: { sentAt: true }, orderBy: { sentAt: "desc" } },
    },
  });

  let sent = 0;
  let skipped = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const quote of quotes) {
    try {
      if (!quote.client?.email || !quote.organization) {
        skipped += 1;
        continue;
      }
      const state = getQuoteReminderState({
        status: quote.status,
        sentAt: quote.sentAt,
        reminders: quote.reminders,
        delay1Days: quote.organization.quoteReminderDelay1Days,
        delay2Days: quote.organization.quoteReminderDelay2Days,
        now,
      });
      if (!state.eligible || !state.level) {
        skipped += 1;
        continue;
      }
      if (isReminderCoolingDown(quote.reminders[0]?.sentAt ?? null, now)) {
        skipped += 1;
        continue;
      }

      // Vérification au plus près de l'envoi : le devis a pu être accepté
      // ou refusé entretemps, pendant le passage de la tâche planifiée.
      const stillSent = await prisma.quote.findFirst({
        where: { id: quote.id, status: "ENVOYE" },
        select: { id: true },
      });
      if (!stillSent) {
        skipped += 1;
        continue;
      }

      const clientName = quote.client.type === "PROFESSIONNEL"
        ? quote.client.companyName?.trim() || "Madame, Monsieur"
        : `${quote.client.firstName ?? ""} ${quote.client.lastName ?? ""}`.trim() || "Madame, Monsieur";
      const message = buildStandardReminderMessage({
        level: state.level,
        clientName,
        reference: quote.reference,
        sentAt: quote.sentAt,
        artisanSignature: resolveSignature(quote.organization),
      });

      const rawToken = createQuotePublicToken();
      const access = await prisma.quotePublicAccess.create({
        data: { quoteId: quote.id, tokenHash: hashQuotePublicToken(rawToken) },
        select: { id: true },
      });

      try {
        const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://myforge.online").replace(/\/$/, "");
        const delivery = await sendQuoteReminderEmail(
          quote.client.email,
          quote.reference,
          message,
          `${appUrl}/quote/view/${rawToken}`,
        );
        if (delivery.error) throw new Error("Échec d'envoi Resend.");
      } catch (deliveryError) {
        await prisma.quotePublicAccess.delete({ where: { id: access.id } }).catch(() => undefined);
        throw deliveryError;
      }

      const sentAt = new Date();
      await prisma.$transaction([
        prisma.quoteReminder.create({
          data: { quoteId: quote.id, sentAt, channel: "EMAIL", createdByUserId: null },
        }),
        prisma.quotePublicAccess.updateMany({
          where: { quoteId: quote.id, id: { not: access.id }, revokedAt: null },
          data: { revokedAt: sentAt },
        }),
      ]);
      sent += 1;
    } catch (error) {
      errors.push({ id: quote.id, error: error instanceof Error ? error.message : "erreur inconnue" });
    }
  }

  return { sent, skipped, errors };
}

async function sendAutomaticInvoiceReminders(now: Date) {
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["ENVOYEE", "EN_RETARD"] },
      organization: { invoiceReminderAutoSend: true },
    },
    include: {
      client: true,
      organization: { select: organizationSignatureSelect },
      reminders: { select: { sentAt: true }, orderBy: { sentAt: "desc" } },
      payments: { select: { status: true, amountCents: true, feeCents: true, refundedCents: true, paidAt: true } },
      creditNotes: { select: { status: true, amountCents: true } },
    },
  });

  let sent = 0;
  let skipped = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const invoice of invoices) {
    try {
      if (!invoice.client?.email || !invoice.organization) {
        skipped += 1;
        continue;
      }
      const state = getInvoiceReminderState({
        status: invoice.status,
        dueDate: invoice.dueDate,
        sentAt: invoice.sentAt,
        createdAt: invoice.createdAt,
        reminders: invoice.reminders,
        delay1Days: invoice.organization.invoiceReminderDelay1Days,
        delay2Days: invoice.organization.invoiceReminderDelay2Days,
        delay3Days: invoice.organization.invoiceReminderDelay3Days,
        now,
      });
      if (!state.eligible || !state.level) {
        skipped += 1;
        continue;
      }
      if (isInvoiceReminderCoolingDown(invoice.reminders[0]?.sentAt ?? null, now)) {
        skipped += 1;
        continue;
      }

      const creditedCents = sumIssuedCreditsCents(invoice.creditNotes);
      const paymentState = computeInvoicePaymentState(invoice.amountCents, invoice.payments, creditedCents);
      if (paymentState.isFullyPaid) {
        skipped += 1;
        continue;
      }

      // Vérification au plus près de l'envoi : la facture a pu être réglée
      // entretemps, pendant le passage de la tâche planifiée.
      const stillDue = await prisma.invoice.findFirst({
        where: { id: invoice.id, status: { in: ["ENVOYEE", "EN_RETARD"] } },
        select: { id: true },
      });
      if (!stillDue) {
        skipped += 1;
        continue;
      }

      const clientName = invoice.client.type === "PROFESSIONNEL"
        ? invoice.client.companyName?.trim() || "Madame, Monsieur"
        : `${invoice.client.firstName ?? ""} ${invoice.client.lastName ?? ""}`.trim() || "Madame, Monsieur";
      const message = buildStandardInvoiceReminderMessage({
        level: state.level,
        clientName,
        reference: invoice.reference,
        dueDate: invoice.dueDate,
        remainingCents: paymentState.remainingCents,
        artisanSignature: resolveSignature(invoice.organization),
      });

      const rawToken = createInvoicePublicToken();
      const access = await prisma.invoicePublicAccess.create({
        data: { invoiceId: invoice.id, tokenHash: hashInvoicePublicToken(rawToken) },
        select: { id: true },
      });

      try {
        const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://myforge.online").replace(/\/$/, "");
        const delivery = await sendInvoiceReminderEmail(
          invoice.client.email,
          invoice.reference,
          message,
          `${appUrl}/facture/${rawToken}`,
        );
        if (delivery.error) throw new Error("Échec d'envoi Resend.");
      } catch (deliveryError) {
        await prisma.invoicePublicAccess.delete({ where: { id: access.id } }).catch(() => undefined);
        throw deliveryError;
      }

      const sentAt = new Date();
      await prisma.$transaction([
        prisma.invoiceReminder.create({
          data: { invoiceId: invoice.id, sentAt, channel: "EMAIL", createdByUserId: null },
        }),
        prisma.invoicePublicAccess.updateMany({
          where: { invoiceId: invoice.id, id: { not: access.id }, revokedAt: null },
          data: { revokedAt: sentAt },
        }),
      ]);
      sent += 1;
    } catch (error) {
      errors.push({ id: invoice.id, error: error instanceof Error ? error.message : "erreur inconnue" });
    }
  }

  return { sent, skipped, errors };
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const [quotes, invoices] = await Promise.all([
    sendAutomaticQuoteReminders(now),
    sendAutomaticInvoiceReminders(now),
  ]);

  if (quotes.errors.length > 0 || invoices.errors.length > 0) {
    console.error("CRON REMINDERS ERRORS", { quotes: quotes.errors, invoices: invoices.errors });
  }

  return NextResponse.json({ ranAt: now.toISOString(), quotes, invoices });
}
