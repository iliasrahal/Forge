"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function TeamSettingsClient({ isTeam, canManage }: { isTeam: boolean; canManage: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<"ADMIN" | "READ_ONLY">("READ_ONLY");
  const [notice, setNotice] = useState("");

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

  if (!canManage) return <p className="mt-6 text-center text-slate-500 dark:text-slate-400">Tu peux consulter les membres de cet espace.</p>;

  return (
    <form onSubmit={invite} className="mt-8 space-y-4">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Adresses e-mail</label>
      <textarea value={emails} onChange={(event) => setEmails(event.target.value)} required rows={4} placeholder="paul@email.com, lucas@email.com" className="w-full resize-none rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900/80" />
      <select value={role} onChange={(event) => setRole(event.target.value as "ADMIN" | "READ_ONLY")} className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80">
        <option value="READ_ONLY">Lecture seule — gratuit</option>
        <option value="ADMIN">Admin — abonnement personnel requis</option>
      </select>
      <button className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">Envoyer les invitations</button>
      {notice && <p className="text-center text-sm text-slate-500 dark:text-slate-400">{notice}</p>}
    </form>
  );
}
