import { Prisma } from "@/src/generated/prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { getQuoteDeletionBlockReason } from "@/src/lib/quote-deletion";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";

type QuoteRouteProps = {
  params: Promise<{ quoteId: string }>;
};

export async function PATCH(
  request: Request,
  { params }: QuoteRouteProps,
) {
  try {
    const workspaceContext = await requireWorkspaceContext("write");
    const { quoteId } = await params;
    const body = await request.json().catch(() => ({}));

    const percent = Number(String(body.retentionPercent ?? "").replace(",", "."));
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      return NextResponse.json(
        { error: "La retenue doit être comprise entre 0 et 100 %." },
        { status: 400 },
      );
    }

    const updated = await prisma.quote.updateMany({
      where: { id: quoteId, organizationId: workspaceContext.workspace.id },
      data: { retentionBp: Math.round(percent * 100) },
    });

    if (updated.count !== 1) {
      return NextResponse.json(
        { error: "Devis introuvable." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error("PATCH QUOTE ERROR", error);
    return NextResponse.json(
      { error: "Impossible de mettre à jour le devis." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: QuoteRouteProps,
) {
  try {
    const workspaceContext = await requireWorkspaceContext("write");
    const { quoteId } = await params;
    const quote = await prisma.quote.findFirst({
      where: {
        id: quoteId,
        organizationId: workspaceContext.workspace.id,
      },
      select: {
        id: true,
        status: true,
        signature: { select: { id: true } },
        _count: {
          select: {
            invoices: true,
            publicAccesses: true,
            reminders: true,
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Devis introuvable." },
        { status: 404 },
      );
    }

    const blockReason = getQuoteDeletionBlockReason({
      status: quote.status,
      invoiceCount: quote._count.invoices,
      publicAccessCount: quote._count.publicAccesses,
      reminderCount: quote._count.reminders,
      hasSignature: Boolean(quote.signature),
    });

    if (blockReason) {
      return NextResponse.json(
        { error: blockReason },
        { status: 409 },
      );
    }

    const deleted = await prisma.quote.deleteMany({
      where: {
        id: quote.id,
        organizationId: workspaceContext.workspace.id,
        status: "BROUILLON",
        invoices: { none: {} },
        signature: { is: null },
        publicAccesses: { none: {} },
        reminders: { none: {} },
      },
    });

    if (deleted.count !== 1) {
      return NextResponse.json(
        { error: "Ce devis a changé et ne peut plus être supprimé." },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, {
        status: accessError.status,
      });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            "Ce devis ne peut pas être supprimé car une donnée liée doit être conservée.",
        },
        { status: 409 },
      );
    }

    console.error("DELETE QUOTE ERROR", error);
    return NextResponse.json(
      { error: "Impossible de supprimer ce devis." },
      { status: 500 },
    );
  }
}
