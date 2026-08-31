import OpenAI from "openai";

import {
  MAX_PHOTO_SIZE,
  MAX_REPORT_IMAGES,
  MAX_VIDEO_FRAMES,
} from "@/src/lib/photoConfig";
import {
  fileToDataUrl,
  isImage,
} from "@/src/lib/photoFiles.server";
import { PHOTO_SAFETY_RULES } from "@/src/lib/photoPrompts";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";

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
    await requireWorkspaceContext("useForge");
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

    const contentType =
      request.headers.get("content-type") ?? "";

    let intervention = "";
    let photos: File[] = [];
    let videoFrameCount = 0;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const interventionValue = formData.get("intervention");

      intervention =
        typeof interventionValue === "string"
          ? interventionValue.trim()
          : "";
      photos = formData
        .getAll("photos")
        .filter(
          (value): value is File => value instanceof File,
        );
      const videoFrameCountValue = formData.get("videoFrameCount");
      const parsedVideoFrameCount = Number(videoFrameCountValue);
      videoFrameCount = Number.isInteger(parsedVideoFrameCount)
        ? parsedVideoFrameCount
        : 0;
    } else {
      const body = await request.json();
      intervention =
        typeof body.intervention === "string"
          ? body.intervention.trim()
          : "";
    }

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

    if (photos.length > MAX_REPORT_IMAGES) {
      return Response.json(
        { error: "La demande contient trop d’images à analyser." },
        { status: 400 },
      );
    }

    if (
      videoFrameCount < 0 ||
      videoFrameCount > MAX_VIDEO_FRAMES ||
      videoFrameCount > photos.length
    ) {
      return Response.json(
        { error: "Les images extraites de la vidéo sont invalides." },
        { status: 400 },
      );
    }

    for (const photo of photos) {
      if (!isImage(photo)) {
        return Response.json(
          { error: "Tous les fichiers doivent être des images." },
          { status: 400 },
        );
      }

      if (photo.size > MAX_PHOTO_SIZE) {
        return Response.json(
          { error: "Une photo dépasse la taille maximale de 8 Mo." },
          { status: 400 },
        );
      }
    }

    const imageContent = await Promise.all(
      photos.map(async (photo) => ({
        type: "input_image" as const,
        image_url: await fileToDataUrl(photo),
        detail: "auto" as const,
      })),
    );

    const response = await openai.responses.create({
      model: "gpt-5",
      instructions: `
Tu es Forge, un assistant administratif destiné aux plombiers et chauffagistes.

Transforme les notes brutes de l'artisan en un compte rendu professionnel, clair et concis.

Règles :
- N'invente aucune information absente du texte.
${photos.length > 0 ? `- ${PHOTO_SAFETY_RULES.replaceAll("\n", "\n- ")}` : ""}
${videoFrameCount > 0 ? `- Les ${videoFrameCount} dernières images ont été extraites à différents moments d'une seule vidéo et sont présentées dans l'ordre chronologique. Analyse uniquement ces images représentatives, sans prétendre avoir visionné ou compris intégralement la vidéo.` : ""}
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
      input:
        photos.length > 0
          ? [
              {
                role: "user",
                content: [
                  {
                    type: "input_text" as const,
                    text: intervention,
                  },
                  ...imageContent,
                ],
              },
            ]
          : intervention,
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
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return Response.json(accessError.body, { status: accessError.status });
    }
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
