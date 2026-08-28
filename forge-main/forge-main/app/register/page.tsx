"use client";

import { useEffect, useState } from "react";

import AuthShell from "@/components/auth/AuthShell";

type RegisterResponse = {
  user?: {
    id: string;
    firstName: string;
    lastName: string | null;
    companyName: string | null;
    email: string;
    phone: string;
    onboardingCompleted: boolean;
  };
  error?: string;
  activationRequired?: boolean;
};

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");

  const [lastName, setLastName] = useState("");

  const [companyName, setCompanyName] = useState("");

  const [email, setEmail] = useState("");

  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");

  const [
    passwordConfirmation,
    setPasswordConfirmation,
  ] = useState("");

  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [activationSent, setActivationSent] = useState(false);
  const [invitationToken, setInvitationToken] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      setInvitationToken(
        new URLSearchParams(window.location.search).get("invitation") || "",
      ),
    );

    return () => window.cancelAnimationFrame(frame);
  }, []);


  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (isLoading) {
      return;
    }


    const cleanFirstName =
      firstName.trim();

    const cleanLastName =
      lastName.trim();

    const cleanCompanyName =
      companyName.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanPhone =
      phone.trim();

    if (
      !cleanFirstName ||
      !cleanLastName ||
      !cleanEmail ||
      !cleanPhone ||
      !password ||
      !passwordConfirmation
    ) {
      setError(
        "Complète toutes les informations.",
      );

      return;
    }


    if (!cleanEmail.includes("@")) {
      setError(
        "L’adresse e-mail semble incorrecte.",
      );

      return;
    }


    if (password.length < 8) {
      setError(
        "Le mot de passe doit contenir au moins 8 caractères.",
      );

      return;
    }


    if (
      password !== passwordConfirmation
    ) {
      setError(
        "Les mots de passe ne correspondent pas.",
      );

      return;
    }


    setIsLoading(true);
    setError("");


    try {
      const response =
        await fetch(
          "/api/auth/register",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              firstName:
                cleanFirstName,

              lastName:
                cleanLastName,

              companyName:
                cleanCompanyName,

              email:
                cleanEmail,

              phone:
                cleanPhone,

              password,

              invitationToken:
                invitationToken || undefined,
            }),
          },
        );


      const data =
        (await response.json()) as RegisterResponse;


      if (!response.ok) {
        throw new Error(
          data.error ||
          "Impossible de créer le compte.",
        );
      }


      setActivationSent(true);
      setIsLoading(false);


    } catch (error) {

      setError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue.",
      );


      setIsLoading(false);

    }
  }

  if (activationSent) {
    return (
      <AuthShell
        eyebrow="Une dernière étape"
        title="Vérifie ton e-mail."
        description="Ton espace Forge est presque prêt."
      >
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            ✓
          </div>
          <p className="mt-5 text-slate-600 dark:text-slate-300">
            Un lien d’activation a été envoyé à ton adresse e-mail. Il est valable 24 heures.
          </p>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Pense à vérifier tes courriers indésirables.
          </p>
        </div>
      </AuthShell>
    );
  }



  return (
    <AuthShell
      wide
      eyebrow="Bienvenue sur Forge"
      title="Créons ton espace."
      description="Quelques informations suffisent pour préparer un espace adapté à ton activité."
    >
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >


       <input
  type="text"
  value={firstName}
  onChange={(event) => {
    setFirstName(event.target.value);
  }}
  autoComplete="given-name"
  placeholder="Ton prénom"
  required
  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-950"
/>

          <input
            type="text"
            value={lastName}
            onChange={(event) => {
              setLastName(event.target.value);
            }}
            autoComplete="family-name"
            placeholder="Ton nom"
            required
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-950"
          />

          <input
            type="text"
            value={companyName}
            onChange={(event) => {
              setCompanyName(event.target.value);
            }}
            autoComplete="organization"
            placeholder="Nom de l’entreprise (facultatif)"
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-950"
          />


          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value,
              )
            }
            autoComplete="email"
            placeholder="Ton adresse e-mail"
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-950"
          />



          <input
            type="tel"
            value={phone}
            onChange={(event) =>
              setPhone(
                event.target.value,
              )
            }
            autoComplete="tel"
            placeholder="Ton numéro de téléphone"
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-950"
          />



          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value,
              )
            }
            autoComplete="new-password"
            placeholder="Ton mot de passe"
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-950"
          />



          <input
            type="password"
            value={passwordConfirmation}
            onChange={(event) =>
              setPasswordConfirmation(
                event.target.value,
              )
            }
            autoComplete="new-password"
            placeholder="Confirme ton mot de passe"
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-950"
          />



          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}



          <button
            type="submit"
            disabled={isLoading}
            className="mt-3 h-14 w-full rounded-2xl bg-blue-600 px-6 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >

            {isLoading
              ? "Création..."
              : "Continuer"}

          </button>


        </form>


    </AuthShell>
  );
}
