import { NextResponse } from "next/server";

import { sendQuoteReminderEmail } from "@/src/lib/email";
import { prisma } from "@/src/lib/prisma";
import { createQuotePublicToken, hashQuotePublicToken } from "@/src/lib/quote-public-access";
import { isReminderCoolingDown, validateReminderMessage } from "@/src/lib/quote-reminders";
import { checkRateLimit } from "@/src/lib/rate-limit";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

type RouteProps = { params: Promise<{ quoteId: string }> };

export async function POST(request: Request, { params }: RouteProps) {
  let pendingAccessId: string | null = null;
  try {
    const context = await requireWorkspaceContext("write");
    const { quoteId } = await params;
    const limit = checkRateLimit(`quote-reminder-send:${context.user.id}:${quoteId}`, 1, 30_000);
    if (!limit.allowed) return NextResponse.json({ error: "Trop de tentatives. Réessayez dans un instant." }, { status: 429 });
    const body = (await request.json()) as Record<string, unknown>;
    const validatedMessage = validateReminderMessage(body.message);
    if (validatedMessage.error) return NextResponse.json({ error: validatedMessage.error }, { status: 400 });

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, organizationId: context.workspace.id },
      include: {
        client: true,
        reminders: { select: { sentAt: true }, orderBy: { sentAt: "desc" }, take: 1 },
      },
    });
    if (!quote) return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });
    if (quote.status !== "ENVOYE") return NextResponse.json({ error: "Ce devis ne peut plus être relancé." }, { status: 409 });
    if (!quote.client.email) return NextResponse.json({ error: "Aucune adresse e-mail n’est renseignée pour ce client." }, { status: 400 });
    if (isReminderCoolingDown(quote.reminders[0]?.sentAt ?? null)) {
      return NextResponse.json({ error: "Une relance a déjà été envoyée récemment. Réessayez plus tard." }, { status: 409 });
    }

    // Nouvelle vérification au plus près de l'appel au fournisseur : le devis
    // peut avoir été accepté après l'ouverture du panneau.
    const stillSent = await prisma.quote.findFirst({
      where: { id: quote.id, organizationId: context.workspace.id, status: "ENVOYE" },
      select: { id: true },
    });
    if (!stillSent) return NextResponse.json({ error: "Ce devis ne peut plus être relancé." }, { status: 409 });

    const rawToken = createQuotePublicToken();
    const access = await prisma.quotePublicAccess.create({
      data: { quoteId: quote.id, tokenHash: hashQuotePublicToken(rawToken) },
      select: { id: true },
    });
    pendingAccessId = access.id;
    const origin = new URL(request.url).origin;
    const delivery = await sendQuoteReminderEmail(
      quote.client.email,
      quote.reference,
      validatedMessage.value!,
      `${origin}/quote/view/${rawToken}`,
    );
    if (delivery.error) throw new Error("La relance n’a pas pu être envoyée.");
    pendingAccessId = null;

    const sentAt = new Date();
    await prisma.$transaction([
      prisma.quoteReminder.create({
        data: { quoteId: quote.id, sentAt, channel: "EMAIL", createdByUserId: context.user.id },
      }),
      prisma.quotePublicAccess.updateMany({
        where: { quoteId: quote.id, id: { not: access.id }, revokedAt: null },
        data: { revokedAt: sentAt },
      }),
    ]);
    return NextResponse.json({ success: true, sentAt });
  } catch (error) {
    if (pendingAccessId) {
      await prisma.quotePublicAccess.delete({ where: { id: pendingAccessId } }).catch(() => undefined);
    }
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("SEND QUOTE REMINDER ERROR", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "La relance n’a pas pu être envoyée." }, { status: 500 });
  }
}
