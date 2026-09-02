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
