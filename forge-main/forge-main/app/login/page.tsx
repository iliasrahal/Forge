"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type UserJob =
  | "PLOMBIER_CHAUFFAGISTE"
  | "ELECTRICIEN"
  | "PEINTRE_BATIMENT"
  | "MENUISIER"
  | "AUTRE";

type WorkMode = "SOLO" | "TEAM";

type LoginResponse = {
  user?: {
    id: string;
    firstName: string;
    email: string;
    phone: string;
    job: UserJob | null;
    workMode: WorkMode | null;
    onboardingCompleted: boolean;
  };
  error?: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const cleanIdentifier =
      identifier.trim();

    if (
      !cleanIdentifier ||
      !password
    ) {
      setError(
        "Complète toutes les informations.",
      );

      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            identifier:
              cleanIdentifier,
            password,
          }),
        },
      );

      const data =
        (await response.json()) as LoginResponse;

      if (!response.ok || !data.user) {
        throw new Error(
          data.error ||
            "Impossible de se connecter.",
        );
      }

      localStorage.setItem(
        "forgeUserFirstName",
        data.user.firstName,
      );

      if (
        data.user.job &&
        data.user.workMode
      ) {
        localStorage.setItem(
          "forgeUserProfile",
          JSON.stringify({
            firstName:
              data.user.firstName,
            job: data.user.job,
            workMode:
              data.user.workMode,
          }),
        );
      }

      if (
        data.user.onboardingCompleted
      ) {
        localStorage.setItem(
          "forgeOnboardingCompleted",
          "true",
        );

        router.push("/app");
      } else {
        localStorage.removeItem(
          "forgeOnboardingCompleted",
        );

        router.push("/onboarding");
      }

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue.",
      );

      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-6 py-8 text-slate-950">
      <section className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-700">
            Bon retour.
          </h1>

          <p className="mt-3 text-slate-500">
            Connecte-toi pour retrouver ton espace.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4"
        >
          <input
            type="text"
            value={identifier}
            onChange={(event) =>
              setIdentifier(
                event.target.value,
              )
            }
            autoComplete="username"
            placeholder="E-mail ou téléphone"
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value,
              )
            }
            autoComplete="current-password"
            placeholder="Mot de passe"
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
<div className="text-center">
  <Link
    href="/forgot-password"
    className="text-sm font-medium text-blue-700 transition hover:text-blue-800"
  >
    Mot de passe oublié ?
  </Link>
</div>
          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="h-14 w-full rounded-2xl bg-blue-600 px-6 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isLoading
              ? "Connexion..."
              : "Se connecter"}
          </button>
        </form>

        <div className="mt-7 text-center">
          <p className="text-sm text-slate-500">
            Pas encore de compte ?
          </p>

          <Link
            href="/register"
            className="mt-2 inline-block font-semibold text-blue-700 transition hover:text-blue-800"
          >
            Créer mon espace
          </Link>
        </div>
      </section>
    </main>
  );
}