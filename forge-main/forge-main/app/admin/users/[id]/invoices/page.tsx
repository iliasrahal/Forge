import { requireStaff } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";

import { formatAmount, formatDate } from "../../../_lib/display";
import SubViewShell from "../_components/SubViewShell";

export const dynamic = "force-dynamic";

export default async function AdminUserInvoicesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff("SUPPORT");
  const { id } = await params;

  const where = { client: { userId: id } };
  const [count, invoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        client: {
          select: { firstName: true, lastName: true, companyName: true },
        },
      },
    }),
  ]);

  return (
    <SubViewShell userId={id} title="Factures" count={count}>
      <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
        <tr>
          <th className="px-4 py-3">Référence</th>
          <th className="px-4 py-3">Titre</th>
          <th className="px-4 py-3">Client</th>
          <th className="px-4 py-3">Statut</th>
          <th className="px-4 py-3 text-right">Montant</th>
          <th className="px-4 py-3">Créée</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map((invoice) => (
          <tr
            key={invoice.id}
            className="border-b border-slate-100 last:border-0 dark:border-slate-800"
          >
            <td className="px-4 py-3 font-mono text-xs">{invoice.reference}</td>
            <td className="px-4 py-3 font-medium">{invoice.title}</td>
            <td className="px-4 py-3 text-slate-500">
              {[
                invoice.client.firstName,
                invoice.client.lastName,
                invoice.client.companyName,
              ]
                .filter(Boolean)
                .join(" ")}
            </td>
            <td className="px-4 py-3 text-slate-500">{invoice.status}</td>
            <td className="px-4 py-3 text-right tabular-nums">
              {formatAmount(invoice.amountCents)}
            </td>
            <td className="px-4 py-3 text-slate-500">
              {formatDate(invoice.createdAt)}
            </td>
          </tr>
        ))}
        {invoices.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
              Aucune facture.
            </td>
          </tr>
        ) : null}
      </tbody>
    </SubViewShell>
  );
}
