import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/src/generated/prisma/client";


const databaseUrl = process.env.DATABASE_URL;


if (!databaseUrl) {
  throw new Error(
    "La variable DATABASE_URL est absente de l'environnement.",
  );
}


// Sur Vercel, chaque fonction serverless instancie ce module. Derrière le
// pooler Supabase (limité en nombre de clients), on garde un pool minuscule
// et on le réutilise entre invocations « à chaud » via globalThis — sinon
// quelques lambdas suffisent à saturer le pooler (erreur EMAXCONNSESSION).
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaAdapter?: PrismaPg;
};


const adapter =
  globalForPrisma.prismaAdapter ??
  new PrismaPg({
    connectionString: databaseUrl,
    max: 3,
    idleTimeoutMillis: 10_000,
  });


export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });


globalForPrisma.prisma = prisma;
globalForPrisma.prismaAdapter = adapter;
