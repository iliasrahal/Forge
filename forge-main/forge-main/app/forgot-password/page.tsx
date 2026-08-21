"use client";

import Link from "next/link";
import { useState } from "react";

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
    <main className="flex min-h-dvh items-center justify-center bg-white px-6 py-8 text-slate-950">
      <section className="w-full max-w-md">
        <Link href="/login" className="text-sm font-medium text-blue-700">
          Retour à la connexion
        </Link>
        <h1 className="mt-8 text-4xl font-bold text-blue-700">
          Mot de passe oublié ?
        </h1>
        <p className="mt-3 text-slate-500">
          Saisis ton e-mail et nous t’enverrons un lien de réinitialisation.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="Adresse e-mail"
            required
            className="h-14 w-full rounded-2xl border border-slate-200 px-5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
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
      </section>
    </main>
  );
}
