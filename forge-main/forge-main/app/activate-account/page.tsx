"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import AuthShell from "@/components/auth/AuthShell";

export default function ActivateAccountPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") || "";

    fetch("/api/auth/activate-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error || "Impossible d’activer le compte.");
        }
        setStatus("success");
        setMessage("Ton compte est activé. Tu peux maintenant te connecter.");
      })
      .catch((error: unknown) => {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Impossible d’activer le compte.",
        );
      });
  }, []);

  return (
    <AuthShell
      eyebrow="Bienvenue sur Forge"
      title={status === "loading" ? "Activation en cours…" : status === "success" ? "Ton espace est activé." : "Activation impossible"}
      description={status === "loading" ? "Nous sécurisons ton accès. Cela ne prendra qu’un instant." : message}
    >
      <div className="text-center">
        {status === "loading" && (
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
        )}
        {status !== "loading" && (
          <Link
            href="/login"
            className="mt-8 inline-block rounded-2xl bg-blue-600 px-6 py-4 font-semibold text-white hover:bg-blue-700"
          >
            Aller à la connexion
          </Link>
        )}
      </div>
    </AuthShell>
  );
}
