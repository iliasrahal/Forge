export type InterventionDayReport = {
  intervention: string;
  diagnostic: string;
  travaux: string;
  recommandation: string;
};

export function parseInterventionDayReport(value: string | null | undefined): InterventionDayReport | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<InterventionDayReport>;
    if (typeof parsed.intervention !== "string") return null;
    return {
      intervention: parsed.intervention,
      diagnostic: typeof parsed.diagnostic === "string" ? parsed.diagnostic : "Non précisé",
      travaux: typeof parsed.travaux === "string" ? parsed.travaux : "Non précisé",
      recommandation: typeof parsed.recommandation === "string" ? parsed.recommandation : "Aucune recommandation particulière.",
    };
  } catch {
    return { intervention: value, diagnostic: "Non précisé", travaux: "Non précisé", recommandation: "Aucune recommandation particulière." };
  }
}

export function formatInterventionDayReport(value: string) {
  const report = parseInterventionDayReport(value);
  if (!report) return value;
  return [report.intervention, report.diagnostic, report.travaux, report.recommandation]
    .filter((part) => part && part !== "Non précisé" && part !== "Aucune recommandation particulière.")
    .join(" · ");
}
