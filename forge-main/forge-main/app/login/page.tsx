"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import AuthShell from "@/components/auth/AuthShell";

type UserJob =
  | "PLOMBIER_CHAUFFAGISTE"
  | "ELECTRICIEN"
  | "PEINTRE_BATIMENT"
  | "MENUISIER"
  | "AUTRE";

type WorkMode = "SOLO" | "TEAM";

type LoginResponse = {
  subscriptionRequired?: boolean;
  user?: {
    id: string;
    firstName: string;
    email: string;
    phone: string;
    job: UserJob | null;
    workMode: WorkMode | null;
    onboardingCompleted: boolean;
    themePreference: "light" | "dark" | null;
  };
  error?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { setTheme } = useTheme();

  const [identifier, setIdentifier] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [invitationToken, setInvitationToken] = useState("");

  useEffect(() => {
    setInvitationToken(new URLSearchParams(window.location.search).get("invitation") || "");
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier || !password) {
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
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: cleanIdentifier,
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

      if (invitationToken) {
        const invitationResponse = await fetch("/api/team/invitations/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: invitationToken }),
        });
        if (!invitationResponse.ok) {
          const invitationData = await invitationResponse.json();
          throw new Error(invitationData.error || "Impossible de rejoindre l’équipe.");
        }
      }

      localStorage.setItem(
        "forgeUserFirstName",
        data.user.firstName,
      );

      if (data.user.themePreference) {
        setTheme(data.user.themePreference);
      }

      if (
        data.user.job &&
        data.user.workMode
      ) {
        localStorage.setItem(
          "forgeUserProfile",
          JSON.stringify({
            firstName: data.user.firstName,
            job: data.user.job,
            workMode: data.user.workMode,
          }),
        );
      }

      if (data.user.onboardingCompleted) {
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
    <AuthShell
      bare
      title="Bon retour."
      description="Connecte-toi pour retrouver ton espace et reprendre ta journée là où tu l’as laissée."
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        <label htmlFor="loginIdentifier" className="sr-only">
          Email ou numéro de téléphone
        </label>
        <input
          id="loginIdentifier"
          type="text"
          value={identifier}
          onChange={(event) =>
            setIdentifier(event.target.value)
          }
          autoComplete="username"
          placeholder="email@exemple.com ou 06 12 34 56 78"
          className="h-14 w-full rounded-2xl border border-slate-200/90 bg-white/85 px-5 text-base shadow-[0_10px_30px_-20px_rgba(15,23,42,0.45)] outline-none backdrop-blur-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:shadow-black/30 dark:focus:ring-blue-950"
        />


        <input
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          autoComplete="current-password"
          placeholder="Mot de passe"
          className="h-14 w-full rounded-2xl border border-slate-200/90 bg-white/85 px-5 text-base shadow-[0_10px_30px_-20px_rgba(15,23,42,0.45)] outline-none backdrop-blur-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:shadow-black/30 dark:focus:ring-blue-950"
        />


        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
          >
            Mot de passe oublié ?
          </Link>
        </div>


        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}


        <button
          type="submit"
          disabled={isLoading}
          className="h-14 w-full rounded-2xl bg-blue-600 px-6 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
        >
          {isLoading
            ? "Connexion..."
            : "Se connecter"}
        </button>

      </form>
    </AuthShell>
  );
}
