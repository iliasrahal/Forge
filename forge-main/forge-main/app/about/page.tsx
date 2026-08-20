import Link from "next/link";
import ForgeLogo from "@/components/ForgeLogo";


export default function AboutPage() {
  return (
    <main className="min-dvh bg-white px-6 py-8 text-slate-950 dark:bg-slate-950 dark:text-white">



      <section className="mx-auto max-w-xl">



        <Link
          href="/app"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Retour
        </Link>





<div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">

  <div className="flex justify-center">
    <ForgeLogo size={80} />
  </div>

  <h1 className="mt-6 text-3xl font-bold text-blue-700 dark:text-blue-400">
    Forge
  </h1>




          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Votre assistant IA pensé pour accompagner les artisans au quotidien.
          </p>







          <div className="mt-8 space-y-4 text-left">






            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">


              <h2 className="font-semibold">
                Version
              </h2>


              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Forge v1.0.0
              </p>


            </div>









            <Link
              href="/terms"
              className="block rounded-2xl bg-slate-50 p-5 transition hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
            >

              <h2 className="font-semibold">
                Conditions générales d'utilisation
              </h2>


              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Consultez les règles d'utilisation de Forge.
              </p>


            </Link>









            <Link
              href="/privacy"
              className="block rounded-2xl bg-slate-50 p-5 transition hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
            >

              <h2 className="font-semibold">
                Politique de confidentialité
              </h2>


              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Découvrez comment vos données sont protégées.
              </p>


            </Link>





          </div>






        </div>





      </section>





    </main>
  );
}