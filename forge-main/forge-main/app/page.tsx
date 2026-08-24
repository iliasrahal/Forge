"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ForgeLogo from "@/components/ForgeLogo";

export default function LandingPage() {
  const router = useRouter();
  const [leavingDestination, setLeavingDestination] =
    useState<"/login" | "/register" | null>(null);

  useEffect(() => {
    if (!leavingDestination) {
      return;
    }

    const timer = window.setTimeout(() => {
      router.push(leavingDestination);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [leavingDestination, router]);

  const navigateWithForge = (destination: "/login" | "/register") => {
    if (leavingDestination) {
      return;
    }

    setLeavingDestination(destination);
  };

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-white px-6 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <ForgeLogo size={80} />
        </div>

        <h1 className="mt-8 text-4xl font-bold leading-tight text-blue-700 dark:text-blue-400">
          <span className="block">Salut,</span>
          <span className="block">
            je suis F
            <span
              className={
                leavingDestination ? "landing-o-zoom" : ""
              }
            >
              o
            </span>
            rge,
          </span>
          <span className="block">ton copilote.</span>
        </h1>

        <button
          type="button"
          onClick={() => navigateWithForge("/login")}
          disabled={Boolean(leavingDestination)}
          className="mt-10 block w-full rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-90"
        >
          Se connecter
        </button>

        <div className="mt-7">
          <button
            type="button"
            onClick={() => navigateWithForge("/register")}
            disabled={Boolean(leavingDestination)}
            className="font-semibold text-blue-700 transition hover:text-blue-800 disabled:cursor-wait disabled:opacity-70 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Créer mon espace
          </button>
        </div>
      </section>
    </main>
  );
}