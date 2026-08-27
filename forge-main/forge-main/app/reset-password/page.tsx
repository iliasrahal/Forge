"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import AuthShell from "@/components/auth/AuthShell";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const token = new URLSearchParams(window.location.search).get("token") || "";

    if (!token) {
      setError("Ce lien est invalide ou incomplet.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, passwordConfirmation }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Impossible de réinitialiser le mot de passe.");
      }

      router.push("/login?reset=success");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue.",
      );
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Nouveau mot de passe"
      description="Choisis un mot de passe d’au moins 8 caractères."
    >
        <Link href="/login" className="text-sm font-medium text-blue-700 dark:text-blue-400">
          ← Retour à la connexion
        </Link>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="Nouveau mot de passe"
            required
            minLength={8}
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-950"
          />
          <input
            type="password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            autoComplete="new-password"
            placeholder="Confirmer le mot de passe"
            required
            minLength={8}
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-950"
          />
          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="h-14 w-full rounded-2xl bg-blue-600 px-6 text-lg font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
          >
            {isLoading ? "Enregistrement..." : "Réinitialiser le mot de passe"}
          </button>
        </form>
    </AuthShell>
  );
}
