import { NextResponse } from "next/server";

import { validateMaterialIdentification } from "@/src/lib/material-analysis";
import { getEffectiveMaterialsForWorkspace } from "@/src/lib/material-catalog.server";
import { recommendMaterials } from "@/src/lib/material-matching";
import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ analysisId: string }> },
) {
  try {
    const context = await requireWorkspaceContext("useForge");
    const { analysisId } = await params;
    const analysis = await prisma.materialAnalysis.findFirst({
      where: {
        id: analysisId,
        organizationId: context.workspace.id,
        requestedById: context.user.id,
        status: { in: ["COMPLETED", "NEEDS_INPUT"] },
      },
      select: { result: true },
    });
    if (!analysis?.result || typeof analysis.result !== "object" || Array.isArray(analysis.result)) {
      return NextResponse.json({ error: "Analyse introuvable." }, { status: 404 });
    }

    const identification = validateMaterialIdentification(
      (analysis.result as Record<string, unknown>).identification,
    );
    const materials = await getEffectiveMaterialsForWorkspace(context.workspace.id);
    const matches = recommendMaterials(identification, materials);
    return NextResponse.json({ matches });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("MATERIAL PHOTO MATCHES ERROR", error);
    return NextResponse.json({ error: "Impossible de rechercher du matériel pour le moment." }, { status: 500 });
  }
}
