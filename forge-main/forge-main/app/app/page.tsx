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
import { buildSmartReminders } from "@/src/lib/smart-reminders";
import type { Prisma } from "@/src/generated/prisma/client";

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

type HomeIntervention = Prisma.InterventionGetPayload<{
  include: { client: true; invoices: { select: { id: true; status: true } } };
}>;

function mapIntervention(intervention: HomeIntervention): Appointment {
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
    finalizationStep: intervention.finalizationStep,
    reportDraft: intervention.reportDraft ?? "",
    invoiceId: intervention.invoices[0]?.id ?? null,
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
        OR: [
          { status: { in: ["PLANIFIEE", "EN_COURS"] } },
          { status: "TERMINEE", finalizedAt: null, finalizationStep: { not: null } },
        ],
      },
      include: { client: true, invoices: { select: { id: true, status: true }, take: 1 } },
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

  const [reminderQuotes, reminderInvoices, completedInterventions] = currentUser.smartRemindersEnabled
    ? await Promise.all([
    prisma.quote.findMany({
      where: {
        organizationId: workspaceContext.workspace.id,
        status: { in: ["BROUILLON", "ENVOYE"] },
      },
      select: {
        id: true,
        clientId: true,
        client: {
          select: {
            type: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
        status: true,
        createdAt: true,
        sentAt: true,
        reminders: {
          select: { sentAt: true },
          orderBy: { sentAt: "desc" },
        },
      },
    }),
    prisma.invoice.findMany({
      where: {
        organizationId: workspaceContext.workspace.id,
        status: { in: ["BROUILLON", "ENVOYEE", "EN_RETARD"] },
      },
      select: {
        id: true,
        reference: true,
        amountCents: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        dueDate: true,
        client: {
          select: {
            type: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
        payments: {
          select: {
            status: true,
            amountCents: true,
            feeCents: true,
            refundedCents: true,
            paidAt: true,
          },
        },
      },
    }),
    prisma.intervention.findMany({
      where: {
        organizationId: workspaceContext.workspace.id,
        status: "TERMINEE",
        invoices: { none: {} },
      },
      select: {
        id: true,
        title: true,
        status: true,
        finishedAt: true,
        updatedAt: true,
        client: {
          select: {
            type: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
        _count: { select: { invoices: true } },
      },
    }),
  ])
    : [[], [], []];

  const smartReminders = currentUser.smartRemindersEnabled
    ? buildSmartReminders({
        quotes: reminderQuotes,
        invoices: reminderInvoices,
        interventions: completedInterventions.map((intervention) => ({
          ...intervention,
          invoiceCount: intervention._count.invoices,
        })),
      })
    : [];

  const appointments = interventions.map(mapIntervention);
  const {
    today: todayAppointments,
    upcoming: upcomingAppointments,
    other,
  } = splitAppointmentsByDate(appointments, todayKey);
  todayAppointments.push(...other.filter((item) => item.status === "completed" && item.finalizationStep));

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
      reminders={smartReminders}
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
