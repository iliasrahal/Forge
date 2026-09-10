type QuoteDeletionCandidate = {
  status: "BROUILLON" | "ENVOYE" | "ACCEPTE" | "REFUSE";
  invoiceCount: number;
  interventionCount: number;
};

export function getQuoteDeletionPlan(
  quote: QuoteDeletionCandidate,
) {
  return {
    statusDoesNotBlockDeletion: Boolean(quote.status),
    detachInvoices: quote.invoiceCount > 0,
    detachInterventions: quote.interventionCount > 0,
  };
}
