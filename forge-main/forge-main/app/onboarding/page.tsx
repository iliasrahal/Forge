"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type OnboardingResponse = {
  user?: {
    id: string;
    firstName: string;
    onboardingCompleted: boolean;
  };
  error?: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    const savedFirstName = localStorage.getItem("forgeUserFirstName");
    const frame = window.requestAnimationFrame(() => {
      setFirstName(savedFirstName?.trim() || "");
      setAcceptedTerms(
        sessionStorage.getItem("forgeOnboardingTermsAccepted") === "true",
      );
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  async function finishOnboarding() {
    if (isLoading || !acceptedTerms) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/onboarding", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = (await response.json()) as OnboardingResponse;

      if (!response.ok) {
        throw new Error(
          data.error || "Impossible de terminer l’onboarding.",
        );
      }

      const savedFirstName = data.user?.firstName || firstName;

      localStorage.setItem("forgeUserFirstName", savedFirstName);
      localStorage.setItem("forgeOnboardingCompleted", "true");

      const existingProfile = JSON.parse(
        localStorage.getItem("forgeUserProfile") || "{}",
      );

      localStorage.setItem(
        "forgeUserProfile",
        JSON.stringify({
          ...existingProfile,
          firstName: savedFirstName,
        }),
      );
      localStorage.setItem("forgeShowInitialWelcome", "true");
      sessionStorage.removeItem("forgeOnboardingTermsAccepted");

      router.replace("/app");
      router.refresh();
    } catch (finishError) {
      setError(
        finishError instanceof Error
          ? finishError.message
          : "Une erreur est survenue.",
      );
      setIsLoading(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-6 pb-10 pt-28 text-slate-950 dark:bg-slate-950 dark:text-white sm:pt-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_15%,rgba(37,99,235,0.12),transparent_35%),radial-gradient(circle_at_20%_90%,rgba(14,165,233,0.08),transparent_30%)] dark:bg-[radial-gradient(circle_at_50%_15%,rgba(59,130,246,0.15),transparent_35%),radial-gradient(circle_at_80%_90%,rgba(14,165,233,0.08),transparent_30%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)] dark:opacity-20"
      />

      <section className="w-full max-w-md text-center">
        <h1 className="mt-8 text-4xl font-bold text-blue-700 dark:text-blue-400">
          Ton espace est prêt.
        </h1>

        {error && (
          <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-start gap-3 text-left">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => {
              const isAccepted = event.target.checked;
              setAcceptedTerms(isAccepted);
              sessionStorage.setItem(
                "forgeOnboardingTermsAccepted",
                String(isAccepted),
              );
            }}
            className="mt-1 h-5 w-5 rounded border-slate-300"
          />

          <p className="text-sm text-slate-600 dark:text-slate-300">
            J&apos;accepte les{" "}
            <Link
              href="/conditions-generales-utilisation?returnTo=/onboarding"
              className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 transition hover:text-blue-800 dark:text-blue-400 dark:decoration-blue-800 dark:hover:text-blue-300"
            >
              Conditions Générales d&apos;Utilisation
            </Link>{" "}
            et la{" "}
            <Link
              href="/politique-confidentialite?returnTo=/onboarding"
              className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 transition hover:text-blue-800 dark:text-blue-400 dark:decoration-blue-800 dark:hover:text-blue-300"
            >
              Politique de confidentialité
            </Link>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={finishOnboarding}
          disabled={isLoading || !acceptedTerms}
          className="mt-10 h-14 w-full rounded-2xl bg-blue-600 px-6 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700"
        >
          {isLoading ? "Préparation..." : "Commencer"}
        </button>
      </section>
    </main>
  );
}
