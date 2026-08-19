import { prisma } from "@/src/lib/prisma";

export const clientService = {
  async getAll(userId: string) {
    return prisma.client.findMany({
      where: {
        userId,
        archived: false,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async getById(
    id: string,
    userId: string,
  ) {
    return prisma.client.findFirst({
      where: {
        id,
        userId,
        archived: false,
      },

      include: {
        interventions: {
          orderBy: {
            scheduledAt: "desc",
          },
        },

        quotes: {
          orderBy: {
            createdAt: "desc",
          },
        },

        invoices: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  },
};