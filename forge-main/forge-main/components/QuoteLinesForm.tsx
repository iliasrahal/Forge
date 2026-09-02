"use client";

import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import {
  calculateQuoteLinesTotal,
  createQuoteLineSnapshot,
  type EditableQuoteLine,
} from "@/src/lib/quote-lines";
import {
  formatPricingType,
  formatServicePrice,
  type ServicePricingTypeValue,
} from "@/src/lib/service-catalog";


type QuoteLinesFormProps = {
  initialTitle?: string;
  initialLines?: EditableQuoteLine[];
  services?: Array<{
    id: string;
    name: string;
    priceCents: number;
    pricingType: ServicePricingTypeValue;
  }>;
  canWrite?: boolean;
};



export default function QuoteLinesForm({
  initialTitle,
  initialLines = [],
  services = [],
  canWrite = true,
}: QuoteLinesFormProps) {


  const [lines, setLines] =
    useState<EditableQuoteLine[]>(
      initialLines.length > 0
        ? initialLines
        : [
            {
              category: initialTitle || "Main d'œuvre",
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
          ],
    );

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");

  const filteredServices = useMemo(() => {
    const search = serviceSearch.trim().toLocaleLowerCase("fr");
    if (!search) return services;
    return services.filter((service) =>
      service.name.toLocaleLowerCase("fr").includes(search),
    );
  }, [serviceSearch, services]);




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

    if (!canWrite) return;

    setLines([
      ...lines,
      {
        category: "",
        amount: "",
      },
    ]);

    setShowAddMenu(false);

  }

  function addSavedService(service: (typeof services)[number]) {
    if (!canWrite) return;

    setLines((current) => [...current, createQuoteLineSnapshot(service)]);
    setShowServicePicker(false);
    setShowAddMenu(false);
    setServiceSearch("");
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





  const total = calculateQuoteLinesTotal(lines);





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
                disabled={!canWrite}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 font-medium text-blue-700 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-blue-400 dark:text-white dark:placeholder:text-slate-500"
              />




              <div className="relative w-32">


                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={line.amount}
                  onChange={(event) =>
                    updateAmount(
                      index,
                      event.target.value,
                    )
                  }
                  disabled={!canWrite}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-16 text-right text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />



                <span className="pointer-events-none absolute right-9 top-2 text-slate-500 dark:text-slate-400">
                  €
                </span>


              </div>





              {canWrite ? <button
                type="button"
                onClick={() =>
                  removeLine(index)
                }
                className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
              >
                Supprimer
              </button>
              : null}




            </div>

          ),
        )}



      </div>





      {canWrite ? (
        <div className="relative inline-block w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowAddMenu((current) => !current)}
            aria-expanded={showAddMenu}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-blue-300/70 bg-[var(--forge-surface-secondary)] px-4 py-3 font-semibold text-[var(--forge-accent-blue-lit)] transition hover:brightness-105 sm:w-auto"
          >
            <Plus size={18} /> Ajouter une ligne
          </button>

          {showAddMenu ? (
            <div className="forge-surface absolute bottom-[calc(100%+0.6rem)] left-0 z-30 w-full min-w-[17rem] rounded-2xl border p-2 shadow-xl backdrop-blur-xl sm:w-72">
              <button
                type="button"
                onClick={() => {
                  setShowServicePicker(true);
                  setShowAddMenu(false);
                }}
                className="w-full rounded-xl px-3 py-3 text-left font-semibold text-[var(--forge-text-primary)] transition hover:bg-[var(--forge-surface-hover)]"
              >
                Ajouter une prestation enregistrée
              </button>
              <button
                type="button"
                onClick={addLine}
                className="mt-1 w-full rounded-xl px-3 py-3 text-left font-semibold text-[var(--forge-text-primary)] transition hover:bg-[var(--forge-surface-hover)]"
              >
                Ajouter une ligne personnalisée
              </button>
            </div>
          ) : null}
        </div>
      ) : null}






      <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950">


        <p className="text-sm text-blue-700 dark:text-blue-300">
          Total du devis
        </p>



        <p className="mt-1 text-3xl font-bold text-blue-700 dark:text-blue-300">
          {total.toFixed(2)} €
        </p>



      </div>

      {showServicePicker ? (
        <div className="fixed inset-0 z-[85] flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:items-center sm:p-6">
          <section className="forge-surface max-h-[min(38rem,calc(100dvh-1.5rem))] w-full max-w-md overflow-hidden rounded-[2rem] border p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-[var(--forge-text-primary)]">
                Prestations enregistrées
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowServicePicker(false);
                  setServiceSearch("");
                }}
                aria-label="Fermer"
                className="grid h-10 w-10 place-items-center rounded-full text-[var(--forge-text-secondary)] transition hover:bg-[var(--forge-surface-hover)]"
              >
                <X size={20} />
              </button>
            </div>

            <label className="relative mt-4 block">
              <span className="sr-only">Rechercher une prestation</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--forge-text-muted)]" size={18} />
              <input
                autoFocus
                type="search"
                value={serviceSearch}
                onChange={(event) => setServiceSearch(event.target.value)}
                placeholder="Rechercher une prestation"
                className="h-12 w-full rounded-2xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] pl-11 pr-4 text-[var(--forge-text-primary)] outline-none placeholder:text-[var(--forge-text-muted)] focus:border-[var(--forge-accent-blue)] focus:ring-4 focus:ring-blue-500/15"
              />
            </label>

            <div className="mt-4 max-h-[22rem] space-y-2 overflow-y-auto overscroll-contain pr-1">
              {filteredServices.length > 0 ? (
                filteredServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => addSavedService(service)}
                    className="flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)] px-4 py-3 text-left transition hover:border-[var(--forge-accent-blue)] hover:brightness-105"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-[var(--forge-text-primary)]">
                        {service.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-[var(--forge-text-muted)]">
                        {formatPricingType(service.pricingType)}
                      </span>
                    </span>
                    <span className="shrink-0 font-bold text-[var(--forge-accent-blue-lit)]">
                      {formatServicePrice(service.priceCents)}
                    </span>
                  </button>
                ))
              ) : services.length === 0 ? (
                <div className="py-7 text-center">
                  <p className="text-sm text-[var(--forge-text-secondary)]">
                    Aucune prestation enregistrée.
                  </p>
                  <Link
                    href="/settings/services"
                    className="mt-3 inline-block text-sm font-semibold text-[var(--forge-accent-blue-lit)]"
                  >
                    Gérer mes prestations
                  </Link>
                </div>
              ) : (
                <p className="py-7 text-center text-sm text-[var(--forge-text-secondary)]">
                  Aucune prestation trouvée.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowServicePicker(false);
                setServiceSearch("");
                addLine();
              }}
              className="mt-4 min-h-11 w-full rounded-xl border border-[var(--forge-border-strong)] px-4 text-sm font-semibold text-[var(--forge-text-primary)] transition hover:bg-[var(--forge-surface-hover)]"
            >
              Ajouter une ligne personnalisée
            </button>
          </section>
        </div>
      ) : null}



    </div>
  );
}
