import { NextResponse } from "next/server";

import { deleteMaterialImage, uploadMaterialImage, validateMaterialImage, WORKSPACE_MATERIAL_IMAGE_BUCKET, workspaceMaterialObjectKey } from "@/src/lib/material-image-storage.server";
import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

export async function POST(request: Request, { params }: { params: Promise<{ materialId: string }> }) {
  let uploadedObjectKey: string | null = null;
  try {
    const context = await requireWorkspaceContext("write");
    const { materialId } = await params;
    const material = await prisma.workspaceMaterial.findFirst({
      where: { id: materialId, organizationId: context.workspace.id, active: true },
      select: { id: true },
    });
    if (!material) return NextResponse.json({ error: "Matériel introuvable." }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) return NextResponse.json({ error: "Ajoute une image." }, { status: 400 });
    const validated = await validateMaterialImage(file);
    const duplicate = await prisma.workspaceMaterialImage.findUnique({
      where: { workspaceMaterialId_checksum: { workspaceMaterialId: material.id, checksum: validated.checksum } },
      select: { id: true },
    });
    if (duplicate) return NextResponse.json({ error: "Cette image est déjà associée à ce matériel." }, { status: 409 });

    const objectKey = workspaceMaterialObjectKey(context.workspace.id, material.id, validated.mimeType);
    await uploadMaterialImage(WORKSPACE_MATERIAL_IMAGE_BUCKET, objectKey, validated.buffer, validated.mimeType);
    uploadedObjectKey = objectKey;
    const image = await prisma.$transaction(async (tx) => {
      const existingCount = await tx.workspaceMaterialImage.count({ where: { workspaceMaterialId: material.id } });
      const makePrimary = existingCount === 0 || formData.get("isPrimary") === "true";
      if (makePrimary) await tx.workspaceMaterialImage.updateMany({ where: { workspaceMaterialId: material.id }, data: { isPrimary: false } });
      return tx.workspaceMaterialImage.create({
        data: {
          workspaceMaterialId: material.id,
          organizationId: context.workspace.id,
          objectKey,
          kind: "PRODUCT",
          isPrimary: makePrimary,
          position: existingCount,
          mimeType: validated.mimeType,
          width: validated.width,
          height: validated.height,
          checksum: validated.checksum,
        },
      });
    });
    return NextResponse.json({ image: { id: image.id, isPrimary: image.isPrimary, width: image.width, height: image.height, mimeType: image.mimeType } }, { status: 201 });
  } catch (error) {
    if (uploadedObjectKey) await deleteMaterialImage(WORKSPACE_MATERIAL_IMAGE_BUCKET, uploadedObjectKey);
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    const code = error instanceof Error ? error.message : "";
    if (code.startsWith("INVALID_IMAGE_")) return NextResponse.json({ error: "L’image doit être un fichier JPEG, PNG ou WebP valide de moins de 5 Mo." }, { status: 400 });
    if (code === "MATERIAL_STORAGE_NOT_CONFIGURED") return NextResponse.json({ error: "Le stockage des images matériel n’est pas configuré." }, { status: 503 });
    console.error("WORKSPACE MATERIAL IMAGE UPLOAD ERROR", error);
    return NextResponse.json({ error: "Impossible d’ajouter cette image pour le moment." }, { status: 500 });
  }
}
