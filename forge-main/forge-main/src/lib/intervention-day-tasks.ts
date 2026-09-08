import { formatParisDateKey, parseParisDateTime } from "@/src/lib/paris-datetime";

export type InterventionDayTaskInput = {
  date: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  report: string | null;
};

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function normalizeInterventionDayTasks(
  value: unknown,
  periodStart: Date,
  periodEnd: Date | null,
): Array<InterventionDayTaskInput & { dateValue: Date; position: number }> {
  if (!Array.isArray(value)) return [];
  const startKey = formatParisDateKey(periodStart);
  const endKey = formatParisDateKey(periodEnd ?? periodStart);

  return value
    .map((raw, position) => {
      if (!raw || typeof raw !== "object") return null;
      const task = raw as Record<string, unknown>;
      const date = typeof task.date === "string" ? task.date.trim() : "";
      const title = typeof task.title === "string" ? task.title.trim() : "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < startKey || date > endKey || !title) {
        return null;
      }
      const dateValue = parseParisDateTime(date, "00:00");
      if (!dateValue) return null;
      const cleanTime = (time: unknown) =>
        typeof time === "string" && TIME_PATTERN.test(time.trim())
          ? time.trim()
          : null;
      const startTime = cleanTime(task.startTime ?? task.time);
      const endTime = cleanTime(task.endTime);
      return {
        date,
        dateValue,
        title: title.slice(0, 200),
        description:
          typeof task.description === "string" && task.description.trim()
            ? task.description.trim().slice(0, 1000)
            : null,
        startTime,
        endTime,
        report:
          typeof task.report === "string" && task.report.trim()
            ? task.report.trim().slice(0, 4000)
            : null,
        position,
      };
    })
    .filter((task): task is NonNullable<typeof task> => task !== null)
    .slice(0, 150);
}

export function interventionDayTaskCreateData(
  task: ReturnType<typeof normalizeInterventionDayTasks>[number],
) {
  return {
    date: task.dateValue,
    title: task.title,
    description: task.description,
    startTime: task.startTime,
    endTime: task.endTime,
    report: task.report,
    position: task.position,
  };
}

export function listInterventionDateKeys(
  periodStart: Date,
  periodEnd: Date | null,
) {
  const startKey = formatParisDateKey(periodStart);
  const endKey = formatParisDateKey(periodEnd ?? periodStart);
  const current = new Date(`${startKey}T12:00:00Z`);
  const end = new Date(`${endKey}T12:00:00Z`);
  const keys: string[] = [];

  while (current <= end && keys.length < 732) {
    keys.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return keys;
}
