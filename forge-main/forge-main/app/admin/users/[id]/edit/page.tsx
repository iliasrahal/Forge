import { notFound } from "next/navigation";

import { requireStaff } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";

import { PageHeader } from "../../../_components/ui";
import EditUserForm from "./_components/EditUserForm";

export const dynamic = "force-dynamic";

export default async function AdminUserEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff("ADMIN");
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Modifier le compte"
        subtitle={user.email}
        backHref={`/admin/users/${user.id}`}
        backLabel="Retour à la fiche"
      />
      <EditUserForm
        userId={user.id}
        initial={{
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          companyName: user.companyName ?? "",
          email: user.email,
          phone: user.phone,
        }}
      />
    </div>
  );
}
