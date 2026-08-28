"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ForgeLogo from "@/components/ForgeLogo";

type Job =
  | "PLOMBIER_CHAUFFAGISTE"
  | "ELECTRICIEN"
  | "PEINTRE_BATIMENT"
  | "MENUISIER"
  | "AUTRE";

type WorkMode =
  | "SOLO"
  | "TEAM";

type OnboardingResponse = {
  user?: {
    id: string;
    firstName: string;
    job: Job;
    workMode: WorkMode;
    onboardingCompleted: boolean;
  };
  error?: string;
};


export default function OnboardingPage() {

  const router = useRouter();


  const [step, setStep] =
    useState<"job" | "workMode" | "team" | "invite" | "ready">("job");


  const [firstName, setFirstName] =
    useState("");


  const [job, setJob] =
    useState<Job | null>(null);


  const [workMode, setWorkMode] =
    useState<WorkMode | null>(null);

  const [organizationName, setOrganizationName] =
    useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteMessage, setInviteMessage] = useState("");
  const [isSendingInvitations, setIsSendingInvitations] = useState(false);


  const [error, setError] =
    useState("");


  const [isLoading, setIsLoading] =
    useState(false);

    const [acceptedTerms, setAcceptedTerms] =
  useState(false);



  useEffect(() => {

    const savedFirstName =
      localStorage.getItem(
        "forgeUserFirstName",
      );


    const frame = window.requestAnimationFrame(() => {
      setFirstName(
        savedFirstName?.trim() || "",
      );
    });

    return () => window.cancelAnimationFrame(frame);

  }, []);




  function selectJob(
    selectedJob: Job,
  ) {

    setError("");

    setJob(selectedJob);

    setStep("workMode");

  }




  function selectWorkMode(
    selectedWorkMode: WorkMode,
  ) {

    setError("");

    setWorkMode(selectedWorkMode);

    setStep(selectedWorkMode === "TEAM" ? "team" : "ready");

  }

  function addInviteEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = inviteEmail.trim().toLowerCase();

    if (!email.includes("@")) {
      setInviteMessage("Renseigne une adresse e-mail valide.");
      return;
    }

    setInviteEmails((current) =>
      current.includes(email) ? current : [...current, email],
    );
    setInviteEmail("");
    setInviteMessage("");
  }

  async function sendInvitations() {
    if (isSendingInvitations || inviteEmails.length === 0) return;
    setIsSendingInvitations(true);
    setInviteMessage("");

    try {
      const response = await fetch("/api/team/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: inviteEmails, organizationName }),
      });
      const data = (await response.json()) as { count?: number; error?: string };
      if (!response.ok) throw new Error(data.error || "Impossible d’envoyer les invitations.");

      setInviteMessage(`${data.count ?? inviteEmails.length} invitations envoyées`);
      window.setTimeout(() => setStep("ready"), 1200);
    } catch (sendError) {
      setInviteMessage(sendError instanceof Error ? sendError.message : "Impossible d’envoyer les invitations.");
      setIsSendingInvitations(false);
    }
  }

async function finishOnboarding() {

if (
  isLoading ||
  !job ||
  !workMode ||
  (workMode === "TEAM" && !organizationName.trim()) ||
  !acceptedTerms
) {
  return;
}
    setIsLoading(true);

    setError("");



    try {


      const response =
        await fetch(
          "/api/auth/onboarding",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              job,
              workMode,
              organizationName:
                workMode === "TEAM"
                  ? organizationName.trim()
                  : undefined,
            }),

          },
        );



      const data =
        (await response.json()) as OnboardingResponse;



      if (!response.ok) {

        throw new Error(
          data.error ||
          "Impossible de terminer l’onboarding.",
        );

      }



      const savedFirstName =
        data.user?.firstName ||
        firstName;



localStorage.setItem(
  "forgeUserFirstName",
  savedFirstName,
);


localStorage.setItem(
  "forgeOnboardingCompleted",
  "true",
);


const existingProfile =
  JSON.parse(
    localStorage.getItem(
      "forgeUserProfile",
    ) || "{}",
  );


localStorage.setItem(
  "forgeUserProfile",
  JSON.stringify({
    ...existingProfile,
    firstName: savedFirstName,
    job,
    workMode,
  }),
);


localStorage.setItem(
  "forgeShowInitialWelcome",
  "true",
);


      router.push("/app");

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





  const jobButtonClassName =
    "h-14 w-full rounded-2xl border border-white/80 bg-white/75 px-5 text-base font-semibold text-slate-800 shadow-[0_14px_38px_-28px_rgba(15,23,42,0.6)] backdrop-blur transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:text-blue-700 dark:border-slate-700/80 dark:bg-slate-900/75 dark:text-slate-100 dark:hover:border-blue-600 dark:hover:bg-slate-900 dark:hover:text-blue-300";



  const workModeButtonClassName =
    "h-16 w-full rounded-2xl border border-white/80 bg-white/75 px-6 text-lg font-semibold text-slate-800 shadow-[0_14px_38px_-28px_rgba(15,23,42,0.6)] backdrop-blur transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:text-blue-700 dark:border-slate-700/80 dark:bg-slate-900/75 dark:text-slate-100 dark:hover:border-blue-600 dark:hover:bg-slate-900 dark:hover:text-blue-300";




  return (

  <main
  className="
    relative
    isolate
    flex
    min-h-screen
    items-center
    justify-center
    overflow-hidden
    bg-slate-50
    px-6
    py-10
    text-slate-950
    dark:bg-slate-950
    dark:text-white
  "
>

  <div
    aria-hidden="true"
    className="
      pointer-events-none
      absolute
      inset-0
      -z-20
      bg-[radial-gradient(circle_at_50%_15%,rgba(37,99,235,0.12),transparent_35%),radial-gradient(circle_at_20%_90%,rgba(14,165,233,0.08),transparent_30%)]
      dark:bg-[radial-gradient(circle_at_50%_15%,rgba(59,130,246,0.15),transparent_35%),radial-gradient(circle_at_80%_90%,rgba(14,165,233,0.08),transparent_30%)]
    "
  />

  <div
    aria-hidden="true"
    className="
      pointer-events-none
      absolute
      inset-0
      -z-10
      opacity-40
      [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)]
      [background-size:56px_56px]
      [mask-image:linear-gradient(to_bottom,black,transparent_75%)]
      dark:opacity-20
    "
  />


  <section className="w-full max-w-md">


    {step === "job" && (

      <div>


        <h1 className="text-center text-4xl font-bold text-blue-700 dark:text-blue-400">
          Quel est ton métier ?
        </h1>


        <div className="mt-8 space-y-3">


          <button
            type="button"
            onClick={() =>
              selectJob(
                "PLOMBIER_CHAUFFAGISTE",
              )
            }
            className={jobButtonClassName}
          >
            Plombier / Plombière -
            Chauffagiste
          </button>


          <button
            type="button"
            onClick={() =>
              selectJob(
                "ELECTRICIEN",
              )
            }
            className={jobButtonClassName}
          >
            Électricien / Électricienne
          </button>


          <button
            type="button"
            onClick={() =>
              selectJob(
                "PEINTRE_BATIMENT",
              )
            }
            className={jobButtonClassName}
          >
            Peintre en bâtiment
          </button>


          <button
            type="button"
            onClick={() =>
              selectJob(
                "MENUISIER",
              )
            }
            className={jobButtonClassName}
          >
            Menuisier / Menuisière
          </button>


          <button
            type="button"
            onClick={() =>
              selectJob("AUTRE")
            }
            className={jobButtonClassName}
          >
            Autre métier
          </button>


        </div>

      </div>

    )}







        {step === "workMode" && (

          <div>


            <h1 className="text-center text-4xl font-bold text-blue-700 dark:text-blue-400">
              Tu travailles…
            </h1>



            <div className="mt-10 space-y-4">


              <button
                type="button"
                onClick={() =>
                  selectWorkMode("SOLO")
                }
                className={workModeButtonClassName}
              >
                Seul / Seule
              </button>



              <button
                type="button"
                onClick={() =>
                  selectWorkMode("TEAM")
                }
                className={workModeButtonClassName}
              >
                En équipe
              </button>


            </div>


          </div>

        )}

        {step === "team" && (
          <div>
            <p className="text-center text-sm font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
              Travail en équipe
            </p>
            <h1 className="mt-4 text-center text-4xl font-bold text-blue-700 dark:text-blue-400">
              Créez votre équipe
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-center leading-7 text-slate-600 dark:text-slate-300">
              <span className="block">
                Créez votre espace d’entreprise.
              </span>
              <span className="block">
                Vous en deviendrez automatiquement le Responsable.
              </span>
            </p>

            <div className="mt-8">
              <label
                htmlFor="organizationName"
                className="mb-2 block text-center text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Nom de l’entreprise / équipe
              </label>
              <input
                id="organizationName"
                type="text"
                value={organizationName}
                onChange={(event) =>
                  setOrganizationName(event.target.value)
                }
                placeholder="Exemple : Martin Plomberie"
                className="h-14 w-full rounded-2xl border border-white/80 bg-white/75 px-5 text-slate-900 shadow-[0_14px_38px_-28px_rgba(15,23,42,0.6)] outline-none backdrop-blur transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/80 dark:bg-slate-900/75 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-center dark:border-blue-900 dark:bg-blue-950/35">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Votre rôle : Responsable
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Les collaborateurs rejoignent ensuite cet espace grâce à une invitation sécurisée par email.
              </p>
            </div>

            <button
              type="button"
              disabled={!organizationName.trim()}
              onClick={() => setStep("invite")}
              className="mt-8 h-14 w-full rounded-2xl bg-blue-600 px-6 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700"
            >
              Continuer
            </button>
          </div>
        )}

        {step === "invite" && (
          <div>
            <p className="text-center text-sm font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
              Travail en équipe
            </p>
            <h1 className="mt-4 text-center text-4xl font-bold text-blue-700 dark:text-blue-400">
              Invitez votre équipe
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-center leading-7 text-slate-600 dark:text-slate-300">
              Ajoutez les collaborateurs qui travailleront avec vous sur Forge.
            </p>

            <form onSubmit={addInviteEmail} className="mt-8">
              <label htmlFor="inviteEmail" className="mb-2 block text-center text-sm font-semibold text-slate-700 dark:text-slate-200">
                Adresse e-mail du collaborateur
              </label>
              <input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="exemple@email.com"
                className="h-14 w-full rounded-2xl border border-white/80 bg-white/75 px-5 text-slate-900 shadow-[0_14px_38px_-28px_rgba(15,23,42,0.6)] outline-none backdrop-blur transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/80 dark:bg-slate-900/75 dark:text-white"
              />
              <button type="submit" className="mt-3 h-12 w-full rounded-2xl border border-blue-200 bg-white/75 px-5 font-semibold text-blue-700 transition hover:border-blue-400 dark:border-blue-800 dark:bg-slate-900/75 dark:text-blue-300">
                + Ajouter un collaborateur
              </button>
            </form>

            {inviteEmails.length > 0 && (
              <div className="mt-5 space-y-2">
                {inviteEmails.map((email) => (
                  <div key={email} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/75 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/75">
                    <span className="min-w-0 truncate">{email}</span>
                    <button type="button" onClick={() => setInviteEmails((current) => current.filter((item) => item !== email))} className="shrink-0 font-semibold text-red-600 dark:text-red-400">
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            )}

            {inviteMessage && (
              <p className="mt-4 text-center text-sm font-semibold text-blue-700 dark:text-blue-300">{inviteMessage}</p>
            )}

            <button type="button" onClick={sendInvitations} disabled={inviteEmails.length === 0 || isSendingInvitations} className="mt-6 h-14 w-full rounded-2xl bg-blue-600 px-6 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700">
              {isSendingInvitations ? "Envoi en cours…" : "Envoyer les invitations"}
            </button>
            <button type="button" onClick={() => setStep("ready")} className="mt-4 w-full text-sm font-semibold text-slate-500 transition hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-300">
              Passer pour le moment
            </button>
          </div>
        )}






        {step === "ready" && (

          <div className="text-center">


  <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
  <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl" />
  <ForgeLogo size={80} />
</div>

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
    onChange={(e) =>
      setAcceptedTerms(
        e.target.checked,
      )
    }
    className="mt-1 h-5 w-5 rounded border-slate-300"
  />

  <p className="text-sm text-slate-600 dark:text-slate-300">
    J&apos;accepte les{" "}
    <Link
      href="/conditions-generales-utilisation"
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 transition hover:text-blue-800 dark:text-blue-400 dark:decoration-blue-800 dark:hover:text-blue-300"
    >
      Conditions Générales d&apos;Utilisation
    </Link>{" "}
    et la{" "}
    <Link
      href="/politique-confidentialite"
      target="_blank"
      rel="noreferrer"
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
              disabled={
  isLoading ||
  !acceptedTerms
}
              className="
                mt-10
                h-14
                w-full
                rounded-2xl
                bg-blue-600
                px-6
                text-lg
                font-semibold
                text-white
                transition
                hover:bg-blue-700
                disabled:bg-slate-300
              "
            >

              {isLoading
                ? "Préparation..."
                : "Commencer"}

            </button>


          </div>

        )}


      </section>


    </main>

  );

}
