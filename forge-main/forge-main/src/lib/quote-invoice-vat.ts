/**
 * Ventilation d'un montant TTC (acompte, situation, solde) au taux effectif
 * d'un devis, pour créer une facture sans lignes cohérente avec le régime de
 * TVA du devis.
 */
export function ventilateQuoteAmount(params: {
  amountTtcCents: number;
  vatApplicable: boolean;
  quoteTotalHtCents: number;
  quoteTotalVatCents: number;
}): { totalHtCents: number; totalVatCents: number } {
  const ttc = Math.max(0, Math.round(params.amountTtcCents));
  if (!params.vatApplicable || params.quoteTotalHtCents <= 0) {
    return { totalHtCents: ttc, totalVatCents: 0 };
  }
  const effectiveRateBp = Math.round(
    (params.quoteTotalVatCents * 10000) / params.quoteTotalHtCents,
  );
  const ht = Math.round((ttc * 10000) / (10000 + effectiveRateBp));
  return { totalHtCents: ht, totalVatCents: ttc - ht };
}
