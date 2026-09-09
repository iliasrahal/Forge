import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";

type RouteProps = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteProps) {
  try {
    const context = await requireWorkspaceContext("write");
    const { id } = await params;

    const creditNote = await prisma.creditNote.findFirst({
      where: { id, organizationId: context.workspace.id },
      select: { id: true, status: true },
    });

    if (!creditNote) {
      return NextResponse.json(
        { error: "Avoir introuvable." },
        { status: 404 },
      );
    }
    if (creditNote.status !== "BROUILLON") {
      return NextResponse.json(
        { error: "Un avoir émis ne peut pas être supprimé." },
        { status: 409 },
      );
    }

    await prisma.creditNote.delete({ where: { id: creditNote.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error("DELETE CREDIT NOTE ERROR", error);
    return NextResponse.json(
      { error: "Impossible de supprimer l’avoir." },
      { status: 500 },
    );
  }
}
