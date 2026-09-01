import { requireStaff } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";

import { Badge, EmptyRow, Td, Th } from "../../../_components/ui";
import { formatAmount, formatDate } from "../../../_lib/display";
import SubViewShell from "../_components/SubViewShell";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  BROUILLON: "slate",
  ENVOYE: "blue",
  ACCEPTE: "emerald",
  REFUSE: "red",
} as const;

export default async function AdminUserQuotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff("SUPPORT");
  const { id } = await params;

  const where = { client: { userId: id } };
  const [count, quotes] = await Promise.all([
    prisma.quote.count({ where }),
    prisma.quote.findMany({
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
    <SubViewShell userId={id} title="Devis" count={count}>
      <thead>
        <tr>
          <Th>Référence</Th>
          <Th>Titre</Th>
          <Th>Client</Th>
          <Th>Statut</Th>
          <Th className="text-right">Montant</Th>
          <Th>Créé</Th>
        </tr>
      </thead>
      <tbody>
        {quotes.length === 0 ? (
          <EmptyRow colSpan={6} label="Aucun devis." />
        ) : (
          quotes.map((quote) => (
            <tr
              key={quote.id}
              className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
            >
              <Td className="font-mono text-xs">{quote.reference}</Td>
              <Td className="font-medium">{quote.title}</Td>
              <Td className="text-slate-500">
                {[
                  quote.client.firstName,
                  quote.client.lastName,
                  quote.client.companyName,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </Td>
              <Td>
                <Badge
                  tone={
                    STATUS_TONE[quote.status as keyof typeof STATUS_TONE] ??
                    "slate"
                  }
                >
                  {quote.status}
                </Badge>
              </Td>
              <Td className="text-right font-medium tabular-nums">
                {formatAmount(quote.amountCents)}
              </Td>
              <Td className="whitespace-nowrap text-slate-500">
                {formatDate(quote.createdAt)}
              </Td>
            </tr>
          ))
        )}
      </tbody>
    </SubViewShell>
  );
}
