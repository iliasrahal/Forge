/**
 * Attribue ou retire un rôle staff plateforme à un compte existant.
 *
 *   npx tsx scripts/grant-staff.ts <email> <SUPPORT|ADMIN|SUPER_ADMIN>
 *   npx tsx scripts/grant-staff.ts <email> revoke
 *   npx tsx scripts/grant-staff.ts --list
 *
 * À utiliser pour créer le premier SUPER_ADMIN. Ensuite, la gestion du staff
 * se fait depuis /admin/staff.
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, StaffRole } from "../src/generated/prisma/client";

function cleanUrl(value: string | undefined) {
  if (!value) return "";

  return value
    .trim()
    .replace(/^(?:DIRECT_URL|DATABASE_URL)\s*=\s*/i, "")
    .replace(/^['"]|['"]$/g, "")
    .trim();
}

const databaseUrl =
  cleanUrl(process.env.DIRECT_URL) || cleanUrl(process.env.DATABASE_URL);

if (!databaseUrl) {
  throw new Error("DATABASE_URL (ou DIRECT_URL) est absente de l'environnement.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const VALID_ROLES = Object.values(StaffRole);

async function list() {
  const members = await prisma.staffMember.findMany({
    include: { user: { select: { email: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (members.length === 0) {
    console.log("Aucun membre du staff.");

    return;
  }

  for (const member of members) {
    console.log(
      `${member.role.padEnd(12)} ${member.user.email}  (${member.user.firstName} ${member.user.lastName ?? ""})`.trim(),
    );
  }
}

async function main() {
  const [rawEmail, rawRole] = process.argv.slice(2);

  if (rawEmail === "--list") {
    await list();

    return;
  }

  const email = rawEmail?.trim().toLowerCase();
  const roleArg = rawRole?.trim();

  if (!email || !roleArg) {
    throw new Error(
      "Usage : npx tsx scripts/grant-staff.ts <email> <SUPPORT|ADMIN|SUPER_ADMIN|revoke>",
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error(`Aucun compte avec l'e-mail « ${email} ».`);
  }

  if (roleArg.toLowerCase() === "revoke") {
    await prisma.staffMember.deleteMany({ where: { userId: user.id } });
    console.log(`Rôle staff retiré pour ${email}.`);

    return;
  }

  const role = roleArg.toUpperCase() as StaffRole;

  if (!VALID_ROLES.includes(role)) {
    throw new Error(
      `Rôle invalide : « ${roleArg} ». Valeurs : ${VALID_ROLES.join(", ")}, revoke.`,
    );
  }

  await prisma.staffMember.upsert({
    where: { userId: user.id },
    update: { role },
    create: { userId: user.id, role },
  });

  console.log(`${email} est maintenant ${role}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
