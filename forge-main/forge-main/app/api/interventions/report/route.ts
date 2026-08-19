import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type InterventionReport = {
  intervention: string;
  diagnostic: string;
  travaux: string;
  recommandation: string;
};

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          error: "La clé OpenAI est absente.",
        },
        {
          status: 500,
        },
      );
    }

    const body = await request.json();

    const intervention =
      typeof body.intervention === "string"
        ? body.intervention.trim()
        : "";

    if (!intervention) {
      return Response.json(
        {
          error: "Raconte ton intervention avant de continuer.",
        },
        {
          status: 400,
        },
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5",
      instructions: `
Tu es Forge, un assistant administratif destiné aux plombiers et chauffagistes.

Transforme les notes brutes de l'artisan en un compte rendu professionnel, clair et concis.

Règles :
- N'invente aucune information absente du texte.
- Utilise un vocabulaire professionnel mais facile à comprendre.
- Corrige les fautes et reformule les phrases.
- Ne mentionne jamais l'intelligence artificielle.
- Si une information est absente, écris "Non précisé".
- Réponds uniquement avec un objet JSON valide.

Format attendu :

{
  "intervention": "...",
  "diagnostic": "...",
  "travaux": "...",
  "recommandation": "..."
}
      `,
      input: intervention,
    });

    const content = response.output_text.trim();

    if (!content) {
      throw new Error("Réponse OpenAI vide.");
    }

    const cleanedContent = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "");

    const report = JSON.parse(
      cleanedContent,
    ) as InterventionReport;

    return Response.json(report);
  } catch (error) {
    console.error(
      "Erreur pendant la génération du compte rendu :",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Erreur inconnue.";

    return Response.json(
      {
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}