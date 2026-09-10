"use client";

import Link from "next/link";
import {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";

export type ClientHistorySection = "interventions" | "quotes" | "invoices";

export type ClientHistoryItem = {
  id: string;
  href: string;
  title: string;
  reference?: string;
  date: string;
  amount?: string;
  status: string;
};

type HistoryContextValue = {
  activeSection: ClientHistorySection;
  setActiveSection: (section: ClientHistorySection) => void;
  documents: Record<ClientHistorySection, ClientHistoryItem[]>;
};

const ClientHistoryContext = createContext<HistoryContextValue | null>(null);

type ProviderProps = {
  interventions: ClientHistoryItem[];
  quotes: ClientHistoryItem[];
  invoices: ClientHistoryItem[];
  children: ReactNode;
};

const sections: Array<{
  id: ClientHistorySection;
  label: string;
  emptyLabel: string;
}> = [
  {
    id: "interventions",
    label: "Interventions",
    emptyLabel: "Aucune intervention pour ce client.",
  },
  { id: "quotes", label: "Devis", emptyLabel: "Aucun devis pour ce client." },
  {
    id: "invoices",
    label: "Factures",
    emptyLabel: "Aucune facture pour ce client.",
  },
];

export function ClientHistoryProvider({
  interventions,
  quotes,
  invoices,
  children,
}: ProviderProps) {
  const [activeSection, setActiveSection] =
    useState<ClientHistorySection>("interventions");
  const documents = { interventions, quotes, invoices };

  return (
    <ClientHistoryContext.Provider
      value={{ activeSection, setActiveSection, documents }}
    >
      {children}
    </ClientHistoryContext.Provider>
  );
}

function useClientHistory() {
  const context = useContext(ClientHistoryContext);
  if (!context) {
    throw new Error("ClientHistoryProvider manquant.");
  }
  return context;
}

export function ClientHistoryCounters() {
  const { documents, setActiveSection } = useClientHistory();

  function selectSection(section: ClientHistorySection) {
    setActiveSection(section);
    document.getElementById("client-history")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div className="mt-6 grid grid-cols-3 gap-1 border-y border-slate-100 py-5 text-center dark:border-slate-700 sm:gap-3">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => selectSection(section.id)}
          aria-label={`Afficher les ${section.label.toLowerCase()}`}
          className="group min-w-0 rounded-xl px-1 py-1.5 transition hover:bg-blue-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-blue-950/40 sm:px-3"
        >
          <span className="block text-xl font-bold text-blue-700 dark:text-blue-400 sm:text-2xl">
            {documents[section.id].length}
          </span>
          <span className="mt-1 block text-[0.68rem] leading-tight text-slate-500 transition group-hover:text-blue-700 dark:text-slate-400 dark:group-hover:text-blue-300 sm:text-sm">
            {section.label}
          </span>
        </button>
      ))}
    </div>
  );
}

export default function ClientHistoryTabs() {
  const { activeSection, setActiveSection, documents } = useClientHistory();
  const activeDocuments = documents[activeSection];
  const activeConfig = sections.find((section) => section.id === activeSection)!;

  return (
    <div id="client-history" className="mt-8 scroll-mt-6">
        <h2 className="text-center text-lg font-semibold text-blue-700 dark:text-blue-400">
          Historique
        </h2>

        <div
          role="tablist"
          aria-label="Historique du client"
          className="mt-4 grid grid-cols-3 rounded-2xl border border-slate-200/80 bg-white/60 p-1 dark:border-slate-700/80 dark:bg-slate-900/50"
        >
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                id={`client-history-tab-${section.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="client-history-panel"
                onClick={() => setActiveSection(section.id)}
                className={`min-w-0 rounded-xl px-1.5 py-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:px-4 sm:text-sm ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-sm"
                    : "text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-blue-950/50 dark:hover:text-blue-300"
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </div>

        <div
          id="client-history-panel"
          role="tabpanel"
          aria-labelledby={`client-history-tab-${activeSection}`}
          className="mt-3"
        >
          {activeDocuments.length > 0 ? (
            <div className="space-y-3">
              {activeDocuments.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="forge-surface-subtle block rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.5)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_22px_55px_-36px_rgba(37,99,235,0.35)] dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-black/30 dark:hover:border-blue-700"
                >
                  <div className="flex min-w-0 flex-col items-start gap-3 min-[380px]:flex-row min-[380px]:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-white">
                        {item.title || "Intervention"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {item.reference ? `${item.reference} · ` : ""}
                        {item.date}
                        {item.amount ? ` · ${item.amount}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900">
                      {item.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {activeConfig.emptyLabel}
              </p>
            </div>
          )}
        </div>
    </div>
  );
}
