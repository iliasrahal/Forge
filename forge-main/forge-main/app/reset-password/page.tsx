"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <main className="flex min-h-dvh items-center justify-center bg-white px-6 py-8 text-slate-950">
      <section className="w-full max-w-md">
        <Link href="/login" className="text-sm font-medium text-blue-700">
          Retour à la connexion
        </Link>
        <h1 className="mt-8 text-4xl font-bold text-blue-700">
          Nouveau mot de passe
        </h1>
        <p className="mt-3 text-slate-500">
          Choisis un mot de passe d’au moins 8 caractères.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="Nouveau mot de passe"
            required
            minLength={8}
            className="h-14 w-full rounded-2xl border border-slate-200 px-5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <input
            type="password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            autoComplete="new-password"
            placeholder="Confirmer le mot de passe"
            required
            minLength={8}
            className="h-14 w-full rounded-2xl border border-slate-200 px-5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
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
      </section>
    </main>
  );
}
