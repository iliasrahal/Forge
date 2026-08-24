"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    <main className="flex min-h-dvh items-center justify-center bg-white px-6 py-8 text-center text-slate-950">
      <section className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-blue-700">
          {status === "loading" ? "Activation en cours..." : status === "success" ? "Compte activé" : "Activation impossible"}
        </h1>
        {message && <p className="mt-4 text-slate-500">{message}</p>}
        {status !== "loading" && (
          <Link
            href="/login"
            className="mt-8 inline-block rounded-2xl bg-blue-600 px-6 py-4 font-semibold text-white hover:bg-blue-700"
          >
            Aller à la connexion
          </Link>
        )}
      </section>
    </main>
  );
}
