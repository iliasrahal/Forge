import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/generated/prisma/client.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const all = await prisma.invoicePublicAccess.findMany({
  where: { invoiceId: "cmtn3y15k0004tkutbny243r5" },
  orderBy: { createdAt: "asc" },
});
console.log(all.map(a => ({ id: a.id, revokedAt: a.revokedAt, viewedAt: a.viewedAt, createdAt: a.createdAt })));
process.exit(0);
