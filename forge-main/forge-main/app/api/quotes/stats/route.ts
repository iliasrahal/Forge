import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import { getQuoteReminderState } from "@/src/lib/quote-reminders";
import { getParisYearBounds } from "@/src/lib/document-history";


export async function GET(
  request: Request,
) {

  const workspaceContext = await requireWorkspaceContext("read");


  const { searchParams } =
    new URL(request.url);


  const year =
    Number(
      searchParams.get("year"),
    );

  if (!Number.isInteger(year) || year < 1) {
    return NextResponse.json(
      { error: "Année invalide." },
      { status: 400 },
    );
  }

  const { start, end } = getParisYearBounds(year);


  const quotes =
    await prisma.quote.findMany({

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
        sentAt: true,
        amountCents: true,
        createdAt: true,
        clientId: true,
        client: {
          select: {
            type: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
        reminders: {
          select: { sentAt: true },
          orderBy: { sentAt: "desc" },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

    });



  const statusLabels: Record<string, string> = {
    BROUILLON: "Brouillon",
    ENVOYE: "Envoyé",
    ACCEPTE: "Accepté",
    REFUSE: "Refusé",
  };

  return NextResponse.json(
    quotes.map((quote) => {
      const reminderState = getQuoteReminderState({
        status: quote.status,
        sentAt: quote.sentAt,
        reminders: quote.reminders,
      });
      const clientName =
        quote.client.type === "PARTICULIER"
          ? `${quote.client.firstName ?? ""} ${quote.client.lastName ?? ""}`.trim()
          : quote.client.companyName ?? "Client professionnel";

      return {
        id: quote.id,
        title: quote.title,
        reference: quote.reference,
        amountCents: quote.amountCents,
        createdAt: quote.createdAt.toISOString(),
        statusLabel: statusLabels[quote.status] ?? quote.status,
        href: `/clients/${quote.clientId}/quotes/${quote.id}`,
        clientName,
        attention: reminderState.eligible ? "À relancer" : undefined,
      };
    }),
  );

}
