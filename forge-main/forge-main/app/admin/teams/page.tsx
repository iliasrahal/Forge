import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { requireStaff, roleAtLeast } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";
import { evaluateSubscriptionAccess } from "@/src/lib/subscription-policy";

import {
  Badge,
  EmptyRow,
  PageHeader,
  TableCard,
  Td,
  Th,
} from "../_components/ui";
import { formatDate } from "../_lib/display";
import TeamDeleteButton from "./_components/TeamDeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const { staff } = await requireStaff("SUPPORT");
  const canDelete = roleAtLeast(staff.role, "SUPER_ADMIN");
  const now = new Date();

  const teams = await prisma.organization.findMany({
    where: { type: "TEAM" },
    orderBy: { createdAt: "desc" },
    include: {
      members: {
        include: {
          user: {
            select: {
              email: true,
              subscriptionStatus: true,
              trialEndsAt: true,
            },
          },
        },
      },
    },
  });

  const rows = teams.map((team) => {
    const owner = team.members.find((member) => member.role === "OWNER");
    const paidMembers = team.members.filter(
      (member) =>
        evaluateSubscriptionAccess(
          member.user.subscriptionStatus,
          member.user.trialEndsAt,
          now,
        ).hasAccess,
    ).length;

    return {
      id: team.id,
      name: team.name,
      ownerEmail: owner?.user.email ?? null,
      memberCount: team.members.length,
      paidMembers,
      graceExpiresAt: team.graceExpiresAt,
      createdAt: team.createdAt,
    };
  });

  return (
    <div>
      <PageHeader
        title="Équipes"
        subtitle={`${rows.length} espace${rows.length > 1 ? "s" : ""} de type équipe`}
      />

      <TableCard>
        <thead>
          <tr>
            <Th>Équipe</Th>
            <Th>Propriétaire</Th>
            <Th className="text-right">Membres</Th>
            <Th className="text-right">Abonnés</Th>
            <Th>État</Th>
            <Th>Créée</Th>
            {canDelete ? <Th className="text-right">Action</Th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={canDelete ? 7 : 6} label="Aucune équipe." />
          ) : (
            rows.map((team) => (
              <tr
                key={team.id}
                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
              >
                <Td className="font-medium">{team.name}</Td>
                <Td className="text-slate-500">
                  {team.ownerEmail ?? (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      sans propriétaire
                    </span>
                  )}
                </Td>
                <Td className="text-right tabular-nums">{team.memberCount}</Td>
                <Td className="text-right tabular-nums">{team.paidMembers}</Td>
                <Td>
                  {team.graceExpiresAt ? (
                    <Badge tone="red">
                      sursis · {formatDate(team.graceExpiresAt)}
                    </Badge>
                  ) : (
                    <Badge tone="emerald">active</Badge>
                  )}
                </Td>
                <Td className="whitespace-nowrap text-slate-500">
                  {formatDate(team.createdAt)}
                </Td>
                {canDelete ? (
                  <Td className="text-right">
                    <TeamDeleteButton
                      organizationId={team.id}
                      name={team.name}
                    />
                  </Td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </TableCard>

      {!canDelete ? (
        <p className="mt-3 text-xs text-slate-400">
          La suppression d’une équipe est réservée aux SUPER_ADMIN.{" "}
          <Link href="/admin" className="text-blue-600 hover:underline dark:text-blue-400">
            Le nettoyage des équipes en sursis
          </Link>{" "}
          reste accessible aux ADMIN.
        </p>
      ) : null}
    </div>
  );
}
