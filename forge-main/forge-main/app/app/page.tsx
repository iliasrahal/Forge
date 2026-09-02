import HomeClient from "@/components/HomeClient";
import TeamGraceBanner from "@/components/TeamGraceBanner";
import type {
  Appointment,
  AppointmentStatus,
} from "@/data/appointments";
import { requireCurrentUser } from "@/src/lib/auth";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import { prisma } from "@/src/lib/prisma";
import { splitAppointmentsByDate } from "@/src/lib/intervention-calendar";
import { formatParisDateKey, formatParisTime } from "@/src/lib/paris-datetime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HomePageProps = {
  searchParams: Promise<{
    newIntervention?: string;
    invitationAccess?: string;
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
    time: formatParisTime(intervention.scheduledAt) === "00:00"
      ? ""
      : formatParisTime(intervention.scheduledAt),
    endDate: intervention.endDate
      ? formatParisDateKey(intervention.endDate)
      : undefined,
    endTime: intervention.endDate && formatParisTime(intervention.endDate) !== "23:59"
      ? formatParisTime(intervention.endDate)
      : undefined,
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
  const workspaceContext = await requireWorkspaceContext("read");
  const { newIntervention, invitationAccess } = await searchParams;
  const todayKey = formatParisDateKey(new Date());

  const [interventions, clients] = await Promise.all([
    prisma.intervention.findMany({
      where: {
        organizationId: workspaceContext.workspace.id,
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
        organizationId: workspaceContext.workspace.id,
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
    <>
      {invitationAccess === "read-only" ? (
        <div className="mx-auto mb-4 max-w-2xl rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
          Vous avez rejoint l’équipe en lecture seule. Un abonnement Forge actif
          est requis pour obtenir le rôle Admin.
        </div>
      ) : null}
      {workspaceContext.workspace.type === "TEAM" ? (
        <TeamGraceBanner
          workspaceName={workspaceContext.workspace.name}
          graceExpiresAt={workspaceContext.workspace.graceExpiresAt}
        />
      ) : null}
      <HomeClient
      userFirstName={currentUser.firstName ?? ""}
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
      canWrite={workspaceContext.permissions.canWrite}
      newInterventionId={newIntervention ?? null}
      />
    </>
  );
}
