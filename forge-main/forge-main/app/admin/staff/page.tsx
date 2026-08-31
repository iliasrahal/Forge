import { requireStaff } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";

import { userDisplayName } from "../_lib/display";
import StaffManager from "./_components/StaffManager";

export const dynamic = "force-dynamic";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Staff plateforme</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          SUPPORT : lecture seule · ADMIN : + reset mot de passe, abonnement,
          édition · SUPER_ADMIN : + suppression de compte et gestion du staff.
        </p>
      </div>

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
