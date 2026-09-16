import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const workspace = await requireWorkspaceContext("write");
    const { id } = await params;
    const body = await request.json();
    const percent = body.percent === null || body.percent === "" ? null : Number(body.percent);
    if (percent !== null && (!Number.isFinite(percent) || percent < 0 || percent > 100)) {
      return NextResponse.json({ error: "La progression doit être comprise entre 0 et 100 %." }, { status: 400 });
    }
    const result = await prisma.intervention.updateMany({
      where: { id, organizationId: workspace.workspace.id },
      data: { progressBp: percent === null ? null : Math.round(percent * 100) },
    });
    if (!result.count) return NextResponse.json({ error: "Chantier introuvable." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    return NextResponse.json({ error: "Impossible de modifier la progression." }, { status: 500 });
  }
}
