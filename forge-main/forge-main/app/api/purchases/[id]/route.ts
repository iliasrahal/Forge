import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";
type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const context = await requireWorkspaceContext("write"); const { id } = await params;
    const purchase = await prisma.purchase.findFirst({ where: { id, organizationId: context.workspace.id }, select: { id: true, _count: { select: { allocations: true, expenses: true } } } });
    if (!purchase) return NextResponse.json({ error: "Achat introuvable." }, { status: 404 });
    if (purchase._count.allocations || purchase._count.expenses) return NextResponse.json({ error: "Cet achat participe déjà à l’historique d’un chantier et ne peut pas être supprimé. Annule-le pour conserver la traçabilité." }, { status: 409 });
    await prisma.purchase.update({ where: { id }, data: { status: "VOIDED" } });
    return NextResponse.json({ success: true });
  } catch (error) { const access = getWorkspaceErrorResponse(error); if (access) return NextResponse.json(access.body, { status: access.status }); return NextResponse.json({ error: "Impossible d’annuler cet achat." }, { status: 500 }); }
}
