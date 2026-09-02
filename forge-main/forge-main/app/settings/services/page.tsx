import Link from "next/link";

import ServiceCatalogClient from "@/components/services/ServiceCatalogClient";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

export default async function ServicesSettingsPage() {
  const context = await requireWorkspaceContext("read");
  const services = await prisma.serviceCatalogItem.findMany({
    where: { organizationId: context.workspace.id },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
  });

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-transparent px-4 py-8 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_8%,rgba(76,110,245,0.16),transparent_28%),radial-gradient(circle_at_90%_48%,rgba(255,95,158,0.1),transparent_30%)]"
      />
      <section className="mx-auto w-full max-w-3xl">
        <Link
          href="/settings"
          className="forge-back-link text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Retour
        </Link>

        <header className="mt-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--forge-accent-blue-lit)]">
            {context.workspace.name}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--forge-text-primary)] sm:text-4xl">
            Prestations et tarifs
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--forge-text-secondary)]">
            Enregistre tes prestations habituelles pour créer tes devis plus rapidement.
          </p>
        </header>

        <ServiceCatalogClient
          initialServices={services.map((service) => ({
            id: service.id,
            name: service.name,
            description: service.description,
            priceCents: service.priceCents,
            pricingType: service.pricingType,
          }))}
          canWrite={context.permissions.canWrite}
        />
      </section>
    </main>
  );
}
