import Link from "next/link";
import { redirect } from "next/navigation";
import ForgeLogo from "@/components/ForgeLogo";
import CancelSubscriptionControls from "@/components/subscription/CancelSubscriptionControls";
import { getCurrentUser } from "@/src/lib/auth";
import { getForgePlan } from "@/src/lib/pricing";

export default async function SubscriptionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const plan = getForgePlan(user.workMode);

  return (
    <main className="min-h-dvh bg-white px-6 py-8 text-slate-950 dark:bg-slate-950 dark:text-white">

      <section className="mx-auto max-w-xl">

        <Link
          href="/app"
          className="forge-back-link text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Retour
        </Link>


        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">


          {/* Logo centré */}
          <div className="flex justify-center">
            <ForgeLogo size={80} />
          </div>



          <h1 className="mt-8 text-3xl font-bold text-blue-700 dark:text-blue-400">
            Forge reste à tes côtés.
          </h1>



          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Ton mois d&apos;essai est terminé.
            <br />
            Continue à gagner du temps dans ton activité.
          </p>




          <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950">


            <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">
              Forge Pro
            </h2>

            <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">
              {plan.label}
            </p>



            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {plan.monthlyLabel}
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





          <CancelSubscriptionControls />



        </div>


      </section>


    </main>
  );
}
