import { requireStaff } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";

import { formatDateTime } from "../../../_lib/display";
import SubViewShell from "../_components/SubViewShell";

export const dynamic = "force-dynamic";

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
      <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
        <tr>
          <th className="px-4 py-3">Titre</th>
          <th className="px-4 py-3">Client</th>
          <th className="px-4 py-3">Statut</th>
          <th className="px-4 py-3">Prévue</th>
        </tr>
      </thead>
      <tbody>
        {interventions.map((intervention) => (
          <tr
            key={intervention.id}
            className="border-b border-slate-100 last:border-0 dark:border-slate-800"
          >
            <td className="px-4 py-3 font-medium">{intervention.title}</td>
            <td className="px-4 py-3 text-slate-500">
              {intervention.client
                ? [
                    intervention.client.firstName,
                    intervention.client.lastName,
                    intervention.client.companyName,
                  ]
                    .filter(Boolean)
                    .join(" ")
                : "—"}
            </td>
            <td className="px-4 py-3 text-slate-500">{intervention.status}</td>
            <td className="px-4 py-3 text-slate-500">
              {formatDateTime(intervention.scheduledAt)}
            </td>
          </tr>
        ))}
        {interventions.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
              Aucune intervention.
            </td>
          </tr>
        ) : null}
      </tbody>
    </SubViewShell>
  );
}
