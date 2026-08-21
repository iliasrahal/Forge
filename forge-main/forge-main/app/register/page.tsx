"use client";

import { useState } from "react";

type RegisterResponse = {
  user?: {
    id: string;
    firstName: string;
    email: string;
    phone: string;
    birthDate: string;
    onboardingCompleted: boolean;
  };
  error?: string;
  activationRequired?: boolean;
};

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");

  const [email, setEmail] = useState("");

  const [phone, setPhone] = useState("");

  const [birthDate, setBirthDate] = useState("");

  const [password, setPassword] = useState("");

  const [
    passwordConfirmation,
    setPasswordConfirmation,
  ] = useState("");

  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [activationSent, setActivationSent] = useState(false);


  function formatBirthDate(value: string) {
    const numbers = value.replace(/\D/g, "");

    if (numbers.length <= 2) {
      return numbers;
    }

    if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    }

    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  }


  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (isLoading) {
      return;
    }


    const cleanFirstName =
      firstName.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanPhone =
      phone.trim();

    const cleanBirthDate =
      birthDate.trim();


    if (
      !cleanFirstName ||
      !cleanEmail ||
      !cleanPhone ||
      !cleanBirthDate ||
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

              email:
                cleanEmail,

              phone:
                cleanPhone,

              birthDate:
                cleanBirthDate,

              password,
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
      <main className="flex min-h-screen items-center justify-center bg-white px-6 py-10">
        <section className="mx-auto w-full max-w-md text-center">
          <h1 className="text-4xl font-bold text-blue-700">Vérifie ton e-mail.</h1>
          <p className="mt-4 text-slate-500">
            Un lien d’activation a été envoyé à ton adresse e-mail. Il est valable 24 heures.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Pense à vérifier tes courriers indésirables.
          </p>
        </section>
      </main>
    );
  }



  return (
    <main className="min-h-screen bg-white px-6 py-10">

      <section className="mx-auto max-w-md">


        <h1 className="text-center text-4xl font-bold text-blue-700">
          Commençons.
        </h1>



        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4"
        >


       <input
  type="text"
  value={firstName}
  onChange={(event) => {
    console.log(event.target.value);
    setFirstName(event.target.value);
  }}
  autoComplete="given-name"
  placeholder="Ton prénom"
  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />



          <input
            type="text"
            value={birthDate}
            onChange={(event) =>
              setBirthDate(
                formatBirthDate(
                  event.target.value,
                ),
              )
            }
            maxLength={10}
            inputMode="numeric"
            autoComplete="bday"
            placeholder="Ta date de naissance"
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />



          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
              {error}
            </p>
          )}



          <button
            type="submit"
            disabled={isLoading}
            className="mt-3 h-14 w-full rounded-2xl bg-blue-600 px-6 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >

            {isLoading
              ? "Création..."
              : "Continuer"}

          </button>


        </form>


      </section>


    </main>
  );
}