"use client";

import { useState } from "react";

type QuoteStatsProps = {
  quotes: {
    createdAt: Date;
    amountCents: number;
    status: string;
  }[];
};

export default function QuoteStats({
  quotes,
}: QuoteStatsProps) {

  const currentYear =
    new Date().getFullYear();

  const [selectedYear, setSelectedYear] =
    useState(currentYear);


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


  const yearlyQuotes =
    quotes.filter((quote) => {
      const date =
        new Date(quote.createdAt);

      return (
        date.getFullYear() === selectedYear &&
        quote.status !== "REFUSE"
      );
    });


  const totalYear =
    yearlyQuotes.reduce(
      (total, quote) =>
        total + quote.amountCents,
      0,
    );


  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">

      <div className="flex items-center justify-between">

        <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">
          Statistiques devis
        </h2>


        <select
          value={selectedYear}
          onChange={(e) =>
            setSelectedYear(
              Number(e.target.value),
            )
          }
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value={2026}>
            2026
          </option>

          <option value={2027}>
            2027
          </option>

        </select>

      </div>


      <div className="mt-6">

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Total année
        </p>

        <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
          {(totalYear / 100).toFixed(2)} €
        </p>

      </div>


      <div className="mt-6 space-y-3">

        {months.map((month, index) => {

          const totalMonth =
            yearlyQuotes
              .filter((quote) => {
                const date =
                  new Date(quote.createdAt);

                return (
                  date.getMonth() === index
                );
              })
              .reduce(
                (total, quote) =>
                  total +
                  quote.amountCents,
                0,
              );


          return (
            <div
              key={month}
              className="flex justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"
            >

              <span className="font-medium text-slate-700 dark:text-slate-200">
                {month}
              </span>


              <span className="font-semibold text-blue-700 dark:text-blue-400">
                {(totalMonth / 100).toFixed(2)} €
              </span>

            </div>
          );

        })}

      </div>


    </section>
  );
}
