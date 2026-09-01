import { requireStaff } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";

import { Badge, EmptyRow, Td, Th } from "../../../_components/ui";
import { formatDateTime } from "../../../_lib/display";
import SubViewShell from "../_components/SubViewShell";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  PLANIFIEE: "blue",
  EN_COURS: "amber",
  TERMINEE: "emerald",
  ANNULEE: "red",
} as const;

export default async function AdminUserInterventionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff("SUPPORT");
  const { id } = await params;

  const [count, interventions] = await Promise.all([
    prisma.intervention.count({ where: { userId: id } }),
    prisma.intervention.findMany({
      where: { userId: id },
      orderBy: { scheduledAt: "desc" },
      take: 100,
      include: {
        client: {
          select: { firstName: true, lastName: true, companyName: true },
        },
      },
    }),
  ]);

  return (
    <SubViewShell userId={id} title="Interventions" count={count}>
      <thead>
        <tr>
          <Th>Titre</Th>
          <Th>Client</Th>
          <Th>Statut</Th>
          <Th>Prévue</Th>
        </tr>
      </thead>
      <tbody>
        {interventions.length === 0 ? (
          <EmptyRow colSpan={4} label="Aucune intervention." />
        ) : (
          interventions.map((intervention) => (
            <tr
              key={intervention.id}
              className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
            >
              <Td className="font-medium">{intervention.title}</Td>
              <Td className="text-slate-500">
                {intervention.client
                  ? [
                      intervention.client.firstName,
                      intervention.client.lastName,
                      intervention.client.companyName,
                    ]
                      .filter(Boolean)
                      .join(" ")
                  : "—"}
              </Td>
              <Td>
                <Badge
                  tone={
                    STATUS_TONE[
                      intervention.status as keyof typeof STATUS_TONE
                    ] ?? "slate"
                  }
                >
                  {intervention.status}
                </Badge>
              </Td>
              <Td className="whitespace-nowrap text-slate-500">
                {formatDateTime(intervention.scheduledAt)}
              </Td>
            </tr>
          ))
        )}
      </tbody>
    </SubViewShell>
  );
}
