import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const context = await requireWorkspaceContext("write"); const { id } = await params; const body = await request.json();
    const current = await prisma.supplier.findFirst({ where: { id, organizationId: context.workspace.id } });
    if (!current) return NextResponse.json({ error: "Fournisseur introuvable." }, { status: 404 });
    const optional = (value: unknown, max = 500) => typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 160) : current.name;
    if (!name) return NextResponse.json({ error: "Le nom est obligatoire." }, { status: 400 });
    const supplier = await prisma.supplier.update({ where: { id }, data: { name, companyName: optional(body.companyName, 160), phone: optional(body.phone, 50), email: optional(body.email, 200), address: optional(body.address), website: optional(body.website, 300), accountReference: optional(body.accountReference, 100), notes: optional(body.notes, 2000), active: typeof body.active === "boolean" ? body.active : current.active } });
    return NextResponse.json({ supplier });
  } catch (error) { const access = getWorkspaceErrorResponse(error); if (access) return NextResponse.json(access.body, { status: access.status }); return NextResponse.json({ error: "Impossible de modifier ce fournisseur." }, { status: 500 }); }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const context = await requireWorkspaceContext("write"); const { id } = await params;
    const result = await prisma.supplier.updateMany({ where: { id, organizationId: context.workspace.id }, data: { active: false } });
    if (!result.count) return NextResponse.json({ error: "Fournisseur introuvable." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) { const access = getWorkspaceErrorResponse(error); if (access) return NextResponse.json(access.body, { status: access.status }); return NextResponse.json({ error: "Impossible de désactiver ce fournisseur." }, { status: 500 }); }
}
