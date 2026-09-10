export const FINALIZATION_STEPS = [
  "REPORT_INPUT",
  "REPORT_REVIEW",
  "INVOICE_CHOICE",
  "QUOTE_CREATED",
  "INVOICE_CREATED",
  "INVOICE_SENT",
  "FINALIZED",
] as const;

export type FinalizationStep = (typeof FINALIZATION_STEPS)[number];

const STEP_RANK = new Map<string, number>(
  FINALIZATION_STEPS.map((step, index) => [step, index]),
);

export function keepMostAdvancedFinalizationStep(
  currentStep: string | null | undefined,
  requestedStep: string | null | undefined,
  reportWasSkipped = false,
) {
  if (!requestedStep) return currentStep ?? null;

  const minimumCurrentStep = reportWasSkipped &&
      (STEP_RANK.get(currentStep ?? "") ?? -1) < STEP_RANK.get("INVOICE_CHOICE")!
    ? "INVOICE_CHOICE"
    : currentStep;
  const currentRank = STEP_RANK.get(minimumCurrentStep ?? "") ?? -1;
  const requestedRank = STEP_RANK.get(requestedStep);

  if (requestedRank === undefined) return minimumCurrentStep ?? null;
  return currentRank > requestedRank ? minimumCurrentStep ?? null : requestedStep;
}

type ResumeInput = {
  finalizationStep?: string | null;
  finalized?: boolean;
  reportWasSkipped?: boolean;
  hasReport?: boolean;
  invoiceId?: string | null;
  quoteId?: string | null;
  clientId?: string | null;
};

export type FinalizationResumeTarget =
  | { kind: "finalized" }
  | { kind: "invoice"; href: string }
  | { kind: "quote"; href: string }
  | { kind: "reportReview" }
  | { kind: "reportInput" }
  | { kind: "invoiceChoice" };

export function resolveFinalizationResumeTarget({
  finalizationStep,
  finalized = false,
  reportWasSkipped = false,
  hasReport = false,
  invoiceId,
  quoteId,
  clientId,
}: ResumeInput): FinalizationResumeTarget {
  if (finalized || finalizationStep === "FINALIZED") {
    return { kind: "finalized" };
  }

  if (invoiceId) {
    return { kind: "invoice", href: `/invoices/${invoiceId}` };
  }

  if (finalizationStep === "QUOTE_CREATED" && quoteId && clientId) {
    return { kind: "quote", href: `/clients/${clientId}/quotes/${quoteId}` };
  }

  if (
    reportWasSkipped ||
    finalizationStep === "INVOICE_CHOICE" ||
    finalizationStep === "INVOICE_CREATED" ||
    finalizationStep === "INVOICE_SENT"
  ) {
    return { kind: "invoiceChoice" };
  }

  if (finalizationStep === "REPORT_REVIEW" && hasReport) {
    return { kind: "reportReview" };
  }

  return { kind: "reportInput" };
}
