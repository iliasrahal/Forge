import { createHash } from "node:crypto";

import OpenAI from "openai";
import { NextResponse } from "next/server";

import { MATERIAL_ANALYSIS_JSON_SCHEMA, MATERIAL_ANALYSIS_MODEL, MATERIAL_ANALYSIS_PROMPT, validateMaterialIdentification } from "@/src/lib/material-analysis";
import { MAX_PHOTOS, MAX_PHOTO_SIZE } from "@/src/lib/photoConfig";
import { fileToDataUrl, hasValidImageSignature, isImage } from "@/src/lib/photoFiles.server";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limit";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

export async function POST(request: Request) {
  let analysisId: string | null = null;
  try {
    const context = await requireWorkspaceContext("useForge");
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "L’analyse photo n’est pas configurée sur cet environnement." }, { status: 503 });
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const limit = checkRateLimit(`material-photos:${context.user.id}`, 8, 60_000);
    if (!limit.allowed) return NextResponse.json({ error: "Trop d’analyses rapprochées. Réessaie dans un instant." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
    const formData = await request.formData();
    const photos = formData.getAll("photos").filter((value): value is File => value instanceof File);
    if (!photos.length || photos.length > MAX_PHOTOS) return NextResponse.json({ error: `Ajoute entre 1 et ${MAX_PHOTOS} photos.` }, { status: 400 });
    for (const photo of photos) {
      if (!isImage(photo) || photo.size > MAX_PHOTO_SIZE || !(await hasValidImageSignature(photo))) {
        return NextResponse.json({ error: "Une photo est invalide ou dépasse 8 Mo." }, { status: 400 });
      }
    }
    const notes = typeof formData.get("notes") === "string" ? String(formData.get("notes")).trim().slice(0, 1000) : "";
    const previousContext = typeof formData.get("context") === "string" ? String(formData.get("context")).trim().slice(0, 4000) : "";
    const buffers = await Promise.all(photos.map((photo) => photo.arrayBuffer()));
    const inputHash = createHash("sha256")
      .update(Buffer.concat(buffers.map((buffer) => Buffer.from(buffer))))
      .update(notes)
      .update(previousContext)
      .digest("hex");
    const cached = await prisma.materialAnalysis.findFirst({
      where: {
        organizationId: context.workspace.id,
        requestedById: context.user.id,
        inputHash,
        status: { in: ["COMPLETED", "NEEDS_INPUT"] },
        createdAt: { gte: new Date(Date.now() - 10 * 60_000) },
      },
      orderBy: { createdAt: "desc" },
    });
    if (cached?.result && typeof cached.result === "object" && !Array.isArray(cached.result)) {
      const cachedResult = cached.result as Record<string, unknown>;
      return NextResponse.json({ analysisId: cached.id, status: cached.status, identification: cachedResult.identification, matches: [], cached: true });
    }
    const analysis = await prisma.materialAnalysis.create({ data: { organizationId: context.workspace.id, requestedById: context.user.id, model: MATERIAL_ANALYSIS_MODEL, photoCount: photos.length, inputHash } });
    analysisId = analysis.id;
    const imageContent = await Promise.all(photos.map(async (photo) => ({ type: "input_image" as const, image_url: await fileToDataUrl(photo), detail: "high" as const })));
    const response = await openai.responses.create({
      model: MATERIAL_ANALYSIS_MODEL,
      store: false,
      text: { format: { type: "json_schema", name: "material_identification", strict: true, schema: MATERIAL_ANALYSIS_JSON_SCHEMA } },
      input: [
        { role: "system", content: [{ type: "input_text", text: MATERIAL_ANALYSIS_PROMPT }] },
        { role: "user", content: [{ type: "input_text", text: [notes ? `Contexte artisan : ${notes}` : "", previousContext ? `Contexte de l'analyse précédente : ${previousContext}` : ""].filter(Boolean).join("\n") || "Identifie prudemment le matériel visible." }, ...imageContent] },
      ],
    });
    const identification = validateMaterialIdentification(JSON.parse(response.output_text));
    const needsInput = Boolean(
      identification.questions.length ||
      identification.missingCriticalCharacteristics.length,
    );
    const status = needsInput ? "NEEDS_INPUT" : "COMPLETED";
    const result = { identification };
    await prisma.materialAnalysis.update({ where: { id: analysis.id }, data: { status, result } });
    return NextResponse.json({ analysisId: analysis.id, status, ...result, matches: [] });
  } catch (error) {
    if (analysisId) await prisma.materialAnalysis.update({ where: { id: analysisId }, data: { status: "FAILED", errorCode: "ANALYSIS_FAILED" } }).catch(() => undefined);
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("MATERIAL PHOTO ANALYSIS ERROR", error);
    return NextResponse.json({ error: "Impossible d’analyser ces photos pour le moment." }, { status: 500 });
  }
}
