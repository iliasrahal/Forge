"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";

import {
  formatPricingType,
  formatServicePrice,
  type ServicePricingTypeValue,
} from "@/src/lib/service-catalog";

type CatalogService = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  pricingType: ServicePricingTypeValue;
};

type ServiceResponse = { service?: CatalogService; error?: string };

const emptyForm = {
  name: "",
  description: "",
  price: "",
  pricingType: "FIXED" as ServicePricingTypeValue,
};

function centsToInput(priceCents: number) {
  return (priceCents / 100).toFixed(2).replace(".", ",");
}

export default function ServiceCatalogClient({
  initialServices,
  canWrite,
}: {
  initialServices: CatalogService[];
  canWrite: boolean;
}) {
  const [services, setServices] = useState(initialServices);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CatalogService | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(service: CatalogService) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description ?? "",
      price: centsToInput(service.priceCents),
      pricingType: service.pricingType,
    });
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setEditingId(null);
    setError("");
  }

  async function saveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !canWrite) return;

    setSaving(true);
    setError("");
    const response = await fetch(
      editingId ? `/api/service-catalog/${editingId}` : "/api/service-catalog",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
    );
    const data = (await response.json().catch(() => ({}))) as ServiceResponse;
    setSaving(false);

    if (!response.ok || !data.service) {
      setError(data.error ?? "Impossible d’enregistrer la prestation.");
      return;
    }

    setServices((current) => {
      const updated = editingId
        ? current.map((service) =>
            service.id === data.service?.id ? data.service : service,
          )
        : [...current, data.service as CatalogService];
      return updated.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    });
    closeForm();
  }

  async function deleteService() {
    if (!pendingDelete || deleting || !canWrite) return;

    setDeleting(true);
    setError("");
    const response = await fetch(`/api/service-catalog/${pendingDelete.id}`, {
      method: "DELETE",
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setDeleting(false);

    if (!response.ok) {
      setError(data.error ?? "Impossible de supprimer la prestation.");
      setPendingDelete(null);
      return;
    }

    setServices((current) => current.filter(({ id }) => id !== pendingDelete.id));
    setPendingDelete(null);
  }

  return (
    <div className="mt-8">
      {canWrite && services.length > 0 ? (
        <div className="mb-5 flex justify-end">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(100deg,var(--forge-accent-blue-lit),var(--forge-accent-blue)_62%,var(--forge-accent-pink))] px-5 py-3 font-semibold text-white shadow-[0_18px_38px_-24px_rgba(76,110,245,0.8)] transition hover:-translate-y-0.5"
          >
            <Plus size={18} /> Nouvelle prestation
          </button>
        </div>
      ) : null}

      {error && !showForm ? (
        <p className="mb-4 rounded-2xl border border-red-300/50 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {services.length === 0 ? (
        <div className="py-14 text-center">
          <h2 className="text-xl font-bold text-[var(--forge-text-primary)]">
            Aucune prestation enregistrée.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[var(--forge-text-secondary)]">
            Ajoute tes prestations habituelles pour accélérer la création de tes devis.
          </p>
          {canWrite ? (
            <button
              type="button"
              onClick={openCreate}
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[var(--forge-accent-blue)] px-5 py-3 font-semibold text-white transition hover:brightness-110"
            >
              <Plus size={18} /> Nouvelle prestation
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <article key={service.id} className="forge-surface rounded-3xl border p-5 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-[var(--forge-text-primary)]">
                    {service.name}
                  </h2>
                  {service.description ? (
                    <p className="mt-2 text-sm leading-6 text-[var(--forge-text-secondary)]">
                      {service.description}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-full border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)] px-3 py-1 text-xs font-semibold text-[var(--forge-text-secondary)]">
                  {formatPricingType(service.pricingType)}
                </span>
              </div>

              <p className="mt-5 text-2xl font-bold text-[var(--forge-accent-blue-lit)]">
                {formatServicePrice(service.priceCents)}
                {service.pricingType === "HOURLY" ? <span className="text-sm"> / h</span> : null}
                {service.pricingType === "UNIT" ? <span className="text-sm"> / unité</span> : null}
              </p>

              {canWrite ? (
                <div className="mt-5 flex gap-2 border-t border-[var(--forge-border)] pt-4">
                  <button
                    type="button"
                    onClick={() => openEdit(service)}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--forge-border-strong)] bg-[var(--forge-surface-secondary)] px-3 font-semibold text-[var(--forge-text-primary)] transition hover:brightness-105"
                  >
                    <Pencil size={16} /> Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(service)}
                    aria-label={`Supprimer ${service.name}`}
                    className="inline-grid min-h-11 min-w-11 place-items-center rounded-xl border border-red-400/40 bg-red-500/10 text-red-600 transition hover:bg-red-500/15 dark:text-red-300"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:items-center sm:p-6">
          <form
            onSubmit={saveService}
            className="forge-surface max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] border p-5 sm:p-7"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-[var(--forge-text-primary)]">
                {editingId ? "Modifier la prestation" : "Nouvelle prestation"}
              </h2>
              <button type="button" onClick={closeForm} aria-label="Fermer" className="grid h-10 w-10 place-items-center rounded-full text-[var(--forge-text-secondary)] hover:bg-[var(--forge-surface-hover)]">
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-[var(--forge-text-secondary)]">
                Nom *
                <input required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 h-13 w-full rounded-2xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] px-4 text-[var(--forge-text-primary)] outline-none focus:border-[var(--forge-accent-blue)] focus:ring-4 focus:ring-blue-500/15" />
              </label>
              <label className="block text-sm font-semibold text-[var(--forge-text-secondary)]">
                Description facultative
                <textarea maxLength={1000} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 w-full resize-none rounded-2xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] px-4 py-3 text-[var(--forge-text-primary)] outline-none focus:border-[var(--forge-accent-blue)] focus:ring-4 focus:ring-blue-500/15" />
              </label>
              <div className="grid gap-4 min-[430px]:grid-cols-2">
                <label className="block text-sm font-semibold text-[var(--forge-text-secondary)]">
                  Prix *
                  <div className="relative mt-2">
                    <input required inputMode="decimal" placeholder="45,00" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="h-13 w-full rounded-2xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] px-4 pr-10 text-[var(--forge-text-primary)] outline-none focus:border-[var(--forge-accent-blue)] focus:ring-4 focus:ring-blue-500/15" />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[var(--forge-text-muted)]">€</span>
                  </div>
                </label>
                <label className="block text-sm font-semibold text-[var(--forge-text-secondary)]">
                  Type de prix *
                  <select required value={form.pricingType} onChange={(event) => setForm({ ...form, pricingType: event.target.value as ServicePricingTypeValue })} className="mt-2 h-13 w-full rounded-2xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] px-4 text-[var(--forge-text-primary)] outline-none focus:border-[var(--forge-accent-blue)] focus:ring-4 focus:ring-blue-500/15">
                    <option value="FIXED">Prix fixe</option>
                    <option value="HOURLY">Par heure</option>
                    <option value="UNIT">Par unité</option>
                  </select>
                </label>
              </div>
            </div>

            {error ? <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">{error}</p> : null}

            <button disabled={saving} className="mt-6 min-h-13 w-full rounded-2xl bg-[var(--forge-accent-blue)] px-5 font-semibold text-white transition hover:brightness-110 disabled:opacity-50">
              {saving ? "Enregistrement…" : editingId ? "Enregistrer les modifications" : "Créer la prestation"}
            </button>
          </form>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="forge-surface w-full max-w-sm rounded-[2rem] border p-6 text-center">
            <h2 className="text-xl font-bold text-[var(--forge-text-primary)]">Supprimer cette prestation ?</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--forge-text-secondary)]">
              « {pendingDelete.name} » sera retirée uniquement de cette bibliothèque.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setPendingDelete(null)} disabled={deleting} className="min-h-12 rounded-2xl border border-[var(--forge-border-strong)] font-semibold text-[var(--forge-text-primary)]">Annuler</button>
              <button type="button" onClick={() => void deleteService()} disabled={deleting} className="min-h-12 rounded-2xl bg-red-600 px-4 font-semibold text-white disabled:opacity-50">
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
