"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function TeamSettingsClient({
  isTeam,
  canManage,
  isOwner = false,
  teamName = "",
}: {
  isTeam: boolean;
  canManage: boolean;
  isOwner?: boolean;
  teamName?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<"ADMIN" | "READ_ONLY">("READ_ONLY");
  const [notice, setNotice] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function deleteTeam() {
    if (!window.confirm("Supprimer définitivement cette équipe et toutes ses données ?")) {
      return;
    }
    setDeleting(true);
    const response = await fetch("/api/workspaces", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmName: deleteConfirm }),
    });
    const data = await response.json().catch(() => ({}));
    setDeleting(false);

    if (response.ok) {
      router.push("/app");
      router.refresh();
    } else {
      setNotice(data.error ?? "Suppression impossible.");
    }
  }

  async function createTeam(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await response.json();
    setNotice(response.ok ? "Équipe créée." : data.error);
    if (response.ok) router.refresh();
  }

  async function invite(event: FormEvent) {
    event.preventDefault();
    const list = emails.split(/[\n,;]/).map((email) => email.trim()).filter(Boolean);
    const response = await fetch("/api/team/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails: list, role }),
    });
    const data = await response.json();
    setNotice(response.ok ? `${data.count} invitation${data.count > 1 ? "s" : ""} envoyée${data.count > 1 ? "s" : ""}.` : data.error);
    if (response.ok) setEmails("");
  }

  if (!isTeam) {
    return (
      <form onSubmit={createTeam} className="mt-8 space-y-4">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Nom de l’entreprise / équipe</label>
        <input value={name} onChange={(event) => setName(event.target.value)} required className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/80" />
        <button className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">Créer mon équipe</button>
        {notice && <p className="text-center text-sm text-slate-500 dark:text-slate-400">{notice}</p>}
      </form>
    );
  }

  return (
    <>
      {canManage ? (
        <form onSubmit={invite} className="mt-8 space-y-4">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Adresses e-mail</label>
          <textarea value={emails} onChange={(event) => setEmails(event.target.value)} required rows={4} placeholder="paul@email.com, lucas@email.com" className="w-full resize-none rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/80" />
          <select value={role} onChange={(event) => setRole(event.target.value as "ADMIN" | "READ_ONLY")} className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80">
            <option value="READ_ONLY">Lecture seule — gratuit</option>
            <option value="ADMIN">Admin — abonnement personnel requis</option>
          </select>
          <button className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">Envoyer les invitations</button>
        </form>
      ) : (
        <p className="mt-6 text-center text-slate-500 dark:text-slate-400">Tu peux consulter les membres de cet espace.</p>
      )}

      {isOwner ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50/70 p-4 dark:border-red-500/40 dark:bg-red-500/10">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">Supprimer l’équipe</p>
          <p className="mt-1 text-xs text-red-600/90 dark:text-red-400/90">
            Toutes les données de l’équipe (clients, interventions, devis, factures) seront définitivement supprimées. Retape <span className="font-mono">{teamName}</span> pour confirmer.
          </p>
          <input
            value={deleteConfirm}
            onChange={(event) => setDeleteConfirm(event.target.value)}
            placeholder={teamName}
            className="mt-2 w-full rounded-xl border border-red-300 bg-white/80 px-3 py-2 text-sm outline-none focus:border-red-500 dark:border-red-500/40 dark:bg-slate-900/70"
          />
          <button
            type="button"
            onClick={deleteTeam}
            disabled={deleting || deleteConfirm.trim() !== teamName}
            className="mt-2 w-full rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
          >
            {deleting ? "Suppression…" : "Supprimer définitivement"}
          </button>
        </div>
      ) : null}

      {notice && <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">{notice}</p>}
    </>
  );
}
