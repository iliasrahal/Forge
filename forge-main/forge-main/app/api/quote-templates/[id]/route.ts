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

    const deleted = await prisma.quoteTemplate.deleteMany({
      where: { id, organizationId: context.workspace.id },
    });

    if (deleted.count !== 1) {
      return NextResponse.json(
        { error: "Modèle introuvable." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error("DELETE QUOTE TEMPLATE ERROR", error);
    return NextResponse.json(
      { error: "Impossible de supprimer le modèle." },
      { status: 500 },
    );
  }
}
