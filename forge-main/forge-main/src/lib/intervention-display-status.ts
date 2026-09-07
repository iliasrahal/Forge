import { formatParisDateKey } from "@/src/lib/paris-datetime";

export type InterventionDisplayStatus =
  | "PLANIFIEE"
  | "PASSEE"
  | "EN_COURS"
  | "TERMINEE"
  | "ANNULEE"
  | string;

export function isInterventionDatePast(
  scheduledDateKey: string,
  todayDateKey: string,
) {
  return scheduledDateKey < todayDateKey;
}

export function getInterventionDisplayStatus(
  status: string,
  scheduledAt: Date,
  now = new Date(),
): InterventionDisplayStatus {
  if (
    status === "PLANIFIEE" &&
    isInterventionDatePast(
      formatParisDateKey(scheduledAt),
      formatParisDateKey(now),
    )
  ) {
    return "PASSEE";
  }

  return status;
}

export function formatInterventionDisplayStatus(
  status: InterventionDisplayStatus,
) {
  const labels: Record<string, string> = {
    PLANIFIEE: "Planifiée",
    PASSEE: "Passée",
    EN_COURS: "En cours",
    TERMINEE: "Terminée",
    ANNULEE: "Annulée",
  };

  return labels[status] ?? status;
}
