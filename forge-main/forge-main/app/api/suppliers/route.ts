import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

export async function GET(request: Request) {
  try {
    const context = await requireWorkspaceContext("read");
    const search = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";
    const suppliers = await prisma.supplier.findMany({
      where: { organizationId: context.workspace.id, ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { companyName: { contains: search, mode: "insensitive" } }] } : {}) },
      orderBy: [{ active: "desc" }, { name: "asc" }], take: 100,
    });
    return NextResponse.json({ suppliers });
  } catch (error) {
    const access = getWorkspaceErrorResponse(error); if (access) return NextResponse.json(access.body, { status: access.status });
    return NextResponse.json({ error: "Impossible de charger les fournisseurs." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireWorkspaceContext("write");
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 160) : "";
    if (!name) return NextResponse.json({ error: "Le nom du fournisseur est obligatoire." }, { status: 400 });
    const optional = (value: unknown, max = 500) => typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
    const supplier = await prisma.supplier.create({ data: { organizationId: context.workspace.id, name, companyName: optional(body.companyName, 160), phone: optional(body.phone, 50), email: optional(body.email, 200), address: optional(body.address), website: optional(body.website, 300), accountReference: optional(body.accountReference, 100), notes: optional(body.notes, 2000) } });
    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    const access = getWorkspaceErrorResponse(error); if (access) return NextResponse.json(access.body, { status: access.status });
    return NextResponse.json({ error: "Impossible de créer ce fournisseur." }, { status: 500 });
  }
}
