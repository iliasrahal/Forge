"use client";


import Link from "next/link";



export default function SecurityPage() {


  return (
    <main className="min-dvh bg-white px-6 py-8 text-slate-950 dark:bg-slate-950 dark:text-white">


      <section className="mx-auto max-w-xl">


        <Link
          href="/settings"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          Retour
        </Link>




        <h1 className="mt-6 text-3xl font-bold text-blue-700 dark:text-blue-400">
          Sécurité
        </h1>



        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Gère la sécurité de ton compte Forge.
        </p>





        <div className="mt-8 space-y-4">



          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">


            <h2 className="font-semibold text-blue-700 dark:text-blue-400">
              Mot de passe
            </h2>


            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Modifie ton mot de passe pour sécuriser ton compte.
            </p>



            <Link
              href="/settings/security/password"
              className="mt-5 block w-full rounded-2xl bg-blue-600 px-5 py-4 text-center font-semibold text-white transition hover:bg-blue-700"
            >
              Modifier mon mot de passe
            </Link>


          </div>






          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950">


            <h2 className="font-semibold text-red-700 dark:text-red-400">
              Zone dangereuse
            </h2>


            <p className="mt-2 text-sm text-red-600 dark:text-red-300">
              Supprimer définitivement ton compte Forge.
            </p>



            <Link
              href="/settings/security/delete"
              className="mt-5 block w-full rounded-2xl border border-red-300 px-5 py-4 text-center font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900"
            >
              Supprimer mon compte
            </Link>



          </div>



        </div>



      </section>


    </main>
  );
}
