import Link from "next/link";
import ForgeLogo from "@/components/ForgeLogo";

export default function LandingPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-6 text-slate-950">
      <section className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
  <ForgeLogo size={80} />
</div>

        <h1 className="mt-8 text-4xl font-bold leading-tight text-blue-700">
          Salut,
          <br />
          je suis Forge,
          <br />
          ton copilote.
        </h1>

        <Link
          href="/register"
          className="mt-10 block w-full rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-blue-700"
        >
          Créer mon espace
        </Link>

        <div className="mt-7">
          <p className="text-sm text-slate-500">
            Déjà un compte ?
          </p>

          <Link
            href="/login"
            className="mt-2 inline-block font-semibold text-blue-700 transition hover:text-blue-800"
          >
            Se connecter
          </Link>
        </div>
      </section>
    </main>
  );
}