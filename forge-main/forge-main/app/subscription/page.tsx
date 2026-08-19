"use client";


import Link from "next/link";
import { useState } from "react";
import ForgeLogo from "@/components/ForgeLogo";




export default function SubscriptionPage() {




  const [cancelRequested, setCancelRequested] =
    useState(false);





  return (
    <main className="min-dvh bg-white px-6 py-8 text-slate-950 dark:bg-slate-950 dark:text-white">




      <section className="mx-auto max-w-xl">




        <Link
          href="/app"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Retour
        </Link>







        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">





          <ForgeLogo size={80} />







          <h1 className="mt-8 text-3xl font-bold text-blue-700 dark:text-blue-400">
            Forge reste à tes côtés.
          </h1>







          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Ton essai de 14 jours est terminé.
            <br />
            Continue à gagner du temps dans ton activité.
          </p>








          <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950">





            <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">
              Forge Pro
            </h2>







            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              29€/mois
            </p>







            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Ton copilote au quotidien.
            </p>







            <button
              type="button"
              className="mt-6 h-14 w-full rounded-2xl bg-blue-600 font-semibold text-white transition hover:bg-blue-700"
            >
              Démarrer mon abonnement
            </button>






          </div>










          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">





            <p className="text-center text-sm text-red-600 dark:text-red-300">
              Tu peux arrêter ton abonnement Forge à tout moment.
            </p>







            {!cancelRequested ? (




              <button
                type="button"
                onClick={() =>
                  setCancelRequested(true)
                }
                className="mt-5 w-full rounded-2xl border border-red-300 px-5 py-4 font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900"
              >
                Résilier mon abonnement
              </button>





            ) : (





              <div className="mt-5 space-y-3">




                <p className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  Confirme-tu vouloir résilier ton abonnement Forge ?
                </p>





                <button
                  type="button"
                  className="w-full rounded-2xl bg-red-600 px-5 py-4 font-semibold text-white transition hover:bg-red-700"
                >
                  Confirmer la résiliation
                </button>





                <button
                  type="button"
                  onClick={() =>
                    setCancelRequested(false)
                  }
                  className="w-full rounded-2xl border border-slate-300 px-5 py-4 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Annuler
                </button>




              </div>




            )}





          </div>








        </div>




      </section>




    </main>
  );
}