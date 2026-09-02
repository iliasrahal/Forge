import Link from "next/link";

import FixedForgeBar from "@/components/FixedForgeBar";
import QuoteStatsSelector from "@/components/QuoteStatsSelector";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import { getQuoteReminderState } from "@/src/lib/quote-reminders";
import { getParisYearMonth } from "@/src/lib/document-history";


export default async function QuoteStatsPage() {

  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("read");



  const quotes =
    await prisma.quote.findMany({

      where: {
        organizationId: workspaceContext.workspace.id,
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



  const currentYear = getParisYearMonth(new Date()).year;



  const availableYears =
    Array.from(
      new Set(
        quotes.map(
          (quote) =>
            getParisYearMonth(quote.createdAt).year
        )
      )
    );



  const years =
    Array.from(
      new Set([
        currentYear,
        ...availableYears,
      ])
    ).sort(
      (a, b) => b - a
    );



  const initialDocuments = quotes
    .filter((quote) => getParisYearMonth(quote.createdAt).year === currentYear)
    .map((quote) => {
      const reminderState = getQuoteReminderState({
        status: quote.status,
        sentAt: quote.sentAt,
        reminders: quote.reminders,
      });
      const clientName =
        quote.client.type === "PARTICULIER"
          ? `${quote.client.firstName ?? ""} ${quote.client.lastName ?? ""}`.trim()
          : quote.client.companyName ?? "Client professionnel";
      const statusLabels: Record<string, string> = {
        BROUILLON: "Brouillon",
        ENVOYE: "Envoyé",
        ACCEPTE: "Accepté",
        REFUSE: "Refusé",
      };

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
    });



  return (

    <main className="min-h-screen pb-32">


      <div className="mx-auto max-w-2xl">


        <div className="mb-5">


          <Link
            href="/quotes"
            className="
              forge-back-link
              text-sm
              font-semibold
              text-blue-600
              transition
              hover:text-blue-700
              dark:text-blue-400
              dark:hover:text-blue-300
            "
          >
            Retour
          </Link>


        </div>

        <h1 className="mb-5 text-center text-2xl font-bold text-blue-700 dark:text-blue-400 sm:text-3xl">
          Historique Devis
        </h1>



        <QuoteStatsSelector
          year={currentYear}
          years={years}
          initialDocuments={initialDocuments}
        />


      </div>



      <FixedForgeBar context="quotes" />


    </main>

  );

}
