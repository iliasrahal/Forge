import OpenAI from "openai";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { buildStandardReminderMessage, getManualReminderLevel, validateReminderMessage } from "@/src/lib/quote-reminders";
import { checkRateLimit } from "@/src/lib/rate-limit";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

type RouteProps = { params: Promise<{ quoteId: string }> };

export async function POST(_request: Request, { params }: RouteProps) {
  try {
    const context = await requireWorkspaceContext("write");
    const { quoteId } = await params;
    const limit = checkRateLimit(`quote-reminder-prepare:${context.user.id}:${quoteId}`, 10, 60_000);
    if (!limit.allowed) return NextResponse.json({ error: "Trop de demandes. Réessayez dans un instant." }, { status: 429 });

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, organizationId: context.workspace.id },
      include: {
        client: true,
        reminders: { select: { id: true } },
      },
    });
    if (!quote) return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });
    if (quote.status !== "ENVOYE") return NextResponse.json({ error: "Seul un devis envoyé peut être relancé." }, { status: 409 });
    if (!quote.client.email) return NextResponse.json({ error: "Aucune adresse e-mail n’est renseignée pour ce client." }, { status: 400 });

    const clientName = quote.client.type === "PROFESSIONNEL"
      ? quote.client.companyName?.trim() || "Madame, Monsieur"
      : `${quote.client.firstName ?? ""} ${quote.client.lastName ?? ""}`.trim() || "Madame, Monsieur";
    const artisanSignature = context.user.emailSignature?.trim() || context.user.firstName.trim() || "L’équipe Forge";
    const level = getManualReminderLevel(quote.reminders.length);
    const fallback = buildStandardReminderMessage({ level, clientName, reference: quote.reference, sentAt: quote.sentAt, artisanSignature });
    let message = fallback;

    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.35,
          max_tokens: 260,
          messages: [
            { role: "system", content: "Rédige uniquement un e-mail de relance de devis court, courtois, professionnel et non agressif en français. Ne crée aucune information. Conserve la signature fournie. Aucun objet d’e-mail ni markdown." },
            { role: "user", content: `Niveau de relance : ${level}/2\nClient : ${clientName}\nRéférence : ${quote.reference}\nTitre : ${quote.title}\nDernier envoi : ${quote.sentAt?.toISOString() ?? "date inconnue"}\nSignature : ${artisanSignature}` },
          ],
        });
        const generated = validateReminderMessage(response.choices[0]?.message?.content);
        if (generated.value) message = generated.value;
      } catch (error) {
        console.warn("QUOTE REMINDER OPENAI FALLBACK", error);
      }
    }

    return NextResponse.json({ message, level, recipient: quote.client.email });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("PREPARE QUOTE REMINDER ERROR", error);
    return NextResponse.json({ error: "La relance n’a pas pu être préparée." }, { status: 500 });
  }
}
