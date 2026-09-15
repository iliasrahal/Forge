import { NextResponse } from "next/server";

import { createMaterialImageSignedUrl, MATERIAL_CATALOG_IMAGE_BUCKET, WORKSPACE_MATERIAL_IMAGE_BUCKET } from "@/src/lib/material-image-storage.server";
import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

export async function GET(_request: Request, { params }: { params: Promise<{ imageRef: string }> }) {
  try {
    const context = await requireWorkspaceContext("read");
    const { imageRef } = await params;
    const separator = imageRef.indexOf(":");
    if (separator < 1) return NextResponse.json({ error: "Image introuvable." }, { status: 404 });
    const scope = imageRef.slice(0, separator);
    const id = imageRef.slice(separator + 1);
    if (scope === "catalog") {
      const image = await prisma.materialCatalogImage.findUnique({ where: { id }, select: { objectKey: true } });
      if (!image) return NextResponse.json({ error: "Image introuvable." }, { status: 404 });
      return NextResponse.redirect(await createMaterialImageSignedUrl(MATERIAL_CATALOG_IMAGE_BUCKET, image.objectKey));
    }
    if (scope === "workspace") {
      const image = await prisma.workspaceMaterialImage.findFirst({ where: { id, organizationId: context.workspace.id }, select: { objectKey: true } });
      if (!image) return NextResponse.json({ error: "Image introuvable." }, { status: 404 });
      return NextResponse.redirect(await createMaterialImageSignedUrl(WORKSPACE_MATERIAL_IMAGE_BUCKET, image.objectKey));
    }
    return NextResponse.json({ error: "Image introuvable." }, { status: 404 });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("MATERIAL IMAGE READ ERROR", error);
    return NextResponse.json({ error: "Impossible de charger cette image." }, { status: 500 });
  }
}
