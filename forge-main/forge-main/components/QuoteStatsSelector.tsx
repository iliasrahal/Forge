"use client";


import { useEffect, useState } from "react";


function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100);
}


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


type Quote = {
  amountCents: number;
  createdAt: string;
};


type MonthlyTotal = {
  month: string;
  total: number;
};


type QuoteStatsSelectorProps = {
  year: number;
  years: number[];
  monthlyTotals: MonthlyTotal[];
};



export default function QuoteStatsSelector({
  year,
  years,
  monthlyTotals: initialMonthlyTotals,
}: QuoteStatsSelectorProps) {


  const [selectedYear, setSelectedYear] =
    useState(year);


  const [monthlyTotals, setMonthlyTotals] =
    useState<MonthlyTotal[]>(
      Array.isArray(initialMonthlyTotals)
        ? initialMonthlyTotals
        : []
    );


  const [selectedMonth, setSelectedMonth] =
    useState(
      new Date().getMonth()
    );



  const safeMonthlyTotals =
    Array.isArray(monthlyTotals)
      ? monthlyTotals
      : [];


  const selectedTotal =
    safeMonthlyTotals[selectedMonth]?.total ?? 0;


  const yearlyTotal =
    safeMonthlyTotals.reduce(
      (sum, item) =>
        sum + item.total,
      0
    );



  useEffect(() => {

    async function loadStats() {

      const response =
        await fetch(
          `/api/quotes/stats?year=${selectedYear}`
        );


      if (!response.ok) {
        return;
      }


      const quotes: Quote[] =
        await response.json();



      const totals =
        months.map(
          (month, index) => {

            const total =
              quotes
                .filter(
                  (quote) =>
                    new Date(
                      quote.createdAt
                    ).getMonth() === index
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


      setMonthlyTotals(totals);

    }


    loadStats();


  }, [selectedYear]);



  return (

    <div className="mx-auto max-w-2xl space-y-5">



      {/* Année */}


      <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">


        <select
          value={selectedYear}
          onChange={(event) => {

            setSelectedYear(
              Number(event.target.value)
            );

            setSelectedMonth(0);

          }}
          className="
            mb-4
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            font-semibold
            text-blue-700
            outline-none
            dark:border-slate-700
            dark:bg-slate-800
            dark:text-blue-400
          "
        >

          {years.map((item) => (

            <option
              key={item}
              value={item}
            >
              {item}
            </option>

          ))}

        </select>



        <p className="text-4xl font-bold text-blue-700 dark:text-blue-400">
          {formatCurrency(yearlyTotal)}
        </p>


      </div>





      {/* Mois */}


      <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">


        <select
          value={selectedMonth}
          onChange={(event) =>
            setSelectedMonth(
              Number(event.target.value)
            )
          }
          className="
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            font-semibold
            text-blue-700
            outline-none
            dark:border-slate-700
            dark:bg-slate-800
            dark:text-blue-400
          "
        >

          {safeMonthlyTotals.map(
            (item,index)=>(
              
              <option
                key={item.month}
                value={index}
              >
                {item.month}
              </option>

            )
          )}

        </select>



        <p className="mt-4 text-4xl font-bold text-blue-700 dark:text-blue-400">
          {formatCurrency(selectedTotal)}
        </p>


      </div>






      {/* Liste */}


      <div className="rounded-3xl border border-slate-200 bg-white px-5 dark:border-slate-700 dark:bg-slate-900">


        {safeMonthlyTotals.map(
          (item)=>(

            <div
              key={item.month}
              className="
                flex
                justify-between
                py-3
                border-b
                border-slate-100
                last:border-0
                dark:border-slate-700
              "
            >

              <span className="text-slate-700 dark:text-slate-300">
                {item.month}
              </span>



              <span className="font-semibold text-blue-700 dark:text-blue-400">
                {formatCurrency(item.total)}
              </span>


            </div>

          )
        )}


      </div>


    </div>

  );

}