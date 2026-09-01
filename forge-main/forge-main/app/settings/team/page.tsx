import Link from "next/link";

import TeamSettingsClient from "@/components/team/TeamSettingsClient";
import MemberActions from "@/components/team/MemberActions";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

export default async function TeamSettingsPage() {
  await requireCurrentUser();
  const context = await requireWorkspaceContext("read");
  const members = context.workspace.type === "TEAM"
    ? await prisma.organizationMember.findMany({
        where: { organizationId: context.workspace.id },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return (
    <main className="min-h-dvh px-4 py-8 text-slate-950 dark:text-white sm:px-6">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:shadow-black/20 sm:p-8">
        <Link href="/app" className="forge-back-link font-semibold text-blue-600 dark:text-blue-400">Retour</Link>
        <p className="mt-8 text-center text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">Mon équipe</p>
        <h1 className="mt-3 text-center text-3xl font-bold">{context.workspace.type === "TEAM" ? context.workspace.name : "Créez votre équipe"}</h1>
        {members.length > 0 && (
          <div className="mt-8 space-y-3">
            {members.map((member) => (
              <div key={member.id} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="font-semibold">{`${member.user.firstName} ${member.user.lastName ?? ""}`.trim()}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{member.user.email} · {member.role}</p>
                {context.permissions.canManageTeam && <MemberActions memberId={member.id} role={member.role} />}
              </div>
            ))}
          </div>
        )}
        <TeamSettingsClient
          isTeam={context.workspace.type === "TEAM"}
          canManage={context.permissions.canManageTeam}
          isOwner={
            context.workspace.type === "TEAM" &&
            context.membership.role === "OWNER"
          }
          teamName={context.workspace.name}
        />
      </section>
    </main>
  );
}
