import { prisma } from "@/src/lib/prisma";
import {
  cleanQuotePublicToken,
  hashQuotePublicToken,
} from "@/src/lib/quote-public-access";

export async function getPublicQuoteByToken(rawToken: unknown) {
  const token = cleanQuotePublicToken(rawToken);
  if (!token) return null;

  const access = await prisma.quotePublicAccess.findUnique({
    where: { tokenHash: hashQuotePublicToken(token) },
    select: {
      id: true,
      revokedAt: true,
      acceptedAt: true,
      quote: {
        select: {
          id: true,
          reference: true,
          title: true,
          description: true,
          amountCents: true,
          status: true,
          acceptedAt: true,
          createdAt: true,
          signature: {
            select: {
              signerFirstName: true,
              signerLastName: true,
              signedAt: true,
            },
          },
          organization: { select: { name: true } },
          client: {
            select: {
              type: true,
              firstName: true,
              lastName: true,
              companyName: true,
            },
          },
          lines: {
            select: { id: true, category: true, label: true, amountCents: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  return access && !access.revokedAt ? access : null;
}
