export type InterventionTerminology = {
  isMultiDay: boolean;
  name: "intervention" | "chantier";
  title: "Intervention" | "Chantier";
  definite: "l’intervention" | "le chantier";
  returnDestination: "à l’intervention" | "au chantier";
  startAction: string;
  continueAction: string;
  trackingTitle: string;
  deleteAction: string;
  deleteQuestion: string;
  deleteHistoryMessage: string;
  deletePlanningMessage: string;
  materialUsageDescription: string;
};

type TerminologyInput = {
  startDateKey: string;
  endDateKey?: string | null;
  plannedDateKeys?: string[];
};

export function getInterventionTerminology({
  startDateKey,
  endDateKey,
  plannedDateKeys = [],
}: TerminologyInput): InterventionTerminology {
  const coveredDates = [startDateKey, endDateKey, ...plannedDateKeys].filter(
    (date): date is string => Boolean(date),
  );
  const isMultiDay = new Set(coveredDates).size > 1;

  if (isMultiDay) {
    return {
      isMultiDay: true,
      name: "chantier",
      title: "Chantier",
      definite: "le chantier",
      returnDestination: "au chantier",
      startAction: "Commencer le chantier",
      continueAction: "Continuer ou terminer le chantier",
      trackingTitle: "Suivi du chantier",
      deleteAction: "Supprimer le chantier",
      deleteQuestion: "Supprimer définitivement ce chantier ?",
      deleteHistoryMessage:
        "Le planning, les tâches, les temps, les dépenses et les comptes rendus liés à ce chantier seront supprimés.",
      deletePlanningMessage: "Le chantier et son planning associé seront supprimés.",
      materialUsageDescription: "Usage réel du chantier.",
    };
  }

  return {
    isMultiDay: false,
    name: "intervention",
    title: "Intervention",
    definite: "l’intervention",
    returnDestination: "à l’intervention",
    startAction: "Commencer l’intervention",
    continueAction: "Continuer ou terminer l’intervention",
    trackingTitle: "Suivi de l’intervention",
    deleteAction: "Supprimer l’intervention",
    deleteQuestion: "Supprimer définitivement cette intervention ?",
    deleteHistoryMessage:
      "Les tâches, les temps, les dépenses et les comptes rendus liés à cette intervention seront supprimés.",
    deletePlanningMessage: "L’intervention et ses informations seront supprimées.",
    materialUsageDescription: "Usage réel de l’intervention.",
  };
}
