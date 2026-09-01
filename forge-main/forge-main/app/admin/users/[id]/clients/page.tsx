import { requireStaff } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";

import { Badge, EmptyRow, Td, Th } from "../../../_components/ui";
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
      <thead>
        <tr>
          <Th>Nom / Société</Th>
          <Th>Type</Th>
          <Th>Contact</Th>
          <Th>Ville</Th>
          <Th>Créé</Th>
        </tr>
      </thead>
      <tbody>
        {clients.length === 0 ? (
          <EmptyRow colSpan={5} label="Aucun client." />
        ) : (
          clients.map((client) => (
            <tr
              key={client.id}
              className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
            >
              <Td className="font-medium">
                {client.type === "PROFESSIONNEL"
                  ? client.companyName
                  : [client.firstName, client.lastName]
                      .filter(Boolean)
                      .join(" ")}
                <span className="ml-2 inline-flex gap-1">
                  {client.archived ? (
                    <Badge tone="slate">archivé</Badge>
                  ) : null}
                  {client.isTemporary ? (
                    <Badge tone="amber">temporaire</Badge>
                  ) : null}
                </span>
              </Td>
              <Td className="text-slate-500">{client.type}</Td>
              <Td className="text-slate-500">
                <div>{client.phone || "—"}</div>
                <div className="text-xs">{client.email || ""}</div>
              </Td>
              <Td className="text-slate-500">
                {[client.postalCode, client.city].filter(Boolean).join(" ") ||
                  "—"}
              </Td>
              <Td className="whitespace-nowrap text-slate-500">
                {formatDate(client.createdAt)}
              </Td>
            </tr>
          ))
        )}
      </tbody>
    </SubViewShell>
  );
}
