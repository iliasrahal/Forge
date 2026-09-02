import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import { getParisYearBounds } from "@/src/lib/document-history";


export async function GET(request: Request) {
  const workspaceContext = await requireWorkspaceContext("read");
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year"));

  if (!Number.isInteger(year) || year < 1) {
    return NextResponse.json(
      { error: "Année invalide." },
      { status: 400 },
    );
  }

  const { start, end } = getParisYearBounds(year);

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: workspaceContext.workspace.id,
      createdAt: {
        gte: start,
        lt: end,
      },
    },
    select: {
      id: true,
      title: true,
      reference: true,
      status: true,
      type: true,
      amountCents: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const statusLabels: Record<string, string> = {
    BROUILLON: "Brouillon",
    ENVOYEE: "Envoyée",
    PAYEE: "Payée",
    EN_RETARD: "En retard",
    ANNULEE: "Annulée",
  };

  return NextResponse.json(
    invoices.map((invoice) => ({
      id: invoice.id,
      title: invoice.title,
      reference: `Facture ${invoice.reference}`,
      amountCents: invoice.amountCents,
      createdAt: invoice.createdAt.toISOString(),
      statusLabel: statusLabels[invoice.status] ?? invoice.status,
      href: `/invoices/${invoice.id}`,
      badge: invoice.type === "DEPOSIT" ? "Facture d’acompte" : undefined,
    })),
  );
}
