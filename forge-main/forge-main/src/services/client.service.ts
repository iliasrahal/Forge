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
          orderBy: {
            scheduledAt: "desc",
          },
        },

        quotes: {
          where: { organizationId },
          orderBy: {
            createdAt: "desc",
          },
        },

        invoices: {
          where: { organizationId },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  },
};
