export type InterventionReportFields = {
  reportIntervention: string | null;
  reportDiagnostic: string | null;
  reportTravaux: string | null;
  reportRecommendation: string | null;
};

export function getInterventionReportState(
  fields: InterventionReportFields,
) {
  const completedFieldCount = Object.values(fields).filter(Boolean).length;

  if (completedFieldCount === 0) {
    return "none" as const;
  }

  if (completedFieldCount === 4) {
    return "complete" as const;
  }

  return "incomplete" as const;
}
