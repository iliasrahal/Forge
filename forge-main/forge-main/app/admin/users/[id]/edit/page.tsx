import Link from "next/link";
import { notFound } from "next/navigation";

import { requireStaff } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";

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
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href={`/admin/users/${user.id}`}
        className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
      >
        ← Retour à la fiche
      </Link>
      <h1 className="text-2xl font-bold">Modifier le compte</h1>
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
