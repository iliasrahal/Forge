export const INVOICE_TYPE_LABELS: Record<string, string> = {
  STANDARD: "Facture",
  DEPOSIT: "Acompte",
  SITUATION: "Situation",
  BALANCE: "Solde",
};

export const INVOICE_TYPE_DOCUMENT_LABELS: Record<string, string> = {
  STANDARD: "FACTURE",
  DEPOSIT: "FACTURE D'ACOMPTE",
  SITUATION: "FACTURE DE SITUATION",
  BALANCE: "FACTURE DE SOLDE",
};

export function formatInvoiceType(type: string) {
  return INVOICE_TYPE_LABELS[type] ?? type;
}

export function formatInvoiceDocumentType(type: string) {
  return INVOICE_TYPE_DOCUMENT_LABELS[type] ?? "FACTURE";
}
