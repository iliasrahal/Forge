type QuoteDeletionCandidate = {
  status: "BROUILLON" | "ENVOYE" | "ACCEPTE" | "REFUSE";
  invoiceCount: number;
  publicAccessCount: number;
  reminderCount: number;
  hasSignature: boolean;
};

export function getQuoteDeletionBlockReason(
  quote: QuoteDeletionCandidate,
) {
  if (quote.invoiceCount > 0) {
    return "Ce devis ne peut pas être supprimé car une facture lui est déjà associée.";
  }

  if (quote.hasSignature || quote.status === "ACCEPTE") {
    return "Ce devis ne peut pas être supprimé car il a déjà été accepté ou signé.";
  }

  if (
    quote.status !== "BROUILLON" ||
    quote.publicAccessCount > 0 ||
    quote.reminderCount > 0
  ) {
    return "Seul un devis en brouillon qui n’a jamais été envoyé peut être supprimé.";
  }

  return null;
}
