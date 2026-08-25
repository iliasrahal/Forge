"use client";

import { useState } from "react";


type QuoteLine = {
  category: string;
  amount: string;
};


type QuoteLinesFormProps = {
  initialTitle?: string;
};



export default function QuoteLinesForm({
  initialTitle,
}: QuoteLinesFormProps) {


  const [lines, setLines] =
    useState<QuoteLine[]>([
      {
        category:
          initialTitle || "Main d'œuvre",
        amount: "",
      },
      {
        category: "Matériel",
        amount: "",
      },
      {
        category: "Déplacement",
        amount: "",
      },
    ]);




  function updateAmount(
    index: number,
    value: string,
  ) {

    const updatedLines =
      [...lines];

    updatedLines[index].amount =
      value;

    setLines(updatedLines);
  }





  function updateCategory(
    index: number,
    value: string,
  ) {

    const updatedLines =
      [...lines];

    updatedLines[index].category =
      value;

    setLines(updatedLines);
  }





  function addLine() {

    setLines([
      ...lines,
      {
        category: "",
        amount: "",
      },
    ]);

  }





  function removeLine(
    index: number,
  ) {

    setLines(
      lines.filter(
        (_, lineIndex) =>
          lineIndex !== index,
      ),
    );

  }





  const total =
    lines.reduce(
      (sum, line) =>
        sum +
        (
          Number(
            line.amount.replace(",", "."),
          ) || 0
        ),
      0,
    );





  return (
    <div className="space-y-5">


      <input
        type="hidden"
        name="quoteLines"
        value={JSON.stringify(lines)}
      />




      <div>
        <h2 className="text-sm font-semibold text-blue-700 dark:text-blue-400">
          Détail du devis
        </h2>
      </div>





      <div className="space-y-3">


        {lines.map(
          (line, index) => (

            <div
              key={index}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
            >


              <input
                type="text"
                value={line.category}
                placeholder="Nouvelle prestation"
                onChange={(event) =>
                  updateCategory(
                    index,
                    event.target.value,
                  )
                }
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 font-medium text-blue-700 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-blue-400 dark:text-white dark:placeholder:text-slate-500"
              />




              <div className="relative w-32">


                <input
                  type="number"
                  value={line.amount}
                  onChange={(event) =>
                    updateAmount(
                      index,
                      event.target.value,
                    )
                  }
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-16 text-right text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />



                <span className="pointer-events-none absolute right-9 top-2 text-slate-500 dark:text-slate-400">
                  €
                </span>


              </div>





              <button
                type="button"
                onClick={() =>
                  removeLine(index)
                }
                className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
              >
                Supprimer
              </button>




            </div>

          ),
        )}



      </div>





      <button
        type="button"
        onClick={addLine}
        className="rounded-xl border border-blue-200 px-4 py-3 font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-950"
      >
        + Ajouter une ligne
      </button>






      <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950">


        <p className="text-sm text-blue-700 dark:text-blue-300">
          Total du devis
        </p>



        <p className="mt-1 text-3xl font-bold text-blue-700 dark:text-blue-300">
          {total.toFixed(2)} €
        </p>



      </div>



    </div>
  );
}