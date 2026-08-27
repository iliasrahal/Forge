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
  intervention: string;
  description?: string;
  status: AppointmentStatus;
  notes?: string;
  report?: InterventionReport;
};

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
    appointment.intervention.trim() ||
    appointment.description?.trim();

  if (subject) {
    return subject;
  }

  const displayDate = appointment.date
    ? new Intl.DateTimeFormat("fr-FR").format(
        new Date(
          `${appointment.date}T00:00:00`,
        ),
      )
    : "";

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
