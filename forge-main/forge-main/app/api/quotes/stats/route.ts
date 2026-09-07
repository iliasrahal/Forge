import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import { getQuoteReminderState } from "@/src/lib/quote-reminders";
import { resolveDocumentHistoryRange } from "@/src/lib/document-history";
import { displayDocumentReference } from "@/src/lib/document-numbering";
import { getQuoteClientName, getQuotePath } from "@/src/lib/quote-routes";


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


  const quotes =
    await prisma.quote.findMany({

      where: {
        organizationId: workspaceContext.workspace.id,

        createdAt: resolvedRange.range,
      },


      select: {
        id: true,
        title: true,
        reference: true,
        status: true,
        sentAt: true,
        amountCents: true,
        totalHtCents: true,
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
      const clientName = getQuoteClientName(quote.client);

      return {
        id: quote.id,
        title: quote.title,
        reference: displayDocumentReference(quote.reference),
        // Le chiffre d'affaires se pilote en HT ; le TTC reste sur le détail.
        amountCents: quote.totalHtCents,
        amountTtcCents: quote.amountCents,
        createdAt: quote.createdAt.toISOString(),
        statusLabel: statusLabels[quote.status] ?? quote.status,
        href: getQuotePath(quote),
        clientName,
        attention: reminderState.eligible ? "À relancer" : undefined,
      };
    }),
  );

}
