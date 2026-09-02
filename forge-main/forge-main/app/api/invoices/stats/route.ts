import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";


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

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: workspaceContext.workspace.id,
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
    select: {
      amountCents: true,
      createdAt: true,
    },
  });

  return NextResponse.json(invoices);
}
