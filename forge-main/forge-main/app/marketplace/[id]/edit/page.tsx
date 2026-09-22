import { notFound } from "next/navigation";
import MarketplacePostingForm from "@/components/marketplace/MarketplacePostingForm";
import { canManageMarketplacePosting } from "@/src/lib/marketplace";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

export default async function EditMarketplacePostingPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await requireWorkspaceContext("write"); const { id } = await params;
  const posting = await prisma.marketplaceJobPosting.findUnique({ where: { id }, select: { id: true, organizationId: true, createdByUserId: true, title: true, trade: true, publicDescription: true, location: true, startDate: true, endDate: true, positions: true, budgetCents: true } });
  if (!posting || !canManageMarketplacePosting({ postingOrganizationId: posting.organizationId, postingCreatedByUserId: posting.createdByUserId, activeOrganizationId: context.workspace.id, userId: context.user.id, role: context.membership.role })) notFound();
  return <main className="min-h-dvh px-4 py-6 pb-40 sm:px-6 lg:pb-16"><div className="mx-auto max-w-2xl"><h1 className="text-3xl font-bold">Modifier l’annonce</h1><MarketplacePostingForm initialPosting={{ id: posting.id, title: posting.title, trade: posting.trade, description: posting.publicDescription, location: posting.location, startDate: posting.startDate.toISOString().slice(0,10), endDate: posting.endDate.toISOString().slice(0,10), positions: posting.positions, budgetCents: posting.budgetCents }}/></div></main>;
}
