import { prisma } from "@/src/lib/prisma";

export const clientService = {
  async getAll(organizationId: string) {
    return prisma.client.findMany({
      where: {
        organizationId,
        archived: false,
      },

      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        type: true,
        firstName: true,
        lastName: true,
        companyName: true,
        email: true,
        phone: true,
      },
    });
  },

  async getById(
    id: string,
    organizationId: string,
  ) {
    return prisma.client.findFirst({
      where: {
        id,
        organizationId,
        archived: false,
      },

      include: {
        interventions: {
          where: { organizationId },
          take: 100,
          orderBy: {
            scheduledAt: "desc",
          },
        },

        quotes: {
          where: { organizationId },
          take: 100,
          include: { reminders: { select: { sentAt: true }, orderBy: { sentAt: "desc" } } },
          orderBy: {
            createdAt: "desc",
          },
        },

        invoices: {
          where: { organizationId },
          take: 100,
          include: {
            payments: { select: { id: true, status: true, amountCents: true, feeCents: true, refundedCents: true, paidAt: true, createdAt: true, method: true, provider: true } },
            creditNotes: { select: { id: true, reference: true, reason: true, status: true, amountCents: true, createdAt: true } },
            reminders: { select: { sentAt: true }, orderBy: { sentAt: "desc" } },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        creditNotes: { where: { organizationId }, orderBy: { createdAt: "desc" }, take: 100 },
      },
    });
  },
};
