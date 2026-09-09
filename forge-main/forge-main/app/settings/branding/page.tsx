import Link from "next/link";

import LogoUploader from "@/components/LogoUploader";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

export default async function BrandingSettingsPage() {
  await requireCurrentUser();
  const context = await requireWorkspaceContext("write");

  const organization = await prisma.organization.findUnique({
    where: { id: context.workspace.id },
    select: { logoDataUrl: true },
  });

  return (
    <main className="min-h-dvh px-6 py-8 text-slate-950 dark:text-white">
      <section className="mx-auto max-w-xl">
        <Link
          href="/settings"
          className="forge-back-link text-sm font-semibold text-blue-700 transition hover:text-blue-800 dark:text-blue-400"
        >
          Retour
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-blue-700 dark:text-blue-400">
          Logo et identité
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Ton logo apparaît en tête des documents que tu envoies.
        </p>

        <LogoUploader
          initialLogoDataUrl={organization?.logoDataUrl ?? null}
        />
      </section>
    </main>
  );
}
