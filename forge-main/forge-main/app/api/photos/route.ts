import OpenAI from "openai";
import { NextResponse } from "next/server";

import {
  detectPhotoIntent,
  getPhotoPrompt,
} from "@/src/lib/photoPrompts";
import {
  MAX_PHOTOS,
  MAX_PHOTO_SIZE,
} from "@/src/lib/photoConfig";
import {
  fileToDataUrl,
  isImage,
} from "@/src/lib/photoFiles.server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function cleanJsonOutput(output: string) {
  return output
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function POST(request: Request) {
  try {
    const formData =
      await request.formData();

    const messageValue =
      formData.get("message");

    const message =
      typeof messageValue === "string" &&
      messageValue.trim()
        ? messageValue.trim()
        : "Décris ce que montrent ces photos.";

    const photos = formData
      .getAll("photos")
      .filter(
        (value): value is File =>
          value instanceof File,
      );

    if (photos.length === 0) {
      return NextResponse.json(
        {
          error:
            "Sélectionne au moins une photo.",
        },
        {
          status: 400,
        },
      );
    }

    if (photos.length > MAX_PHOTOS) {
      return NextResponse.json(
        {
          error: `Tu peux sélectionner au maximum ${MAX_PHOTOS} photos.`,
        },
        {
          status: 400,
        },
      );
    }

    for (const photo of photos) {
      if (!isImage(photo)) {
        return NextResponse.json(
          {
            error:
              "Tous les fichiers doivent être des images.",
          },
          {
            status: 400,
          },
        );
      }

      if (photo.size > MAX_PHOTO_SIZE) {
        return NextResponse.json(
          {
            error:
              "Une photo dépasse la taille maximale de 8 Mo.",
          },
          {
            status: 400,
          },
        );
      }
    }

    const photoIntent =
      detectPhotoIntent(message);

    const systemPrompt =
      getPhotoPrompt(photoIntent);

    const imageContent =
      await Promise.all(
        photos.map(async (photo) => ({
          type: "input_image" as const,
          image_url:
            await fileToDataUrl(photo),
          detail: "auto" as const,
        })),
      );

    const response =
      await openai.responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: systemPrompt,
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: message,
              },
              ...imageContent,
            ],
          },
        ],
      });

    const output =
      response.output_text.trim();

    if (!output) {
      throw new Error(
        "Aucune analyse n’a été générée.",
      );
    }

    if (photoIntent === "quote") {
      const cleanedOutput =
        cleanJsonOutput(output);

      const parsed = JSON.parse(
        cleanedOutput,
      ) as {
        analysis?: unknown;
        title?: unknown;
        description?: unknown;
      };

      const analysis =
        typeof parsed.analysis === "string"
          ? parsed.analysis.trim()
          : "";

      const title =
        typeof parsed.title === "string"
          ? parsed.title.trim()
          : "";

      const description =
        typeof parsed.description === "string"
          ? parsed.description.trim()
          : "";

      if (!title || !description) {
        throw new Error(
          "Le brouillon du devis est incomplet.",
        );
      }

      return NextResponse.json({
        success: true,
        photoCount: photos.length,
        photoIntent,
        analysis:
          analysis ||
          "J’ai analysé les photos et préparé le devis.",
        title,
        description,
      });
    }

    return NextResponse.json({
      success: true,
      photoCount: photos.length,
      photoIntent,
      analysis: output,
      title: null,
      description: null,
    });
  } catch (error) {
    console.error(
      "Erreur lors de l’analyse des photos :",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Impossible d’analyser les photos pour le moment.",
      },
      {
        status: 500,
      },
    );
  }
}
