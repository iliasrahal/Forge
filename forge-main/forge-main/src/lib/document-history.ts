import { getParisDayBounds, isDateKey } from "@/src/lib/paris-datetime";

const parisDateParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "numeric",
});

export function getParisYearMonth(date: Date | string) {
  const parts = parisDateParts.formatToParts(
    typeof date === "string" ? new Date(date) : date,
  );
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);

  return { year, monthIndex: month - 1 };
}

export function getParisYearBounds(year: number) {
  // Paris est toujours à UTC+1 au passage à la nouvelle année.
  return {
    start: new Date(Date.UTC(year - 1, 11, 31, 23)),
    end: new Date(Date.UTC(year, 11, 31, 23)),
  };
}

type HistoryRangeInput = {
  year?: number;
  from?: string | null;
  to?: string | null;
};

export function resolveDocumentHistoryRange(input: HistoryRangeInput) {
  if (input.from || input.to) {
    if (!input.from || !input.to) {
      return { error: "Les dates de début et de fin sont obligatoires." } as const;
    }

    if (!isDateKey(input.from) || !isDateKey(input.to)) {
      return { error: "La période sélectionnée est invalide." } as const;
    }

    const fromBounds = getParisDayBounds(input.from);
    const toBounds = getParisDayBounds(input.to);

    if (!fromBounds || !toBounds) {
      return { error: "La période sélectionnée est invalide." } as const;
    }

    if (fromBounds.start.getTime() >= toBounds.nextStart.getTime()) {
      return {
        error: "La date de fin doit être postérieure ou égale à la date de début.",
      } as const;
    }

    return {
      range: {
        gte: fromBounds.start,
        lt: toBounds.nextStart,
      },
    } as const;
  }

  if (!Number.isInteger(input.year) || (input.year ?? 0) < 1) {
    return { error: "Année invalide." } as const;
  }

  const { start, end } = getParisYearBounds(input.year as number);
  return { range: { gte: start, lt: end } } as const;
}
