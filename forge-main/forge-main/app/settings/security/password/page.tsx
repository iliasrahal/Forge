"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { changeOwnPassword } from "./_actions";

export default function PasswordPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleSubmit(formData: FormData) {
    setError("");
    setSuccess("");

    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");

      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les nouveaux mots de passe ne correspondent pas.");

      return;
    }

    startTransition(async () => {
      const result = await changeOwnPassword(formData);

      if (result.ok) {
        setSuccess("Mot de passe modifié avec succès.");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <main className="min-dvh bg-white px-6 py-8 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="mx-auto max-w-xl">
        <Link
          href="/settings/security"
          className="forge-back-link text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Retour
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-blue-700 dark:text-blue-400">
          Modifier mon mot de passe
        </h1>

        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Mets à jour ton mot de passe Forge.
        </p>

        <form
          action={handleSubmit}
          className="mt-8 space-y-5 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400">
              Ancien mot de passe
            </label>
            <input
              type="password"
              name="currentPassword"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              name="newPassword"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              name="confirmPassword"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </section>
    </main>
  );
}
