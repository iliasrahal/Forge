import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { validateServiceCatalogInput } from "@/src/lib/service-catalog";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";

type RouteContext = { params: Promise<{ serviceId: string }> };

async function findWorkspaceService(serviceId: string, organizationId: string) {
  return prisma.serviceCatalogItem.findFirst({
    where: { id: serviceId, organizationId },
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const context = await requireWorkspaceContext("write");
    const { serviceId } = await params;
    const existing = await findWorkspaceService(serviceId, context.workspace.id);

    if (!existing) {
      return NextResponse.json(
        { error: "Cette prestation est introuvable dans cet espace." },
        { status: 404 },
      );
    }

    const validation = validateServiceCatalogInput(await request.json());
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const service = await prisma.serviceCatalogItem.update({
      where: { id: existing.id },
      data: validation.data,
    });

    return NextResponse.json({ service });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error("Erreur modification prestation :", error);
    return NextResponse.json(
      { error: "Impossible de modifier la prestation." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const context = await requireWorkspaceContext("write");
    const { serviceId } = await params;
    const existing = await findWorkspaceService(serviceId, context.workspace.id);

    if (!existing) {
      return NextResponse.json(
        { error: "Cette prestation est introuvable dans cet espace." },
        { status: 404 },
      );
    }

    await prisma.serviceCatalogItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error("Erreur suppression prestation :", error);
    return NextResponse.json(
      { error: "Impossible de supprimer la prestation." },
      { status: 500 },
    );
  }
}
