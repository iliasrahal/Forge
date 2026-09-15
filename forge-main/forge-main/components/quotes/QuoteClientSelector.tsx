"use client";

import { useMemo, useState } from "react";

type ClientOption = {
  id: string;
  type: "PARTICULIER" | "PROFESSIONNEL";
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  phone: string | null;
  email: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
};

function clientName(client: ClientOption) {
  return client.type === "PROFESSIONNEL"
    ? client.companyName || "Client professionnel"
    : `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() || "Client sans nom";
}

function normalize(value: string) {
  return value.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function QuoteClientSelector({ clients, initialClientId }: { clients: ClientOption[]; initialClientId: string | null }) {
  const [mode, setMode] = useState<"existing" | "new" | "none">(initialClientId ? "existing" : "none");
  const [selectedId, setSelectedId] = useState(initialClientId ?? "");
  const [search, setSearch] = useState("");
  const [newType, setNewType] = useState<"PARTICULIER" | "PROFESSIONNEL">("PARTICULIER");

  const filtered = useMemo(() => {
    const query = normalize(search.trim());
    if (!query) return clients;
    return clients.filter((client) => normalize([
      clientName(client), client.companyName, client.email, client.phone, client.city,
    ].filter(Boolean).join(" ")).includes(query));
  }, [clients, search]);

  const selected = clients.find((client) => client.id === selectedId) ?? null;

  return (
    <fieldset className="space-y-4 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)] p-4">
      <legend className="px-1 text-sm font-semibold text-blue-700 dark:text-blue-400">Client (facultatif)</legend>
      <input type="hidden" name="clientMode" value={mode} />
      <input type="hidden" name="clientId" value={mode === "existing" ? selectedId : ""} />

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--forge-surface-hover)] p-1">
        {([
          ["existing", "Client existant"],
          ["new", "Nouveau client"],
          ["none", "Sans client"],
        ] as const).map(([value, label]) => (
          <button key={value} type="button" onClick={() => setMode(value)} className={`min-h-11 rounded-lg px-2 py-2 text-center text-xs font-semibold transition sm:text-sm ${mode === value ? "bg-blue-600 text-white shadow-sm" : "text-[var(--forge-text-secondary)] hover:bg-[var(--forge-surface-secondary)]"}`}>
            {label}
          </button>
        ))}
      </div>

      {mode === "existing" ? (
        <div className="space-y-3">
          {selected ? (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-blue-400/40 bg-blue-500/10 p-3">
              <div className="min-w-0"><p className="font-semibold text-[var(--forge-text-primary)]">{clientName(selected)}</p><p className="mt-1 text-xs text-[var(--forge-text-muted)]">{[selected.email, selected.phone, [selected.postalCode, selected.city].filter(Boolean).join(" ")].filter(Boolean).join(" · ")}</p></div>
              <button type="button" onClick={() => setSelectedId("")} className="shrink-0 text-sm font-semibold text-blue-600 dark:text-blue-400">Changer</button>
            </div>
          ) : (
            <>
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un client…" className="h-12 w-full rounded-xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] px-4 text-[var(--forge-text-primary)] outline-none focus:border-blue-500" />
              <div className="max-h-52 space-y-2 overflow-y-auto overscroll-contain">
                {filtered.map((client) => <button key={client.id} type="button" onClick={() => setSelectedId(client.id)} className="w-full rounded-xl border border-[var(--forge-border)] bg-[var(--forge-surface)] p-3 text-left hover:border-blue-400"><span className="block font-semibold text-[var(--forge-text-primary)]">{clientName(client)}</span><span className="mt-1 block text-xs text-[var(--forge-text-muted)]">{[client.email, client.phone, client.city].filter(Boolean).join(" · ")}</span></button>)}
                {!filtered.length ? <p className="py-4 text-center text-sm text-[var(--forge-text-muted)]">Aucun client correspondant.</p> : null}
              </div>
            </>
          )}
          {!selectedId ? <p className="text-xs text-amber-700 dark:text-amber-300">Sélectionne un client ou choisis « Sans client ».</p> : null}
        </div>
      ) : null}

      {mode === "new" ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--forge-surface-hover)] p-1">
            <button type="button" onClick={() => setNewType("PARTICULIER")} className={`min-h-10 rounded-lg text-sm font-semibold ${newType === "PARTICULIER" ? "bg-[var(--forge-surface)] text-blue-600 shadow-sm dark:text-blue-400" : "text-[var(--forge-text-secondary)]"}`}>Particulier</button>
            <button type="button" onClick={() => setNewType("PROFESSIONNEL")} className={`min-h-10 rounded-lg text-sm font-semibold ${newType === "PROFESSIONNEL" ? "bg-[var(--forge-surface)] text-blue-600 shadow-sm dark:text-blue-400" : "text-[var(--forge-text-secondary)]"}`}>Professionnel</button>
          </div>
          <input type="hidden" name="newClientType" value={newType} />
          {newType === "PARTICULIER" ? <div className="grid gap-3 sm:grid-cols-2"><input name="newClientFirstName" required placeholder="Prénom *" className="h-12 min-w-0 rounded-xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] px-4 text-[var(--forge-text-primary)]" /><input name="newClientLastName" placeholder="Nom" className="h-12 min-w-0 rounded-xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] px-4 text-[var(--forge-text-primary)]" /></div> : <input name="newClientCompanyName" required placeholder="Entreprise *" className="h-12 w-full rounded-xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] px-4 text-[var(--forge-text-primary)]" />}
          <div className="grid gap-3 sm:grid-cols-2"><input name="newClientEmail" type="email" placeholder="E-mail" className="h-12 min-w-0 rounded-xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] px-4 text-[var(--forge-text-primary)]" /><input name="newClientPhone" type="tel" placeholder="Téléphone" className="h-12 min-w-0 rounded-xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] px-4 text-[var(--forge-text-primary)]" /></div>
          <input name="newClientStreet" placeholder="Adresse" className="h-12 w-full rounded-xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] px-4 text-[var(--forge-text-primary)]" />
          <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3"><input name="newClientPostalCode" placeholder="Code postal" className="h-12 min-w-0 rounded-xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] px-4 text-[var(--forge-text-primary)]" /><input name="newClientCity" placeholder="Ville" className="h-12 min-w-0 rounded-xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] px-4 text-[var(--forge-text-primary)]" /></div>
          <p className="text-xs text-[var(--forge-text-muted)]">Le client sera créé dans le workspace actif lors de l’enregistrement du devis.</p>
        </div>
      ) : null}

      {mode === "none" ? <p className="rounded-xl bg-blue-500/10 p-3 text-sm text-[var(--forge-text-secondary)]">Le devis sera enregistré sans client. Tu pourras en associer un plus tard.</p> : null}
    </fieldset>
  );
}
