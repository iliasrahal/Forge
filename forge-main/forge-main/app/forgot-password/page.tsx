"use client";

import Link from "next/link";
import { useState } from "react";

import AuthShell from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Impossible de traiter la demande.");
      }

      setMessage(data.message || "Vérifie ta boîte e-mail.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Une erreur est survenue.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Accès sécurisé"
      title="Retrouve ton accès."
      description="Saisis ton e-mail et nous t’enverrons un lien sécurisé pour choisir un nouveau mot de passe."
    >
        <Link href="/login" className="text-sm font-medium text-blue-700 dark:text-blue-400">
          ← Retour à la connexion
        </Link>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="Adresse e-mail"
            required
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-950"
          />
          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="h-14 w-full rounded-2xl bg-blue-600 px-6 text-lg font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
          >
            {isLoading ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>
    </AuthShell>
  );
}
