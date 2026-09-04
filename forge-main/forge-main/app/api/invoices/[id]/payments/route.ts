import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireCurrentUser } from "@/src/lib/auth";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";
import {
  computeInvoicePaymentState,
  isManualPaymentMethod,
} from "@/src/lib/payments";
import { syncInvoicePaymentStatus } from "@/src/lib/invoice-payment-sync";

type PaymentsRouteProps = {
  params: Promise<{ id: string }>;
};

function parseAmountCents(raw: unknown): number | null {
  const value =
    typeof raw === "number"
      ? raw
      : Number(String(raw ?? "").replace(",", ".").trim());
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

export async function POST(request: Request, { params }: PaymentsRouteProps) {
  try {
    const currentUser = await requireCurrentUser();
    const workspaceContext = await requireWorkspaceContext("write");
    const { id } = await params;
    const body = await request.json();

    const amountCents = parseAmountCents(body.amount);
    if (amountCents === null) {
      return NextResponse.json(
        { error: "Saisis un montant valide." },
        { status: 400 },
      );
    }

    const method = String(body.method ?? "").trim();
    if (!isManualPaymentMethod(method)) {
      return NextResponse.json(
        { error: "Le moyen de paiement est invalide." },
        { status: 400 },
      );
    }

    const reference =
      typeof body.reference === "string" && body.reference.trim()
        ? body.reference.trim().slice(0, 190)
        : null;

    let paidAt = new Date();
    if (body.paidAt) {
      const parsed = new Date(body.paidAt);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: "La date d’encaissement est invalide." },
          { status: 400 },
        );
      }
      if (parsed.getTime() > Date.now() + 60_000) {
        return NextResponse.json(
          { error: "La date d’encaissement ne peut pas être dans le futur." },
          { status: 400 },
        );
      }
      paidAt = parsed;
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId: workspaceContext.workspace.id },
      include: {
        payments: {
          select: {
            status: true,
            amountCents: true,
            feeCents: true,
            refundedCents: true,
            paidAt: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Facture introuvable." },
        { status: 404 },
      );
    }

    if (invoice.status === "BROUILLON" || invoice.status === "ANNULEE") {
      return NextResponse.json(
        {
          error:
            "Un paiement ne peut être enregistré que sur une facture émise.",
        },
        { status: 409 },
      );
    }

    const state = computeInvoicePaymentState(
      invoice.amountCents,
      invoice.payments,
    );

    if (amountCents > state.remainingCents) {
      return NextResponse.json(
        {
          error: `Ce montant dépasse le reste à payer (${(
            state.remainingCents / 100
          ).toLocaleString("fr-FR", {
            style: "currency",
            currency: "EUR",
          })}).`,
        },
        { status: 409 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          organizationId: workspaceContext.workspace.id,
          amountCents,
          feeCents: 0,
          netCents: amountCents,
          currency: "eur",
          status: "SUCCEEDED",
          provider: "MANUAL",
          method,
          reference,
          paidAt,
          recordedByUserId: currentUser.id,
        },
      });

      const sync = await syncInvoicePaymentStatus(tx, invoice.id);
      return { payment, sync };
    });

    return NextResponse.json({
      payment: result.payment,
      state: result.sync?.state ?? null,
      status: result.sync?.status ?? invoice.status,
    });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error("RECORD PAYMENT ERROR", error);
    return NextResponse.json(
      { error: "Impossible d’enregistrer le paiement." },
      { status: 500 },
    );
  }
}
