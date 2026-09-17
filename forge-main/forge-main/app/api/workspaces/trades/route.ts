import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { normalizeTradeSlugs } from "@/src/lib/trades";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

export async function PATCH(request: Request) {
  try {
    const context = await requireWorkspaceContext("write");
    const tradeSlugs = normalizeTradeSlugs((await request.json()).tradeSlugs);
    await prisma.organization.update({ where: { id: context.workspace.id }, data: { tradeSlugs } });
    return NextResponse.json({ tradeSlugs });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    return NextResponse.json({ error: "Impossible d’enregistrer les métiers." }, { status: 500 });
  }
}
