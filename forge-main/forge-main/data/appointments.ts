export type AppointmentStatus =
  | "scheduled"
  | "inProgress"
  | "completed"
  | "postponed"
  | "cancelled";

export type InterventionReport = {
  intervention: string;
  diagnostic: string;
  travaux: string;
  recommandation: string;
};

export type Appointment = {
  id: string;
  client: string;
  hasClient?: boolean;
  address: string;
  date: string;
  time: string;
  endDate?: string;
  endTime?: string;
  intervention: string;
  description?: string;
  status: AppointmentStatus;
  notes?: string;
  report?: InterventionReport;
};

function getUsefulText(value?: string) {
  const cleanedValue = value?.trim();

  if (
    !cleanedValue ||
    cleanedValue.toLocaleLowerCase("fr-FR") ===
      "intervention"
  ) {
    return "";
  }

  return cleanedValue;
}

export function getAppointmentSubject(
  appointment: Pick<
    Appointment,
    "intervention" | "description"
  >,
) {
  return (
    getUsefulText(appointment.intervention) ||
    getUsefulText(appointment.description)
  );
}

export function getAppointmentDateLabel(
  appointmentDate: string,
) {
  if (!appointmentDate) {
    return "";
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const formatDateKey = (date: Date) =>
    [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(
        2,
        "0",
      ),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

  if (appointmentDate === formatDateKey(today)) {
    return "Aujourd’hui";
  }

  if (
    appointmentDate === formatDateKey(tomorrow)
  ) {
    return "Demain";
  }

  return new Date(
    `${appointmentDate}T00:00:00`,
  ).toLocaleDateString("fr-FR", {
    weekday: "long",
  });
}

export function getAppointmentDisplayTitle(
  appointment: Pick<
    Appointment,
    | "intervention"
    | "description"
    | "date"
    | "time"
  >,
) {
  const subject =
    getAppointmentSubject(appointment);

  if (subject) {
    return subject;
  }

  const displayDate =
    getAppointmentDateLabel(
      appointment.date,
    );

  if (displayDate && appointment.time) {
    return `${displayDate} à ${appointment.time}`;
  }

  return (
    appointment.time ||
    displayDate ||
    "Intervention"
  );
}

export const appointments: Appointment[] = [
  {
    id: "1",
    client: "Mme Martin",
    address: "12 Rue Victor Hugo, Lyon",
    date: "2026-07-22",
    time: "09:00",
    intervention: "Réparation d'une fuite sous évier",
    status: "scheduled",
  },
  {
    id: "2",
    client: "M. Leroy",
    address: "8 Avenue de la République, Lyon",
    date: "2026-07-22",
    time: "11:00",
    intervention: "Remplacement d'un robinet",
    status: "scheduled",
  },
  {
    id: "3",
    client: "Mme Dupont",
    address: "25 Boulevard des Alpes, Lyon",
    date: "2026-07-22",
    time: "14:00",
    intervention: "Diagnostic d'un chauffe-eau",
    status: "scheduled",
  },
];
