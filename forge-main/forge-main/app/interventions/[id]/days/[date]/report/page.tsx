import { notFound, redirect } from "next/navigation";

import InterventionDayReportFlow from "@/components/InterventionDayReportFlow";
import { listInterventionDateKeys } from "@/src/lib/intervention-day-tasks";
import { parseInterventionDayReport } from "@/src/lib/intervention-day-report";
import { formatParisDateKey, parseParisDateTime } from "@/src/lib/paris-datetime";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

export default async function InterventionDayReportPage({ params }: { params: Promise<{ id: string; date: string }> }) {
  const { id, date } = await params;
  const workspace = await requireWorkspaceContext("write");
  const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(date) ? parseParisDateTime(date, "00:00") : null;
  if (!dateValue) notFound();

  const intervention = await prisma.intervention.findFirst({
    where: { id, organizationId: workspace.workspace.id },
    include: {
      client: true,
      excludedDays: { select: { date: true } },
      dayStates: { where: { date: dateValue }, take: 1 },
    },
  });
  if (!intervention) notFound();
  const days = listInterventionDateKeys(intervention.scheduledAt, intervention.endDate, intervention.excludedDays.map((day) => formatParisDateKey(day.date)));
  if (!days.includes(date)) notFound();

  const dayState = intervention.dayStates[0];
  if (dayState?.finalizationStep === "FINALIZED") redirect(`/interventions/${id}`);
  const clientName = intervention.client
    ? intervention.client.companyName || [intervention.client.firstName, intervention.client.lastName].filter(Boolean).join(" ") || "le client"
    : "le client";

  return <InterventionDayReportFlow interventionId={id} date={date} clientName={clientName} initialDraft={dayState?.reportDraft ?? ""} initialReport={dayState?.finalizationStep === "REPORT_REVIEW" ? parseInterventionDayReport(dayState.report) : null} />;
}
