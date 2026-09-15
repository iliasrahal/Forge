import { NextResponse } from "next/server";

import { validateWorkspaceMaterialInput } from "@/src/lib/material-catalog";
import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

type Context = { params: Promise<{ materialId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const context = await requireWorkspaceContext("write");
    const { materialId } = await params;
    const existing = await prisma.workspaceMaterial.findFirst({ where: { id: materialId, organizationId: context.workspace.id } });
    if (!existing) return NextResponse.json({ error: "Ce matériel est introuvable dans cet espace." }, { status: 404 });
    const validation = validateWorkspaceMaterialInput(await request.json());
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
    const material = await prisma.workspaceMaterial.update({ where: { id: existing.id }, data: { ...validation.data, catalogItemId: existing.catalogItemId } });
    return NextResponse.json({ material });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("MATERIAL UPDATE ERROR", error);
    return NextResponse.json({ error: "Impossible de modifier le matériel." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const context = await requireWorkspaceContext("write");
    const { materialId } = await params;
    const existing = await prisma.workspaceMaterial.findFirst({ where: { id: materialId, organizationId: context.workspace.id }, select: { id: true, catalogItemId: true } });
    if (!existing) return NextResponse.json({ error: "Ce matériel est introuvable dans cet espace." }, { status: 404 });
    if (existing.catalogItemId) {
      await prisma.workspaceMaterial.update({ where: { id: existing.id }, data: { active: false } });
    } else {
      await prisma.workspaceMaterial.delete({ where: { id: existing.id } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("MATERIAL DELETE ERROR", error);
    return NextResponse.json({ error: "Impossible de retirer le matériel." }, { status: 500 });
  }
}
