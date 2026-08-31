import { notFound } from "next/navigation";

import { getCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import type { StaffRole } from "@/src/generated/prisma/client";

// Hiérarchie des rôles staff. Un rôle donne accès à tout ce qu'autorisent les
// rôles inférieurs.
const STAFF_ROLE_RANK: Record<StaffRole, number> = {
  SUPPORT: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export type StaffContext = {
  user: SessionUser;
  staff: {
    id: string;
    role: StaffRole;
  };
};

export class StaffAccessError extends Error {
  constructor(message = "Accès réservé à l'administration.") {
    super(message);
    this.name = "StaffAccessError";
  }
}

export function roleAtLeast(role: StaffRole, minRole: StaffRole) {
  return STAFF_ROLE_RANK[role] >= STAFF_ROLE_RANK[minRole];
}

/**
 * Contexte staff de l'utilisateur connecté, ou null s'il n'est pas membre du
 * staff plateforme. Ne lève rien : pour de l'affichage conditionnel.
 */
export async function getStaffContext(): Promise<StaffContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const staff = await prisma.staffMember.findUnique({
    where: { userId: user.id },
    select: { id: true, role: true },
  });
  if (!staff) return null;

  return { user, staff };
}

/**
 * Garde pour les pages / layouts du back-office.
 * Renvoie un 404 (et non un redirect) si l'utilisateur n'est pas staff ou n'a
 * pas le niveau requis : l'espace /admin reste invisible pour les autres.
 */
export async function requireStaff(
  minRole: StaffRole = "SUPPORT",
): Promise<StaffContext> {
  const context = await getStaffContext();

  if (!context || !roleAtLeast(context.staff.role, minRole)) {
    notFound();
  }

  return context;
}

/**
 * Garde pour les Server Actions du back-office.
 * Lève StaffAccessError (à convertir en message d'erreur par l'appelant) plutôt
 * que de déclencher le rendu d'une page 404.
 */
export async function assertStaff(
  minRole: StaffRole = "SUPPORT",
): Promise<StaffContext> {
  const context = await getStaffContext();

  if (!context || !roleAtLeast(context.staff.role, minRole)) {
    throw new StaffAccessError();
  }

  return context;
}
