"use client";

import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import { useState } from "react";

import {
  createQuoteLineSnapshot,
  emptyQuoteLine,
  type EditableQuoteLine,
} from "@/src/lib/quote-lines";
import {
  formatPricingType,
  formatServicePrice,
  type ServicePricingTypeValue,
} from "@/src/lib/service-catalog";
import {
  computeDocumentMargin,
  computeLineAmountCents,
  DOCUMENT_UNITS,
  normalizeDiscountBp,
  parseQuantityToMilli,
} from "@/src/lib/document-lines";
import {
  computeDocumentTotals,
  formatVatRateBp,
  normalizeVatRateBp,
  VAT_EXEMPTION_MENTION,
  VAT_RATES_BP,
} from "@/src/lib/vat";


type QuoteLinesFormProps = {
  initialTitle?: string;
  initialLines?: EditableQuoteLine[];
  initialVatApplicable?: boolean;
  initialDocumentDiscount?: string;
  initialTrackMargins?: boolean;
  defaultVatApplicable?: boolean;
  defaultVatRateBp?: number;
  /** Nom du champ caché sérialisant les lignes. Devis : "quoteLines" ;
   *  facture : "invoiceLines". */
  linesFieldName?: string;
  services?: Array<{
    id: string;
    name: string;
    priceCents: number;
    pricingType: ServicePricingTypeValue;
  }>;
  canWrite?: boolean;
};


function eurosToCents(value: string): number {
  return Math.round((Number(String(value).replace(",", ".")) || 0) * 100);
}

function formatEuros(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}


export default function QuoteLinesForm({
  initialTitle,
  initialLines = [],
  initialVatApplicable,
  initialDocumentDiscount,
  initialTrackMargins,
  defaultVatApplicable = false,
  defaultVatRateBp = 2000,
  linesFieldName = "quoteLines",
  services = [],
  canWrite = true,
}: QuoteLinesFormProps) {
  const normalizedDefaultRate = normalizeVatRateBp(defaultVatRateBp, 2000);

  const [vatApplicable, setVatApplicable] = useState<boolean>(
    initialVatApplicable ?? defaultVatApplicable,
  );
  const [documentDiscount, setDocumentDiscount] = useState<string>(
    initialDocumentDiscount ?? "",
  );
  const [trackMargins, setTrackMargins] = useState<boolean>(
    initialTrackMargins ?? initialLines.some((line) => line.cost?.trim()),
  );

  const [lines, setLines] = useState<EditableQuoteLine[]>(
    initialLines.length > 0
      ? initialLines.map((line) => ({
          ...line,
          vatRateBp: normalizeVatRateBp(line.vatRateBp, normalizedDefaultRate),
        }))
      : [
          emptyQuoteLine(initialTitle || "Main d'œuvre", normalizedDefaultRate),
          emptyQuoteLine("Matériel", normalizedDefaultRate),
          emptyQuoteLine("Déplacement", normalizedDefaultRate),
        ],
  );

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");

  const serviceSearchTerm = serviceSearch.trim().toLocaleLowerCase("fr");
  const filteredServices = serviceSearchTerm
    ? services.filter((service) =>
        service.name.toLocaleLowerCase("fr").includes(serviceSearchTerm),
      )
    : services;


  function patchLine(index: number, patch: Partial<EditableQuoteLine>) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    );
  }

  function addLine() {
    if (!canWrite) return;
    setLines((current) => [
      ...current,
      emptyQuoteLine("", normalizedDefaultRate),
    ]);
    setShowAddMenu(false);
  }

  function addSavedService(service: (typeof services)[number]) {
    if (!canWrite) return;
    setLines((current) => [
      ...current,
      createQuoteLineSnapshot(service, normalizedDefaultRate),
    ]);
    setShowServicePicker(false);
    setShowAddMenu(false);
    setServiceSearch("");
  }

  function removeLine(index: number) {
    setLines((current) =>
      current.filter((_, lineIndex) => lineIndex !== index),
    );
  }


  const docDiscountBp = normalizeDiscountBp(documentDiscount);

  const computedLines = lines.map((line) => {
    const quantityMilli = parseQuantityToMilli(line.quantity, 1000);
    const unitPriceCents = eurosToCents(line.unitPrice);
    const discountBp = normalizeDiscountBp(line.discount);
    const costCents = line.cost?.trim() ? eurosToCents(line.cost) : null;
    const amountCents = computeLineAmountCents({
      quantityMilli,
      unitPriceCents,
      discountBp,
    });
    return {
      quantityMilli,
      unitPriceCents,
      discountBp,
      costCents,
      amountCents,
      vatRateBp: normalizeVatRateBp(line.vatRateBp, normalizedDefaultRate),
    };
  });

  const subtotalHtCents = computedLines.reduce(
    (sum, line) => sum + line.amountCents,
    0,
  );
  const totals = computeDocumentTotals(
    computedLines,
    vatApplicable,
    docDiscountBp,
  );
  const margin = trackMargins
    ? computeDocumentMargin(computedLines, docDiscountBp)
    : null;
  const marginPercent =
    margin && totals.totalHtCents > 0
      ? (margin.totalMarginCents / totals.totalHtCents) * 100
      : null;


  return (
    <div className="space-y-5">

      <input type="hidden" name={linesFieldName} value={JSON.stringify(lines)} />
      <input
        type="hidden"
        name="vatApplicable"
        value={vatApplicable ? "true" : "false"}
      />
      <input
        type="hidden"
        name="documentDiscount"
        value={documentDiscount.trim()}
      />


      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-sm font-semibold text-blue-700 dark:text-blue-400">
          Détail
        </h2>

        {canWrite ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-slate-600 dark:text-slate-300">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={vatApplicable}
                onChange={(event) => setVatApplicable(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
              />
              Assujetti à la TVA
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={trackMargins}
                onChange={(event) => setTrackMargins(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
              />
              Suivre les marges
            </label>
          </div>
        ) : null}
      </div>


      <div className="space-y-3">
        {lines.map((line, index) => (
          <div
            key={index}
            className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex items-start gap-3">
              <input
                type="text"
                value={line.category}
                placeholder="Prestation / désignation"
                onChange={(event) =>
                  patchLine(index, { category: event.target.value })
                }
                disabled={!canWrite}
                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 font-medium text-blue-700 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-blue-400 dark:placeholder:text-slate-500"
              />
              {canWrite ? (
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  aria-label="Supprimer la ligne"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                >
                  <X size={18} />
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-end gap-2 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">Qté</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={line.quantity}
                  onChange={(event) =>
                    patchLine(index, { quantity: event.target.value })
                  }
                  disabled={!canWrite}
                  className="w-16 rounded-xl border border-slate-300 bg-white px-2 py-2 text-right text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">Unité</span>
                <select
                  value={line.unit}
                  onChange={(event) =>
                    patchLine(index, { unit: event.target.value })
                  }
                  disabled={!canWrite}
                  className="rounded-xl border border-slate-300 bg-white px-2 py-2 text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                >
                  {DOCUMENT_UNITS.map((entry) => (
                    <option key={entry.value} value={entry.value}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">PU HT</span>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={line.unitPrice}
                    placeholder="0"
                    onChange={(event) =>
                      patchLine(index, { unitPrice: event.target.value })
                    }
                    disabled={!canWrite}
                    className="w-24 rounded-xl border border-slate-300 bg-white px-2 py-2 pr-6 text-right text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                  <span className="pointer-events-none absolute right-2 top-2 text-slate-400">€</span>
                </div>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">Remise</span>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={line.discount}
                    placeholder="0"
                    onChange={(event) =>
                      patchLine(index, { discount: event.target.value })
                    }
                    disabled={!canWrite}
                    className="w-16 rounded-xl border border-slate-300 bg-white px-2 py-2 pr-5 text-right text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                  <span className="pointer-events-none absolute right-2 top-2 text-slate-400">%</span>
                </div>
              </label>

              {vatApplicable ? (
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">TVA</span>
                  <select
                    value={String(computedLines[index].vatRateBp)}
                    onChange={(event) =>
                      patchLine(index, {
                        vatRateBp: normalizeVatRateBp(
                          event.target.value,
                          normalizedDefaultRate,
                        ),
                      })
                    }
                    disabled={!canWrite}
                    className="rounded-xl border border-slate-300 bg-white px-2 py-2 text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {VAT_RATES_BP.map((rateBp) => (
                      <option key={rateBp} value={rateBp}>
                        {formatVatRateBp(rateBp)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {trackMargins ? (
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Coût unit.
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={line.cost}
                      placeholder="—"
                      onChange={(event) =>
                        patchLine(index, { cost: event.target.value })
                      }
                      disabled={!canWrite}
                      className="w-20 rounded-xl border border-slate-300 bg-white px-2 py-2 pr-5 text-right text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    />
                    <span className="pointer-events-none absolute right-2 top-2 text-slate-400">€</span>
                  </div>
                </label>
              ) : null}

              <div className="ml-auto flex flex-col items-end gap-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Total HT
                </span>
                <span className="py-2 font-semibold text-slate-900 dark:text-white">
                  {formatEuros(computedLines[index].amountCents)} €
                </span>
              </div>
            </div>
          </div>
        ))}
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


      <div className="space-y-3 rounded-2xl bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
        <div className="flex items-center justify-between">
          <span>Sous-total HT</span>
          <span className="font-semibold">{formatEuros(subtotalHtCents)} €</span>
        </div>

        {canWrite || docDiscountBp > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2">
              Remise globale
              <span className="relative inline-block">
                <input
                  type="text"
                  inputMode="decimal"
                  value={documentDiscount}
                  placeholder="0"
                  onChange={(event) => setDocumentDiscount(event.target.value)}
                  disabled={!canWrite}
                  className="w-16 rounded-lg border border-blue-200 bg-white px-2 py-1 pr-5 text-right text-blue-800 dark:border-blue-900 dark:bg-slate-900 dark:text-blue-200"
                />
                <span className="pointer-events-none absolute right-2 top-1 text-blue-400">
                  %
                </span>
              </span>
            </label>
            {docDiscountBp > 0 ? (
              <span>− {formatEuros(subtotalHtCents - totals.totalHtCents)} €</span>
            ) : null}
          </div>
        ) : null}

        {vatApplicable ? (
          <>
            <div className="flex items-center justify-between border-t border-blue-200 pt-2 dark:border-blue-900">
              <span>Total HT</span>
              <span className="font-semibold">
                {formatEuros(totals.totalHtCents)} €
              </span>
            </div>
            {totals.byRate.map((entry) => (
              <div
                key={entry.rateBp}
                className="flex items-center justify-between text-blue-600/85 dark:text-blue-300/75"
              >
                <span>
                  TVA {formatVatRateBp(entry.rateBp)} sur{" "}
                  {formatEuros(entry.baseCents)} €
                </span>
                <span>{formatEuros(entry.vatCents)} €</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-base font-bold">
              <span>Total TTC</span>
              <span>{formatEuros(totals.totalTtcCents)} €</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between border-t border-blue-200 pt-2 text-base font-bold dark:border-blue-900">
              <span>Total</span>
              <span>{formatEuros(totals.totalHtCents)} €</span>
            </div>
            <p className="text-xs text-blue-600/75 dark:text-blue-300/65">
              {VAT_EXEMPTION_MENTION}
            </p>
          </>
        )}

        {margin ? (
          <div className="flex items-center justify-between border-t border-blue-200 pt-2 text-blue-800 dark:border-blue-900 dark:text-blue-200">
            <span>
              Déboursé {formatEuros(margin.totalCostCents)} € · Marge
            </span>
            <span className="font-semibold">
              {formatEuros(margin.totalMarginCents)} €
              {marginPercent !== null
                ? ` (${marginPercent.toLocaleString("fr-FR", {
                    maximumFractionDigits: 1,
                  })} %)`
                : ""}
            </span>
          </div>
        ) : null}
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
