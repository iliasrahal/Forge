export type QuoteStatusValue = "BROUILLON" | "ENVOYE" | "ACCEPTE" | "REFUSE";

export function canTransitionQuoteStatus(
  currentStatus: QuoteStatusValue,
  nextStatus: QuoteStatusValue,
) {
  if (currentStatus === "ACCEPTE") return nextStatus === "ACCEPTE";
  if (currentStatus === "REFUSE") return nextStatus === "REFUSE";
  return true;
}

export function isQuoteContractLocked(
  status: QuoteStatusValue,
  hasSignature: boolean,
) {
  return status === "ACCEPTE" || hasSignature;
}
