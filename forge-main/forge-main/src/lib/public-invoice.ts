import { prisma } from "@/src/lib/prisma";
import {
  cleanInvoicePublicToken,
  hashInvoicePublicToken,
} from "@/src/lib/invoice-public-access";

/**
 * Résout un lien public de facture. Renvoie `null` si le jeton est invalide,
 * révoqué ou introuvable.
 */
export async function getPublicInvoiceByToken(rawToken: unknown) {
  const token = cleanInvoicePublicToken(rawToken);
  if (!token) return null;

  const access = await prisma.invoicePublicAccess.findUnique({
    where: { tokenHash: hashInvoicePublicToken(token) },
    select: {
      id: true,
      revokedAt: true,
      viewedAt: true,
      invoice: {
        select: {
          id: true,
          reference: true,
          title: true,
          description: true,
          amountCents: true,
          status: true,
          dueDate: true,
          createdAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              stripeAccountId: true,
              stripeChargesEnabled: true,
            },
          },
          client: {
            select: {
              type: true,
              firstName: true,
              lastName: true,
              companyName: true,
              email: true,
            },
          },
          lines: {
            select: { id: true, category: true, label: true, amountCents: true },
            orderBy: { createdAt: "asc" },
          },
          payments: {
            select: {
              status: true,
              amountCents: true,
              feeCents: true,
              refundedCents: true,
              paidAt: true,
            },
          },
        },
      },
    },
  });

  return access && !access.revokedAt ? access : null;
}
