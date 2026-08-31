import { requireStaff } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";

import { formatDate } from "../../../_lib/display";
import SubViewShell from "../_components/SubViewShell";

export const dynamic = "force-dynamic";

export default async function AdminUserClientsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff("SUPPORT");
  const { id } = await params;

  const [count, clients] = await Promise.all([
    prisma.client.count({ where: { userId: id } }),
    prisma.client.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <SubViewShell userId={id} title="Clients" count={count}>
      <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
        <tr>
          <th className="px-4 py-3">Nom / Société</th>
          <th className="px-4 py-3">Type</th>
          <th className="px-4 py-3">Contact</th>
          <th className="px-4 py-3">Ville</th>
          <th className="px-4 py-3">Créé</th>
        </tr>
      </thead>
      <tbody>
        {clients.map((client) => (
          <tr
            key={client.id}
            className="border-b border-slate-100 last:border-0 dark:border-slate-800"
          >
            <td className="px-4 py-3 font-medium">
              {client.type === "PROFESSIONNEL"
                ? client.companyName
                : [client.firstName, client.lastName]
                    .filter(Boolean)
                    .join(" ")}
              {client.archived ? (
                <span className="ml-2 text-xs text-slate-400">archivé</span>
              ) : null}
              {client.isTemporary ? (
                <span className="ml-2 text-xs text-slate-400">temporaire</span>
              ) : null}
            </td>
            <td className="px-4 py-3 text-slate-500">{client.type}</td>
            <td className="px-4 py-3 text-slate-500">
              <div>{client.phone || "—"}</div>
              <div className="text-xs">{client.email || ""}</div>
            </td>
            <td className="px-4 py-3 text-slate-500">
              {[client.postalCode, client.city].filter(Boolean).join(" ") || "—"}
            </td>
            <td className="px-4 py-3 text-slate-500">
              {formatDate(client.createdAt)}
            </td>
          </tr>
        ))}
        {clients.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
              Aucun client.
            </td>
          </tr>
        ) : null}
      </tbody>
    </SubViewShell>
  );
}
