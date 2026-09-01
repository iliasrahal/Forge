import { requireStaff } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";

import { Card, PageHeader } from "../_components/ui";
import { userDisplayName } from "../_lib/display";
import StaffManager from "./_components/StaffManager";

export const dynamic = "force-dynamic";

const ROLE_HELP = [
  { role: "SUPPORT", text: "lecture seule : liste et fiches utilisateurs" },
  {
    role: "ADMIN",
    text: "+ reset mot de passe, abonnement, édition, export",
  },
  {
    role: "SUPER_ADMIN",
    text: "+ suppression de compte et gestion du staff",
  },
];

export default async function AdminStaffPage() {
  const { user } = await requireStaff("SUPER_ADMIN");

  const members = await prisma.staffMember.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          companyName: true,
        },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Staff plateforme"
        subtitle="Qui a accès au back-office, et avec quel niveau."
      />

      <Card className="mb-4 p-5">
        <ul className="space-y-1.5 text-sm">
          {ROLE_HELP.map((item) => (
            <li key={item.role} className="flex gap-2">
              <span className="min-w-[110px] font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                {item.role}
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <StaffManager
        members={members.map((member) => ({
          userId: member.userId,
          role: member.role,
          email: member.user.email,
          name: userDisplayName(member.user),
          isSelf: member.userId === user.id,
        }))}
      />
    </div>
  );
}
