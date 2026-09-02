import { Mail } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import ContactSupportForm from "@/components/contact/ContactSupportForm";
import { getCurrentUser } from "@/src/lib/auth";

export default async function ContactPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-transparent px-5 py-8 sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_8%,rgba(76,110,245,0.16),transparent_30%),radial-gradient(circle_at_88%_48%,rgba(255,95,158,0.12),transparent_30%)] dark:bg-[radial-gradient(circle_at_16%_8%,rgba(76,110,245,0.2),transparent_30%),radial-gradient(circle_at_88%_48%,rgba(255,125,176,0.1),transparent_30%)]"
      />

      <div className="mx-auto w-full max-w-xl">
        <Link
          href="/app"
          className="forge-back-link text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Retour
        </Link>

        <header className="mt-8 text-center sm:mt-10">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-elevated)] text-[var(--forge-accent-blue-lit)] shadow-[var(--forge-shadow)]">
            <Mail aria-hidden="true" size={25} />
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-[-0.04em] text-[var(--forge-text-primary)]">
            Nous contacter
          </h1>
          <p className="mx-auto mt-3 max-w-md text-pretty leading-7 text-[var(--forge-text-secondary)]">
            Une question ou un problème ? L’équipe Forge est là pour vous aider.
          </p>
        </header>

        <section className="forge-surface mx-auto mt-8 rounded-[2rem] border p-5 backdrop-blur-xl sm:p-8">
          <p className="text-center text-sm text-[var(--forge-text-muted)]">
            Adresse de contact
          </p>
          <a
            href="mailto:contact@myforge.online"
            className="mt-2 block text-center text-lg font-semibold text-[var(--forge-accent-blue-lit)] transition hover:brightness-110"
          >
            contact@myforge.online
          </a>

          <ContactSupportForm />
        </section>
      </div>
    </main>
  );
}
