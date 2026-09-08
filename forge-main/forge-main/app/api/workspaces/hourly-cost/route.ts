import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

export async function PATCH(request: Request) {
  try {
    const workspace = await requireWorkspaceContext("write");
    const body = await request.json();
    const euros = Number(String(body.hourlyCost).replace(",", "."));
    if (!Number.isFinite(euros) || euros < 0 || euros > 10000) return NextResponse.json({ error: "Coût horaire invalide." }, { status: 400 });
    const membership = await prisma.organizationMember.update({
      where: { userId_organizationId: { userId: workspace.user.id, organizationId: workspace.workspace.id } },
      data: { hourlyCostCents: Math.round(euros * 100) },
      select: { hourlyCostCents: true },
    });
    return NextResponse.json({ hourlyCostCents: membership.hourlyCostCents });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    return NextResponse.json({ error: "Impossible d’enregistrer le coût horaire." }, { status: 500 });
  }
}
