export type CalendarAppointment = {
  date: string;
  time: string;
  endDate?: string;
};

export function splitAppointmentsByDate<
  T extends { date: string; time: string; endDate?: string; status: string },
>(appointments: T[], todayDateKey: string) {
  const today: T[] = [];
  const upcoming: T[] = [];
  const other: T[] = [];

  for (const appointment of appointments) {
    const effectiveEndDate = appointment.endDate || appointment.date;
    if (
      appointment.date <= todayDateKey &&
      effectiveEndDate >= todayDateKey
    ) {
      today.push(appointment);
    } else if (
      appointment.date > todayDateKey &&
      appointment.status === "scheduled"
    ) {
      upcoming.push(appointment);
    } else {
      other.push(appointment);
    }
  }

  const byScheduledDate = (first: T, second: T) =>
    `${first.date}T${first.time || "00:00"}`.localeCompare(
      `${second.date}T${second.time || "00:00"}`,
    );

  return {
    today: today.sort(byScheduledDate),
    upcoming: upcoming.sort(byScheduledDate),
    other,
  };
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDateKey(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const daysBeforeMonth = (firstDay.getUTCDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setUTCDate(firstDay.getUTCDate() - daysBeforeMonth);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + index);

    return {
      dateKey: formatDateKey(date),
      day: date.getUTCDate(),
      isCurrentMonth: date.getUTCMonth() === month,
    };
  });
}

export function groupAppointmentsByDate<
  T extends CalendarAppointment,
>(appointments: T[]) {
  const grouped = new Map<string, T[]>();

  for (const appointment of [...appointments].sort((first, second) =>
    `${first.date}T${first.time || "00:00"}`.localeCompare(
      `${second.date}T${second.time || "00:00"}`,
    ),
  )) {
    if (!appointment.date) continue;

    const start = parseDateKey(appointment.date);
    const end = parseDateKey(appointment.endDate || appointment.date);

    for (
      const date = new Date(start);
      date.getTime() <= end.getTime();
      date.setUTCDate(date.getUTCDate() + 1)
    ) {
      const dateKey = formatDateKey(date);
      const appointmentsForDate = grouped.get(dateKey) ?? [];
      appointmentsForDate.push(appointment);
      grouped.set(dateKey, appointmentsForDate);
    }
  }

  return grouped;
}
