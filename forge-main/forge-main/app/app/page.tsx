import HomeClient from "@/components/HomeClient";
import type {
  Appointment,
  AppointmentStatus,
} from "@/data/appointments";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { splitAppointmentsByDate } from "@/src/lib/intervention-calendar";

const PARIS_TIME_ZONE = "Europe/Paris";

function formatParisDateKey(date: Date) {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: PARIS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HomePageProps = {
  searchParams: Promise<{
    newIntervention?: string;
  }>;
};

function mapStatus(status: string): AppointmentStatus {
  switch (status) {
    case "EN_COURS":
      return "inProgress";
    case "TERMINEE":
      return "completed";
    case "ANNULEE":
      return "cancelled";
    default:
      return "scheduled";
  }
}

function mapIntervention(intervention: any): Appointment {
  const notesMarker = "Notes de prolongation :";
  const description = intervention.description ?? "";
  const notesIndex = description.indexOf(notesMarker);
  const notes =
    notesIndex >= 0
      ? description.slice(notesIndex + notesMarker.length).trim()
      : undefined;

  const clientName = !intervention.client
    ? ""
    : intervention.client.type === "PROFESSIONNEL"
      ? intervention.client.companyName ?? "Client professionnel"
      : `${intervention.client.firstName ?? ""} ${
          intervention.client.lastName ?? ""
        }`.trim();

  const address = [
    intervention.client?.street,
    intervention.client?.postalCode,
    intervention.client?.city,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    id: intervention.id,
    client: clientName,
    hasClient: Boolean(intervention.clientId),
    address,
    date: formatParisDateKey(intervention.scheduledAt),
    time:
      intervention.scheduledAt.toLocaleTimeString("fr-FR", {
        timeZone: PARIS_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
      }) === "00:00"
        ? ""
        : intervention.scheduledAt.toLocaleTimeString("fr-FR", {
            timeZone: PARIS_TIME_ZONE,
            hour: "2-digit",
            minute: "2-digit",
          }),
    intervention: intervention.title ?? "",
    description: intervention.description ?? undefined,
    status: mapStatus(intervention.status),
    notes,
    report:
      intervention.reportIntervention ||
      intervention.reportDiagnostic ||
      intervention.reportTravaux ||
      intervention.reportRecommendation
        ? {
            intervention: intervention.reportIntervention ?? "",
            diagnostic: intervention.reportDiagnostic ?? "",
            travaux: intervention.reportTravaux ?? "",
            recommandation: intervention.reportRecommendation ?? "",
          }
        : undefined,
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const currentUser = await requireCurrentUser();
  const { newIntervention } = await searchParams;
  const todayKey = formatParisDateKey(new Date());

  const [interventions, clients] = await Promise.all([
    prisma.intervention.findMany({
      where: {
        OR: [
          { userId: currentUser.id },
          { client: { userId: currentUser.id } },
        ],
        status: {
          in: ["PLANIFIEE", "EN_COURS"],
        },
      },
      include: {
        client: true,
      },
      orderBy: {
        scheduledAt: "asc",
      },
    }),
    prisma.client.findMany({
      where: {
        userId: currentUser.id,
        archived: false,
      },
      orderBy: [
        { companyName: "asc" },
        { lastName: "asc" },
        { firstName: "asc" },
      ],
    }),
  ]);

  const appointments = interventions.map(mapIntervention);
  const {
    today: todayAppointments,
    upcoming: upcomingAppointments,
  } = splitAppointmentsByDate(appointments, todayKey);

  return (
    <HomeClient
      todayAppointments={todayAppointments}
      upcomingAppointments={upcomingAppointments}
      todayDateKey={todayKey}
      planningClients={clients.map((client) => ({
        id: client.id,
        name:
          client.type === "PROFESSIONNEL"
            ? client.companyName ?? "Client professionnel"
            : `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() ||
              "Client",
      }))}
      newInterventionId={newIntervention ?? null}
    />
  );
}
