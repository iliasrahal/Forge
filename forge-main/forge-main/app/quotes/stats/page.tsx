import Link from "next/link";

import FixedForgeBar from "@/components/FixedForgeBar";
import QuoteStatsSelector from "@/components/QuoteStatsSelector";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";


const months = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];



export default async function QuoteStatsPage() {

  const currentUser =
    await requireCurrentUser();



  const quotes =
    await prisma.quote.findMany({

      where: {
        client: {
          userId: currentUser.id,
        },
      },


      select: {
        amountCents: true,
        createdAt: true,
      },


      orderBy: {
        createdAt: "desc",
      },

    });



  const currentYear =
    new Date().getFullYear();



  const availableYears =
    Array.from(
      new Set(
        quotes.map(
          (quote) =>
            quote.createdAt.getFullYear()
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



  const yearQuotes =
    quotes.filter(
      (quote) =>
        quote.createdAt.getFullYear() === currentYear
    );



  const monthlyTotals =
    months.map(
      (month, index) => {

        const total =
          yearQuotes
            .filter(
              (quote) =>
                quote.createdAt.getMonth() === index
            )
            .reduce(
              (sum, quote) =>
                sum + quote.amountCents,
              0
            );



        return {
          month,
          total,
        };

      }
    );



  return (

    <main className="min-h-screen pb-32 dark:bg-slate-950">


      <div className="mx-auto max-w-2xl">


        <div className="mb-5">


          <Link
            href="/quotes"
            className="
              text-sm
              font-medium
              text-slate-500
              transition
              hover:text-blue-700
              dark:text-slate-400
              dark:hover:text-blue-400
            "
          >
            ← Retour aux devis
          </Link>


        </div>



        <QuoteStatsSelector
          year={currentYear}
          years={years}
          monthlyTotals={monthlyTotals}
        />


      </div>



      <FixedForgeBar context="quotes" />


    </main>

  );

}