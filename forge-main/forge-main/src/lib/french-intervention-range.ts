import { formatParisDateKey } from "@/src/lib/paris-datetime";

export type ParsedInterventionRange = {
  scheduledDate: string;
  scheduledTime: string | null;
  scheduledEndDate: string;
  scheduledEndTime: string | null;
};

const months: Record<string, number> = {
  janvier: 1,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
};

const weekdays: Record<string, number> = {
  dimanche: 0,
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTime(hour?: string, minutes?: string) {
  if (!hour) return null;
  const numericHour = Number(hour);
  const numericMinutes = Number(minutes || 0);
  if (numericHour > 23 || numericMinutes > 59) return null;
  return `${String(numericHour).padStart(2, "0")}:${String(numericMinutes).padStart(2, "0")}`;
}

function validDateKey(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function resolveYear(month: number, day: number, todayKey: string) {
  const [currentYear] = todayKey.split("-").map(Number);
  const inCurrentYear = validDateKey(currentYear, month, day);
  return inCurrentYear && inCurrentYear >= todayKey ? currentYear : currentYear + 1;
}

export function parseFrenchInterventionRange(
  message: string,
  now = new Date(),
): ParsedInterventionRange | null {
  const text = normalize(message);
  const todayKey = formatParisDateKey(now);
  const time = "(?:\\s+(?:a|à)\\s*(\\d{1,2})\\s*h(?:\\s*(\\d{2}))?)?";

  const slash = new RegExp(
    `\\bdu\\s+(\\d{1,2})\\/(\\d{1,2})(?:\\/(\\d{2,4}))?${time}\\s+au\\s+(\\d{1,2})\\/(\\d{1,2})(?:\\/(\\d{2,4}))?${time}`,
  ).exec(text);

  if (slash) {
    const startMonth = Number(slash[2]);
    const startDay = Number(slash[1]);
    let startYear = slash[3] ? Number(slash[3]) : resolveYear(startMonth, startDay, todayKey);
    if (startYear < 100) startYear += 2000;
    const endMonth = Number(slash[7]);
    const endDay = Number(slash[6]);
    let endYear = slash[8] ? Number(slash[8]) : startYear;
    if (endYear < 100) endYear += 2000;
    const startDate = validDateKey(startYear, startMonth, startDay);
    let endDate = validDateKey(endYear, endMonth, endDay);
    if (startDate && endDate && endDate < startDate && !slash[8]) {
      endDate = validDateKey(endYear + 1, endMonth, endDay);
    }
    if (!startDate || !endDate) return null;
    return {
      scheduledDate: startDate,
      scheduledTime: cleanTime(slash[4], slash[5]),
      scheduledEndDate: endDate,
      scheduledEndTime: cleanTime(slash[9], slash[10]),
    };
  }

  const named = new RegExp(
    `\\bdu\\s+(?:(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\\s+)?(\\d{1,2})(?:\\s+(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre))?${time}\\s+au\\s+(?:(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\\s+)?(\\d{1,2})(?:\\s+(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre))?(?:\\s+(\\d{4}))?${time}`,
  ).exec(text);

  if (named) {
    const currentMonth = Number(todayKey.slice(5, 7));
    const startMonth = months[named[2] || named[6]] || currentMonth;
    const endMonth = months[named[6] || named[2]] || currentMonth;
    const explicitYear = named[7] ? Number(named[7]) : null;
    const startYear = explicitYear ?? resolveYear(startMonth, Number(named[1]), todayKey);
    let endYear = explicitYear ?? startYear;
    const startDate = validDateKey(startYear, startMonth, Number(named[1]));
    let endDate = validDateKey(endYear, endMonth, Number(named[5]));
    if (startDate && endDate && endDate < startDate && !explicitYear) {
      endYear += 1;
      endDate = validDateKey(endYear, endMonth, Number(named[5]));
    }
    if (!startDate || !endDate) return null;
    return {
      scheduledDate: startDate,
      scheduledTime: cleanTime(named[3], named[4]),
      scheduledEndDate: endDate,
      scheduledEndTime: cleanTime(named[8], named[9]),
    };
  }

  const weekday = /\bdu\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+au\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/.exec(text);
  if (!weekday) return null;

  const today = new Date(`${todayKey}T00:00:00Z`);
  const startWeekday = weekdays[weekday[1]];
  const endWeekday = weekdays[weekday[2]];
  let startOffset = (startWeekday - today.getUTCDay() + 7) % 7;
  if (startOffset === 0) startOffset = 7;
  let endOffset = (endWeekday - startWeekday + 7) % 7;
  if (endOffset === 0) endOffset = 7;
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() + startOffset);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + endOffset);
  return {
    scheduledDate: start.toISOString().slice(0, 10),
    scheduledTime: null,
    scheduledEndDate: end.toISOString().slice(0, 10),
    scheduledEndTime: null,
  };
}
