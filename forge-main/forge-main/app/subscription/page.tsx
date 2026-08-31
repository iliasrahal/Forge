import Link from "next/link";
import { redirect } from "next/navigation";
import ForgeLogo from "@/components/ForgeLogo";
import LogoutButton from "@/components/LogoutButton";
import CancelSubscriptionControls from "@/components/subscription/CancelSubscriptionControls";
import { getCurrentUser } from "@/src/lib/auth";
import { getForgePlan } from "@/src/lib/pricing";
import { getSubscriptionAccessForUser } from "@/src/lib/subscription-access";

export default async function SubscriptionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const plan = getForgePlan(user.workMode);
  const access = await getSubscriptionAccessForUser(user.id);

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-[#f4f6fb] px-6 py-8 text-slate-950 dark:bg-[#0a0f1c] dark:text-white">

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(56rem_30rem_at_50%_-12%,rgba(76,110,245,0.16),transparent_66%),radial-gradient(40rem_28rem_at_112%_0%,rgba(129,140,248,0.12),transparent_58%)] dark:bg-[radial-gradient(56rem_30rem_at_50%_-12%,rgba(37,99,235,0.26),transparent_66%),radial-gradient(40rem_28rem_at_112%_0%,rgba(79,70,229,0.2),transparent_58%)]"
      />

      <section className="mx-auto max-w-xl">

        {access.hasAccess && (
          <Link
            href="/app"
            className="forge-back-link text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Retour
          </Link>
        )}


        <div className="mt-6 rounded-3xl border border-slate-200/90 bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04),0_30px_60px_-32px_rgba(76,110,245,0.4)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_24px_50px_-28px_rgba(0,0,0,0.7)]">


          {/* Logo centré */}
          <div className="flex justify-center">
            <span className="inline-flex rounded-[1.6rem] border border-slate-200/80 bg-white p-3 shadow-[0_24px_60px_-24px_rgba(37,99,235,0.4)] dark:border-slate-700/80 dark:bg-slate-950">
              <ForgeLogo size={68} />
            </span>
          </div>



          <h1 className="mt-8 text-3xl font-bold text-blue-700 dark:text-blue-400">
            Forge reste à tes côtés.
          </h1>



          <p className="mt-4 text-slate-600 dark:text-slate-400">
            {access.hasActiveSubscription ? (
              <>Ton abonnement Forge est actif.</>
            ) : access.isTrialActive ? (
              <>
                {access.daysRemaining} jour{access.daysRemaining > 1 ? "s" : ""} restant{access.daysRemaining > 1 ? "s" : ""} dans ton essai gratuit.
              </>
            ) : (
              <>
                Votre période d&apos;essai gratuite est terminée.
                <br />
                Ton espace reste consultable en lecture seule. Active ton abonnement pour créer, modifier et utiliser l’assistant Forge.
              </>
            )}
          </p>




          <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950">


            <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">
              Forge Pro
            </h2>

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

          <div className="mt-5 flex justify-center">
            <LogoutButton />
          </div>



        </div>


      </section>


    </main>
  );
}
