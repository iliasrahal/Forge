export type InterventionProgressInput = {
  explicitProgressBp?: number | null;
  tasks?: Array<{ status?: string | null; completedAt?: Date | string | null }>;
  days?: Array<{ completedAt?: Date | string | null }>;
};

export type InterventionProgress = {
  percent: number;
  source: "explicit" | "tasks" | "days";
} | null;

export function computeInterventionProgress(input: InterventionProgressInput): InterventionProgress {
  if (typeof input.explicitProgressBp === "number" && Number.isFinite(input.explicitProgressBp)) {
    return {
      percent: Math.round(Math.max(0, Math.min(10_000, input.explicitProgressBp)) / 100),
      source: "explicit",
    };
  }

  if (input.tasks?.length) {
    const completed = input.tasks.filter((task) => task.status === "DONE" || Boolean(task.completedAt)).length;
    return { percent: Math.round((completed / input.tasks.length) * 100), source: "tasks" };
  }

  if (input.days?.length) {
    const completed = input.days.filter((day) => Boolean(day.completedAt)).length;
    return { percent: Math.round((completed / input.days.length) * 100), source: "days" };
  }

  return null;
}
