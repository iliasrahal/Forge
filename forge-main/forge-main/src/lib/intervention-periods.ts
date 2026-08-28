const DAY_IN_MILLISECONDS = 86_400_000;

export type InterventionPeriodGroup<T> = {
  key: string;
  label: string;
  appointments: T[];
};

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function getMonday(date: Date) {
  const day = date.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;

  return new Date(
    date.getTime() -
      daysSinceMonday * DAY_IN_MILLISECONDS,
  );
}

function getPeriod(
  interventionDateKey: string,
  todayDateKey: string,
) {
  const interventionDate = parseDateKey(
    interventionDateKey,
  );
  const today = parseDateKey(todayDateKey);
  const interventionMonday = getMonday(
    interventionDate,
  );
  const currentMonday = getMonday(today);
  const weekDifference = Math.round(
    (interventionMonday.getTime() -
      currentMonday.getTime()) /
      (7 * DAY_IN_MILLISECONDS),
  );

  if (weekDifference >= 0 && weekDifference <= 3) {
    const labels = [
      "Cette semaine",
      "La semaine prochaine",
      "Dans 2 semaines",
      "Dans 3 semaines",
    ];

    return {
      key: `week-${weekDifference}`,
      label: labels[weekDifference],
      order: interventionDate.getTime(),
    };
  }

  const monthDifference =
    (interventionDate.getUTCFullYear() -
      today.getUTCFullYear()) *
      12 +
    interventionDate.getUTCMonth() -
    today.getUTCMonth();

  if (monthDifference >= 0 && monthDifference <= 11) {
    return {
      key: `month-${monthDifference}`,
      label:
        monthDifference === 0
          ? "Ce mois-ci"
          : `Dans ${monthDifference} mois`,
      order: interventionDate.getTime(),
    };
  }

  const yearDifference =
    interventionDate.getUTCFullYear() -
    today.getUTCFullYear();

  return {
    key: `year-${yearDifference}`,
    label:
      yearDifference === 0
        ? "Cette année"
        : yearDifference === 1
          ? "L’année prochaine"
          : `Dans ${yearDifference} ans`,
    order: interventionDate.getTime(),
  };
}

export function groupFutureInterventions<
  T extends { date: string; time: string },
>(
  appointments: T[],
  todayDateKey: string,
): InterventionPeriodGroup<T>[] {
  const groups = new Map<
    string,
    InterventionPeriodGroup<T> & { order: number }
  >();

  const sortedAppointments = [...appointments].sort(
    (first, second) =>
      `${first.date}T${first.time || "00:00"}`.localeCompare(
        `${second.date}T${second.time || "00:00"}`,
      ),
  );

  for (const appointment of sortedAppointments) {
    if (!appointment.date) {
      continue;
    }

    const period = getPeriod(
      appointment.date,
      todayDateKey,
    );
    const existingGroup = groups.get(period.key);

    if (existingGroup) {
      existingGroup.appointments.push(appointment);
      continue;
    }

    groups.set(period.key, {
      key: period.key,
      label: period.label,
      order: period.order,
      appointments: [appointment],
    });
  }

  return [...groups.values()]
    .sort((first, second) => first.order - second.order)
    .map(({ key, label, appointments: groupedAppointments }) => ({
      key,
      label,
      appointments: groupedAppointments,
    }));
}
