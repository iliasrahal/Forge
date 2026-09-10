export type InterventionDayHistoryKind = "IN_PROGRESS" | "HISTORY" | null;

export function getInterventionDayHistoryKind(input: {
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  report?: string | null;
  hasWorkTimes: boolean;
  hasExpenses: boolean;
  tasks: Array<{ completedAt?: Date | string | null; report?: string | null }>;
}): InterventionDayHistoryKind {
  if (input.startedAt && !input.completedAt) return "IN_PROGRESS";

  if (
    input.startedAt ||
    input.completedAt ||
    input.report ||
    input.hasWorkTimes ||
    input.hasExpenses ||
    input.tasks.some((task) => task.completedAt || task.report)
  ) {
    return "HISTORY";
  }

  return null;
}
