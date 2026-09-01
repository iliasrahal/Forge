"use client";


import Link from "next/link";
import { useEffect, useState } from "react";




type UserProfile = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  job?: string;
  workMode?: string;
};




export default function AccountPage() {



  const [profile, setProfile] =
    useState<UserProfile>({});




  useEffect(() => {



    const saved =
      localStorage.getItem(
        "forgeUserProfile",
      );




    if (saved) {
      setProfile(
        JSON.parse(saved),
      );
    }



  }, []);





  return (
    <main className="min-h-dvh px-6 py-8 text-slate-950 dark:text-white">




      <section className="mx-auto max-w-xl">




        <Link
          href="/settings"
          className="forge-back-link text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Retour
        </Link>





        <h1 className="mt-6 text-3xl font-bold text-blue-700 dark:text-blue-400">
          Compte
        </h1>





        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Gère tes informations personnelles.
        </p>





        <div className="mt-8 space-y-4">




          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nom
            </p>

            <p className="mt-1 font-semibold">
              {profile.firstName || ""}
              {" "}
              {profile.lastName || ""}
            </p>

          </div>






          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Email
            </p>

            <p className="mt-1 font-semibold">
              {profile.email || "Non renseigné"}
            </p>

          </div>






          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Téléphone
            </p>

            <p className="mt-1 font-semibold">
              {profile.phone || "Non renseigné"}
            </p>

          </div>






          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Entreprise
            </p>

            <p className="mt-1 font-semibold">
              {profile.companyName || "Non renseignée"}
            </p>

          </div>






          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Métier
            </p>

            <p className="mt-1 font-semibold">
              {profile.job || "Plombier / Chauffagiste"}
            </p>

          </div>






          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mode de travail
            </p>

            <p className="mt-1 font-semibold">
              {profile.workMode === "SOLO"
                ? "Seul / Seule"
                : profile.workMode === "TEAM"
                ? "En équipe"
                : "Non renseigné"}
            </p>

          </div>





        </div>






        <Link
          href="/settings/account/edit"
          className="
            mt-8
            block
            w-full
            rounded-2xl
            bg-blue-600
            px-5
            py-4
            text-center
            font-semibold
            text-white
            transition
            hover:bg-blue-700
          "
        >
          Modifier mes informations
        </Link>





      </section>




    </main>
  );
}
