import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/src/generated/prisma/client";


const databaseUrl = process.env.DATABASE_URL;


if (!databaseUrl) {
  throw new Error(
    "La variable DATABASE_URL est absente du fichier .env."
  );
}


const adapter = new PrismaPg({
  connectionString: databaseUrl,
});


const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};


export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });


// Garde une seule instance Prisma,
// y compris en production (Vercel)
globalForPrisma.prisma = prisma;