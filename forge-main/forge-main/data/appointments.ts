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
  address: string;
  date: string;
  time: string;
  intervention: string;
  status: AppointmentStatus;
  notes?: string;
  report?: InterventionReport;
};

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