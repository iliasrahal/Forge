import HomeClient from "@/components/HomeClient";
import type {
  Appointment,
  AppointmentStatus,
} from "@/data/appointments";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

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

  const clientName =
    intervention.client.type === "PROFESSIONNEL"
      ? intervention.client.companyName ?? "Client professionnel"
      : `${intervention.client.firstName ?? ""} ${
          intervention.client.lastName ?? ""
        }`.trim();

  const address = [
    intervention.client.street,
    intervention.client.postalCode,
    intervention.client.city,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    id: intervention.id,
    client: clientName || "Client sans nom",
    address,
    date: intervention.scheduledAt.toISOString().slice(0, 10),
    time: intervention.scheduledAt.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    intervention: intervention.title,
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
  const todayKey = new Date().toISOString().slice(0, 10);

  const interventions = await prisma.intervention.findMany({
    where: {
      client: {
        userId: currentUser.id,
      },
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
  });

  const todayAppointments: Appointment[] = interventions
    .filter(
      (intervention) =>
        intervention.scheduledAt.toISOString().slice(0, 10) === todayKey,
    )
    .map(mapIntervention);

  const upcomingAppointments: Appointment[] = interventions
    .filter(
      (intervention) =>
        intervention.status === "PLANIFIEE" &&
        intervention.scheduledAt.toISOString().slice(0, 10) > todayKey,
    )
    .map(mapIntervention);

  return (
    <HomeClient
      todayAppointments={todayAppointments}
      upcomingAppointments={upcomingAppointments}
      newInterventionId={newIntervention ?? null}
    />
  );
}
