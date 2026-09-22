import Link from "next/link";
import MarketplacePostingForm from "@/components/marketplace/MarketplacePostingForm";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

export default async function NewMarketplacePostingPage() {
  const context = await requireWorkspaceContext("read");
  const roleAllowsWrite = context.membership.role === "OWNER" || context.membership.role === "ADMIN" || context.membership.role === "LEGACY_TECHNICIAN";
  return <main className="min-h-dvh px-4 py-6 pb-40 sm:px-6 lg:pb-16"><div className="mx-auto max-w-2xl"><Link href="/marketplace" className="forge-back-link font-semibold text-blue-600">Retour</Link><h1 className="mt-6 text-3xl font-bold">Publier un chantier</h1><p className="mt-2 text-[var(--forge-text-secondary)]">Partage uniquement les informations utiles aux autres artisans Forge.</p>{context.permissions.canWrite ? <MarketplacePostingForm/> : <div className="forge-surface mt-6 rounded-3xl border p-6 text-center"><p className="text-[var(--forge-text-secondary)]">Cet espace est disponible en consultation seule.</p>{roleAllowsWrite && !context.subscription.hasAccess ? <Link href="/subscription" className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white">Réactiver mon abonnement</Link> : null}</div>}</div></main>;
}
