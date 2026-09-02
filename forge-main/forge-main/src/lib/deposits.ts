export const DEPOSIT_MODES = ["PERCENTAGE", "FIXED"] as const;

export type DepositMode = (typeof DEPOSIT_MODES)[number];

export type DepositInvoiceSummarySource = {
  type: "STANDARD" | "DEPOSIT";
  status: string;
  amountCents: number;
};

export type DepositCalculationResult =
  | {
      ok: true;
      amountCents: number;
      remainingBeforeCents: number;
      remainingAfterCents: number;
    }
  | { ok: false; error: string };

function parsePositiveDecimal(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value).trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getQuoteDepositSummary(
  quoteTotalCents: number,
  invoices: DepositInvoiceSummarySource[],
) {
  const depositedCents = invoices.reduce(
    (total, invoice) =>
      invoice.type === "DEPOSIT" && invoice.status !== "ANNULEE"
        ? total + Math.max(0, invoice.amountCents)
        : total,
    0,
  );

  return {
    depositedCents,
    remainingCents: Math.max(0, quoteTotalCents - depositedCents),
  };
}

export function calculateDepositAmount(input: {
  mode: DepositMode;
  value: unknown;
  quoteTotalCents: number;
  alreadyDepositedCents: number;
}): DepositCalculationResult {
  const value = parsePositiveDecimal(input.value);
  const remainingBeforeCents = Math.max(
    0,
    input.quoteTotalCents - input.alreadyDepositedCents,
  );

  if (value === null || value <= 0) {
    return { ok: false, error: "L’acompte doit être supérieur à zéro." };
  }

  if (input.mode === "PERCENTAGE" && value > 100) {
    return { ok: false, error: "Le pourcentage ne peut pas dépasser 100 %." };
  }

  const amountCents =
    input.mode === "PERCENTAGE"
      ? Math.round((input.quoteTotalCents * value) / 100)
      : Math.round(value * 100);

  if (amountCents <= 0) {
    return { ok: false, error: "L’acompte calculé doit être supérieur à zéro." };
  }

  if (amountCents > remainingBeforeCents) {
    return {
      ok: false,
      error: "L’acompte dépasse le montant restant du devis.",
    };
  }

  return {
    ok: true,
    amountCents,
    remainingBeforeCents,
    remainingAfterCents: remainingBeforeCents - amountCents,
  };
}
