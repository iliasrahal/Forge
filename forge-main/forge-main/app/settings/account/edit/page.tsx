"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";



type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  job: string;
  workMode: string;
};





export default function EditAccountPage() {


  const router = useRouter();




  const [profile, setProfile] =
    useState<UserProfile>({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      companyName: "",
      job: "",
      workMode: "",
    });





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







  function updateField(
    field: keyof UserProfile,
    value: string,
  ) {


    setProfile({
      ...profile,
      [field]: value,
    });


  }








  function saveProfile() {


    localStorage.setItem(
      "forgeUserProfile",
      JSON.stringify(profile),
    );



    router.push(
      "/settings/account",
    );


    router.refresh();


  }








  return (
    <main className="min-dvh bg-white px-6 py-8 text-slate-950 dark:bg-slate-950 dark:text-white">


      <section className="mx-auto max-w-xl">





        <Link
          href="/settings/account"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          Retour
        </Link>






        <h1 className="mt-6 text-3xl font-bold text-blue-700 dark:text-blue-400">
          Modifier mon compte
        </h1>





        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Mets à jour tes informations Forge.
        </p>







        <div className="mt-8 space-y-4">





          {[
            ["firstName", "Prénom"],
            ["lastName", "Nom"],
            ["email", "Email"],
            ["phone", "Téléphone"],
            ["companyName", "Entreprise"],
          ].map(([field, label]) => (


            <div key={field}>


              <label className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400">
                {label}
              </label>




              <input
                value={
                  profile[field as keyof UserProfile] || ""
                }
                onChange={(event) =>
                  updateField(
                    field as keyof UserProfile,
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />



            </div>


          ))}







          <div>


            <label className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400">
              Métier
            </label>



            <select
              value={profile.job}
              onChange={(event) =>
                updateField(
                  "job",
                  event.target.value,
                )
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >

              <option value="PLOMBIER_CHAUFFAGISTE">
                Plombier / Chauffagiste
              </option>


              <option value="ELECTRICIEN">
                Électricien
              </option>


              <option value="PEINTRE_BATIMENT">
                Peintre en bâtiment
              </option>


              <option value="MENUISIER">
                Menuisier
              </option>


              <option value="AUTRE">
                Autre
              </option>


            </select>


          </div>








          <div>


            <label className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400">
              Mode de travail
            </label>




            <select
              value={profile.workMode}
              onChange={(event) =>
                updateField(
                  "workMode",
                  event.target.value,
                )
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >

              <option value="SOLO">
                Seul / Seule
              </option>


              <option value="TEAM">
                En équipe
              </option>


            </select>


          </div>






        </div>







        <button
          type="button"
          onClick={saveProfile}
          className="mt-8 w-full rounded-2xl bg-blue-600 px-5 py-4 font-semibold text-white transition hover:bg-blue-700"
        >
          Enregistrer
        </button>





      </section>




    </main>
  );
}
