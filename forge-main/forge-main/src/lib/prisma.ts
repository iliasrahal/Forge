import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/src/generated/prisma/client";


const databaseUrl = process.env.DATABASE_URL;


if (!databaseUrl) {

  throw new Error(
    "La variable DATABASE_URL est absente du fichier .env.",
  );

}

const databaseConnectionUrl = new URL(databaseUrl);

if (!databaseConnectionUrl.searchParams.has("connection_limit")) {
  databaseConnectionUrl.searchParams.set("connection_limit", "5");
}


const adapter =
  new PrismaPg({

    connectionString:
      databaseConnectionUrl.toString(),

  });



const globalForPrisma =
  globalThis as unknown as {
    prisma?: PrismaClient;
  };



export const prisma =

  globalForPrisma.prisma ??

  new PrismaClient({

    adapter,

    log:
      process.env.NODE_ENV === "development"

        ? ["error", "warn"]

        : ["error"],

  });



if (process.env.NODE_ENV !== "production") {

  globalForPrisma.prisma = prisma;

}
