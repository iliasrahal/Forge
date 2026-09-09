import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";
import { isValidLogoDataUrl } from "@/src/lib/org-branding";

export async function POST(request: Request) {
  try {
    const context = await requireWorkspaceContext("write");
    const body = await request.json().catch(() => ({}));
    const value = body.logoDataUrl;

    if (value !== null && !isValidLogoDataUrl(value)) {
      return NextResponse.json(
        {
          error:
            "Le logo doit être une image PNG ou JPEG de moins de 500 Ko.",
        },
        { status: 400 },
      );
    }

    await prisma.organization.update({
      where: { id: context.workspace.id },
      data: { logoDataUrl: value === null ? null : value },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error("UPDATE ORG LOGO ERROR", error);
    return NextResponse.json(
      { error: "Impossible d’enregistrer le logo." },
      { status: 500 },
    );
  }
}
