import {
  computeInvoicePaymentState,
  resolveInvoiceStatusAfterPayment,
  type InvoicePaymentState,
} from "@/src/lib/payments";

// Adaptateur minimal : un client Prisma (ou une transaction) exposant les
// modèles Invoice et Payment. Volontairement lâche pour accepter le vrai
// client comme une transaction.
type PrismaLikeInvoicePaymentClient = {
  invoice: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findUnique: (args: any) => Promise<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (args: any) => Promise<any>;
  };
  payment: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findMany: (args: any) => Promise<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findFirst: (args: any) => Promise<any>;
  };
};

export type InvoicePaymentSyncResult = {
  state: InvoicePaymentState;
  status: string;
  paidAt: Date | null;
};

/**
 * Recalcule le statut d'encaissement d'une facture à partir de ses paiements
 * et le persiste. Le statut PAYEE n'est jamais posé à la main : il découle
 * ici de la somme des paiements réussis. À appeler après toute création,
 * suppression ou mise à jour d'un `Payment` (route manuelle comme webhook).
 */
export async function syncInvoicePaymentStatus(
  client: PrismaLikeInvoicePaymentClient,
  invoiceId: string,
): Promise<InvoicePaymentSyncResult | null> {
  const invoice = await client.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, amountCents: true, status: true, dueDate: true },
  });

  if (!invoice) return null;

  const payments: Array<{
    status: string;
    amountCents: number;
    feeCents: number;
    refundedCents: number;
    paidAt: Date | null;
  }> = await client.payment.findMany({
    where: { invoiceId },
    select: {
      status: true,
      amountCents: true,
      feeCents: true,
      refundedCents: true,
      paidAt: true,
    },
  });

  const state = computeInvoicePaymentState(invoice.amountCents, payments);
  const next = resolveInvoiceStatusAfterPayment({
    currentStatus: invoice.status,
    dueDate: invoice.dueDate,
    state,
  });

  // Moyen d'encaissement affiché : celui du dernier paiement réussi.
  const lastSucceeded =
    state.collectedCents > 0
      ? await client.payment.findFirst({
          where: { invoiceId, status: "SUCCEEDED" },
          orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
          select: { method: true },
        })
      : null;

  await client.invoice.update({
    where: { id: invoiceId },
    data: {
      status: next.status,
      paidAt: next.paidAt,
      paymentMethod:
        state.collectedCents > 0 ? lastSucceeded?.method ?? null : null,
    },
  });

  return { state, status: next.status, paidAt: next.paidAt };
}
