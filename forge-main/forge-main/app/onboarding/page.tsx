"use client";

import { useEffect, useState } from "react";
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
    useState<"job" | "workMode" | "ready">("job");


  const [firstName, setFirstName] =
    useState("");


  const [job, setJob] =
    useState<Job | null>(null);


  const [workMode, setWorkMode] =
    useState<WorkMode | null>(null);


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


    setFirstName(
      savedFirstName?.trim() || "",
    );

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

    setStep("ready");

  }

async function finishOnboarding() {

if (
  isLoading ||
  !job ||
  !workMode ||
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
    "h-14 w-full rounded-2xl border-2 border-slate-200 bg-white px-5 text-base font-semibold text-slate-800 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700";



  const workModeButtonClassName =
    "h-16 w-full rounded-2xl border-2 border-slate-200 bg-white px-6 text-lg font-semibold text-slate-800 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700";




  return (

    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-10">


      <section className="w-full max-w-md">


        {step === "job" && (

          <div>


            <h1 className="text-center text-4xl font-bold text-blue-700">
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


            <h1 className="text-center text-4xl font-bold text-blue-700">
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






        {step === "ready" && (

          <div className="text-center">


           <div className="mx-auto flex h-20 w-20 items-center justify-center">
  <ForgeLogo size={80} />
</div>


            <h1 className="mt-8 text-4xl font-bold text-blue-700">
              Ton espace est prêt.
            </h1>



            {error && (

              <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
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

  <p className="text-sm text-slate-600">
    J'accepte les{" "}
    <span className="font-semibold text-blue-700">
      Conditions Générales d'Utilisation
    </span>{" "}
    et la{" "}
    <span className="font-semibold text-blue-700">
      Politique de confidentialité
    </span>
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