import { requireStaff } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";

import { Badge, EmptyRow, Td, Th } from "../../../_components/ui";
import { formatAmount, formatDate } from "../../../_lib/display";
import SubViewShell from "../_components/SubViewShell";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  BROUILLON: "slate",
  ENVOYEE: "blue",
  PAYEE: "emerald",
  EN_RETARD: "red",
  ANNULEE: "slate",
} as const;

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
      <thead>
        <tr>
          <Th>Référence</Th>
          <Th>Titre</Th>
          <Th>Client</Th>
          <Th>Statut</Th>
          <Th className="text-right">Montant</Th>
          <Th>Créée</Th>
        </tr>
      </thead>
      <tbody>
        {invoices.length === 0 ? (
          <EmptyRow colSpan={6} label="Aucune facture." />
        ) : (
          invoices.map((invoice) => (
            <tr
              key={invoice.id}
              className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
            >
              <Td className="font-mono text-xs">{invoice.reference}</Td>
              <Td className="font-medium">{invoice.title}</Td>
              <Td className="text-slate-500">
                {[
                  invoice.client.firstName,
                  invoice.client.lastName,
                  invoice.client.companyName,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </Td>
              <Td>
                <Badge
                  tone={
                    STATUS_TONE[invoice.status as keyof typeof STATUS_TONE] ??
                    "slate"
                  }
                >
                  {invoice.status}
                </Badge>
              </Td>
              <Td className="text-right font-medium tabular-nums">
                {formatAmount(invoice.amountCents)}
              </Td>
              <Td className="whitespace-nowrap text-slate-500">
                {formatDate(invoice.createdAt)}
              </Td>
            </tr>
          ))
        )}
      </tbody>
    </SubViewShell>
  );
}
