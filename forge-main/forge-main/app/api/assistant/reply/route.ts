import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";
import { checkRateLimit } from "@/src/lib/rate-limit";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { user } = await requireWorkspaceContext("useForge");

    const limit = checkRateLimit(`assistant-reply:${user.id}`, 30, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Trop de demandes rapprochées. Réessaie dans un instant." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        },
      );
    }

    const body = await request.json();
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        {
          error:
            "Le message du client est obligatoire.",
        },
        {
          status: 400,
        },
      );
    }

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
Tu es Forge, un assistant administratif pour les plombiers et chauffagistes.

Ta mission est de rédiger une réponse professionnelle, claire, naturelle et prête à envoyer au client.

Règles :
- Réponds uniquement avec le message final.
- N’ajoute aucun commentaire avant ou après.
- Utilise un ton poli, humain et professionnel.
- Reste concis.
- N’invente pas d’horaire, de prix ou d’engagement qui n’est pas indiqué.
- Lorsque des informations manquent, formule une réponse prudente.
- Commence par "Bonjour," si le nom du client n’est pas connu.
- Termine par une formule simple comme "Cordialement,".
            `.trim(),
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.5,
      });

    const reply =
      completion.choices[0]?.message?.content?.trim();

    if (!reply) {
      return NextResponse.json(
        {
          error:
            "Forge n’a pas réussi à préparer la réponse.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      reply,
    });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error(
      "Erreur lors de la génération de la réponse :",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Impossible de générer la réponse pour le moment.",
      },
      {
        status: 500,
      },
    );
  }
}
