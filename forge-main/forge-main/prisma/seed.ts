import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  ClientType,
  PrismaClient,
} from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "La variable DATABASE_URL est absente du fichier .env."
  );
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const demoUser = await prisma.user.upsert({
    where: {
      email: "demo@forge.local",
    },
    update: {},
    create: {
      firstName: "Forge",
      email: "demo@forge.local",
      phone: "0600000000",
      passwordHash: "seed-user-password-hash",
    },
  });

  await prisma.client.upsert({
    where: {
      id: "client-jean-martin",
    },
    update: {},
    create: {
      id: "client-jean-martin",
      type: ClientType.PARTICULIER,
      firstName: "Jean",
      lastName: "Martin",
      phone: "06 12 34 56 78",
      email: "jean.martin@example.com",
      street: "12 rue des Lilas",
      postalCode: "75015",
      city: "Paris",
      notes: "Client régulier. Prévenir avant le passage.",
      userId: demoUser.id,
    },
  });

  await prisma.client.upsert({
    where: {
      id: "client-dupont-plomberie",
    },
    update: {},
    create: {
      id: "client-dupont-plomberie",
      type: ClientType.PROFESSIONNEL,
      companyName: "Dupont Plomberie",
      phone: "01 45 67 89 10",
      email: "contact@dupont-plomberie.fr",
      street: "8 avenue Victor-Hugo",
      postalCode: "92100",
      city: "Boulogne-Billancourt",
      notes: "Entreprise partenaire.",
      userId: demoUser.id,
    },
  });

  console.log("Les clients de démonstration ont été ajoutés.");
}

main()
  .catch((error) => {
    console.error("Erreur pendant l'ajout des clients :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });