import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import { resolveDocumentHistoryRange } from "@/src/lib/document-history";


export async function GET(request: Request) {
  const workspaceContext = await requireWorkspaceContext("read");
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year"));
  const resolvedRange = resolveDocumentHistoryRange({
    year,
    from: searchParams.get("from"),
    to: searchParams.get("to"),
  });

  if ("error" in resolvedRange) {
    return NextResponse.json(
      { error: resolvedRange.error },
      { status: 400 },
    );
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: workspaceContext.workspace.id,
      createdAt: resolvedRange.range,
    },
    select: {
      id: true,
      title: true,
      reference: true,
      status: true,
      type: true,
      amountCents: true,
      totalHtCents: true,
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
      // Le chiffre d'affaires se pilote en HT ; le TTC reste sur le détail.
      amountCents: invoice.totalHtCents,
      amountTtcCents: invoice.amountCents,
      createdAt: invoice.createdAt.toISOString(),
      statusLabel: statusLabels[invoice.status] ?? invoice.status,
      href: `/invoices/${invoice.id}`,
      badge: invoice.type === "DEPOSIT" ? "Facture d’acompte" : undefined,
    })),
  );
}
