import Link from "next/link";
import SupplierManager from "@/components/purchases/SupplierManager";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
export default async function SuppliersPage() { const context = await requireWorkspaceContext("read"); const suppliers = await prisma.supplier.findMany({ where: { organizationId: context.workspace.id }, orderBy: [{ active: "desc" }, { name: "asc" }] }); return <main className="min-h-dvh px-4 py-8 pb-36 sm:px-6"><section className="mx-auto max-w-4xl"><Link href="/settings" className="forge-back-link text-sm font-semibold text-blue-600">Retour</Link><h1 className="mt-7 text-3xl font-bold text-[var(--forge-text-primary)]">Fournisseurs</h1><p className="mt-2 text-[var(--forge-text-secondary)]">Les fournisseurs de {context.workspace.name}.</p><SupplierManager initialSuppliers={suppliers} canWrite={context.permissions.canWrite}/></section></main>; }
