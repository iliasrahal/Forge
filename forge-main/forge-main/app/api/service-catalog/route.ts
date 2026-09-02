import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { validateServiceCatalogInput } from "@/src/lib/service-catalog";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";

export async function GET() {
  try {
    const context = await requireWorkspaceContext("read");
    const services = await prisma.serviceCatalogItem.findMany({
      where: { organizationId: context.workspace.id },
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      services,
      permissions: context.permissions,
      workspace: { id: context.workspace.id, name: context.workspace.name },
    });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error("Erreur lecture prestations :", error);
    return NextResponse.json(
      { error: "Impossible de charger les prestations." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireWorkspaceContext("write");
    const validation = validateServiceCatalogInput(await request.json());

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const service = await prisma.serviceCatalogItem.create({
      data: {
        ...validation.data,
        organizationId: context.workspace.id,
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error("Erreur création prestation :", error);
    return NextResponse.json(
      { error: "Impossible de créer la prestation." },
      { status: 500 },
    );
  }
}
