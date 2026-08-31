import { requireStaff } from "@/src/lib/admin-auth";

import Sidebar, { MobileTopbar } from "./_components/Sidebar";
import { userDisplayName } from "./_lib/display";

const ROLE_RANK = { SUPPORT: 1, ADMIN: 2, SUPER_ADMIN: 3 } as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, staff } = await requireStaff("SUPPORT");
  const rank = ROLE_RANK[staff.role];
  const name = userDisplayName(user);

  return (
    <div className="forge-admin">
      <Sidebar role={staff.role} email={user.email} name={name} rank={rank} />
      <MobileTopbar rank={rank} />

      <div className="lg:pl-[248px]">
        <main className="mx-auto max-w-[1120px] px-5 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
