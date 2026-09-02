const PARIS_TIME_ZONE = "Europe/Paris";

const parisPartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: PARIS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function getParisParts(date: Date) {
  const parts = Object.fromEntries(
    parisPartsFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

export function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isTimeValue(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function parseParisDateTime(dateKey: string, time = "00:00") {
  if (!isDateKey(dateKey) || !isTimeValue(time)) return null;

  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const wantedAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let candidate = new Date(wantedAsUtc);

  // Resolve the Europe/Paris offset for the requested wall-clock value.
  // Iterating also handles the DST offset changing around the candidate.
  for (let index = 0; index < 3; index += 1) {
    const visible = getParisParts(candidate);
    const visibleAsUtc = Date.UTC(
      visible.year,
      visible.month - 1,
      visible.day,
      visible.hour,
      visible.minute,
      visible.second,
    );
    candidate = new Date(candidate.getTime() + wantedAsUtc - visibleAsUtc);
  }

  const verified = getParisParts(candidate);
  if (
    verified.year !== year ||
    verified.month !== month ||
    verified.day !== day ||
    verified.hour !== hour ||
    verified.minute !== minute
  ) {
    return null;
  }

  return candidate;
}

export function formatParisDateKey(date: Date) {
  const parts = getParisParts(date);
  return [
    parts.year,
    String(parts.month).padStart(2, "0"),
    String(parts.day).padStart(2, "0"),
  ].join("-");
}

export function formatParisTime(date: Date) {
  const parts = getParisParts(date);
  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

export function getParisDayBounds(dateKey: string) {
  const start = parseParisDateTime(dateKey, "00:00");
  if (!start) return null;

  const [year, month, day] = dateKey.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
  const nextKey = [
    nextDate.getUTCFullYear(),
    String(nextDate.getUTCMonth() + 1).padStart(2, "0"),
    String(nextDate.getUTCDate()).padStart(2, "0"),
  ].join("-");
  const nextStart = parseParisDateTime(nextKey, "00:00");
  if (!nextStart) return null;

  return { start, end: new Date(nextStart.getTime() - 1), nextStart };
}

export function createParisInterventionPeriod(input: {
  scheduledDate: string;
  scheduledTime?: string | null;
  scheduledEndDate?: string | null;
  scheduledEndTime?: string | null;
}) {
  const start = parseParisDateTime(
    input.scheduledDate,
    input.scheduledTime || "00:00",
  );
  if (!start) return { error: "La date ou l’heure de début est invalide." } as const;

  if (!input.scheduledEndDate && input.scheduledEndTime) {
    return { error: "La date de fin est obligatoire lorsqu’une heure de fin est indiquée." } as const;
  }

  if (!input.scheduledEndDate) {
    return { start, end: null } as const;
  }

  const end = input.scheduledEndTime
    ? parseParisDateTime(input.scheduledEndDate, input.scheduledEndTime)
    : getParisDayBounds(input.scheduledEndDate)?.end ?? null;

  if (!end) return { error: "La date ou l’heure de fin est invalide." } as const;
  if (end.getTime() < start.getTime()) {
    return { error: "La fin de l’intervention doit être postérieure à son début." } as const;
  }

  return { start, end } as const;
}
