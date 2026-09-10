import { NextResponse } from "next/server";

import { splitPersonalClientName } from "@/src/lib/client-name";
import { getInterventionReportState } from "@/src/lib/intervention-completion";
import { prisma } from "@/src/lib/prisma";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";
import {
  createParisInterventionPeriod,
  formatParisDateKey,
  getParisDayBounds,
} from "@/src/lib/paris-datetime";
import {
  interventionDayTaskCreateData,
  normalizeInterventionDayTasks,
} from "@/src/lib/intervention-day-tasks";

type InterventionOperation =
  | "reschedule"
  | "edit"
  | "extend"
  | "updateNotes"
  | "cancel"
  | "attachClient"
  | "saveFinalization"
  | "finalize"
  | "start"
  | "complete"
  | "addDayTasks";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(mme|monsieur|madame|mr|m)\b\.?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanOptionalString(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function getClientDisplayName(client: {
  type: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
}) {
  if (client.type === "PROFESSIONNEL") {
    return client.companyName ?? "";
  }

  return `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim();
}

export async function POST(request: Request) {
  try {
    const workspaceContext = await requireWorkspaceContext("write");
    const currentUser = workspaceContext.user;

    const body = await request.json();

    const clientName =
      typeof body.clientName === "string"
        ? body.clientName.trim()
        : "";

    const requestedClientId =
      typeof body.clientId === "string"
        ? body.clientId.trim()
        : "";

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const scheduledDate =
      typeof body.scheduledDate === "string"
        ? body.scheduledDate.trim()
        : "";

    const scheduledTime =
      typeof body.scheduledTime === "string"
        ? body.scheduledTime.trim()
        : "";
    const scheduledEndDate =
      typeof body.scheduledEndDate === "string"
        ? body.scheduledEndDate.trim()
        : "";
    const scheduledEndTime =
      typeof body.scheduledEndTime === "string"
        ? body.scheduledEndTime.trim()
        : "";

    const phone = cleanOptionalString(body.phone);
    const street = cleanOptionalString(body.street);
    const postalCode = cleanOptionalString(body.postalCode);
    const city = cleanOptionalString(body.city);

    if (!scheduledDate) {
      return NextResponse.json(
        {
          error:
            "La date de l’intervention est obligatoire.",
        },
        { status: 400 },
      );
    }

    const period = createParisInterventionPeriod({
      scheduledDate,
      scheduledTime,
      scheduledEndDate: scheduledEndDate || null,
      scheduledEndTime: scheduledEndTime || null,
    });

    if ("error" in period) {
      return NextResponse.json(
        { error: period.error },
        { status: 400 },
      );
    }

    const dayTasks = normalizeInterventionDayTasks(
      body.dayTasks,
      period.start,
      period.end,
    );

    let client = requestedClientId
      ? await prisma.client.findFirst({
          where: {
            id: requestedClientId,
            organizationId: workspaceContext.workspace.id,
            archived: false,
          },
        })
      : undefined;

    if (requestedClientId && !client) {
      return NextResponse.json(
        { error: "Le client sélectionné est introuvable." },
        { status: 404 },
      );
    }

    const clients = !requestedClientId && clientName
      ? await prisma.client.findMany({
          where: {
            organizationId: workspaceContext.workspace.id,
          },
        })
      : [];
    const normalizedClientName = normalize(clientName);

    const matchingClients = clients.filter((client) => {
      const normalizedDisplayName = normalize(
        getClientDisplayName(client),
      );

      return (
        normalizedDisplayName === normalizedClientName ||
        normalizedDisplayName.includes(normalizedClientName)
      );
    });

    if (matchingClients.length > 1) {
      return NextResponse.json(
        {
          error: `Plusieurs clients correspondent à « ${clientName} ». Précise davantage le nom.`,
        },
        { status: 409 },
      );
    }

    client = client ?? matchingClients[0];
    let clientCreated = false;
    let clientUpdated = false;

    if (!requestedClientId && clientName && !client) {
      const { firstName, lastName } = splitPersonalClientName(clientName);

    client = await prisma.client.create({
  data: {
    type: "PARTICULIER",
    firstName,
    lastName,
    phone,
    street,
    postalCode,
    city,

    // Client créé automatiquement par Forge
    isTemporary: true,

    userId: currentUser.id,
    organizationId: workspaceContext.workspace.id,
  },
});

      clientCreated = true;
    } else if (client) {
      const updateData: {
        phone?: string;
        street?: string;
        postalCode?: string;
        city?: string;
      } = {};

      if (!client.phone && phone) updateData.phone = phone;
      if (!client.street && street) updateData.street = street;
      if (!client.postalCode && postalCode) {
        updateData.postalCode = postalCode;
      }
      if (!client.city && city) updateData.city = city;

      if (Object.keys(updateData).length > 0) {
        client = await prisma.client.update({
          where: { id: client.id },
          data: updateData,
        });

        clientUpdated = true;
      }
    }

    const intervention = await prisma.intervention.create({
      data: {
        userId: currentUser.id,
        organizationId: workspaceContext.workspace.id,
        clientId: client?.id,
        // Le titre reste techniquement non nullable pour préserver le schéma et
        // les anciens devis, mais une chaîne vide représente une intervention
        // créée sans motif. Le fallback « Intervention » reste purement visuel.
        title: title || description || "",
        description: description || null,
        scheduledAt: period.start,
        endDate: period.end,
        status: "PLANIFIEE",
        dayTasks: dayTasks.length
          ? { create: dayTasks.map(interventionDayTaskCreateData) }
          : undefined,
      },
      include: { client: true, dayTasks: true },
    });

    return NextResponse.json(
      {
        intervention,
        clientCreated,
        clientUpdated,
        message: !client
          ? "L’intervention a été créée sans client."
          : clientCreated
          ? "Le client et l’intervention ont été créés."
          : clientUpdated
            ? "La fiche client a été complétée et l’intervention a été créée."
            : "L’intervention a été créée pour le client existant.",
      },
      { status: 201 },
    );
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error(
      "Erreur lors de la création de l’intervention :",
      error,
    );

    return NextResponse.json(
      { error: "Impossible de créer l’intervention." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const workspaceContext = await requireWorkspaceContext("write");
    const currentUser = workspaceContext.user;

    const body = await request.json();

    const operation: InterventionOperation | null =
      body.operation === "reschedule" ||
      body.operation === "edit" ||
      body.operation === "extend" ||
      body.operation === "updateNotes" ||
      body.operation === "cancel" ||
      body.operation === "attachClient" ||
      body.operation === "saveFinalization" ||
      body.operation === "finalize" ||
      body.operation === "start" ||
      body.operation === "complete" ||
      body.operation === "addDayTasks"
        ? body.operation
        : null;

    if (!operation) {
      return NextResponse.json(
        { error: "L’action demandée est invalide." },
        { status: 400 },
      );
    }


    if (operation === "addDayTasks") {
      const requestedId = cleanOptionalString(body.interventionId);
      const clientName = cleanOptionalString(body.clientName);
      const taskDates = Array.isArray(body.dayTasks)
        ? body.dayTasks
            .map((task: unknown) => task && typeof task === "object" && typeof (task as Record<string, unknown>).date === "string"
              ? String((task as Record<string, unknown>).date)
              : null)
            .filter((date: string | null): date is string => Boolean(date))
            .sort()
        : [];
      const dateBounds = taskDates[0] ? getParisDayBounds(taskDates[0]) : null;

      let candidates = await prisma.intervention.findMany({
        where: {
          organizationId: workspaceContext.workspace.id,
          status: { in: ["PLANIFIEE", "EN_COURS"] },
          ...(requestedId ? { id: requestedId } : {}),
          ...(dateBounds ? {
            OR: [
              { scheduledAt: { gte: dateBounds.start, lte: dateBounds.end } },
              { scheduledAt: { lte: dateBounds.end }, endDate: { gte: dateBounds.start } },
            ],
          } : {}),
        },
        include: { client: true, dayTasks: true },
        orderBy: { scheduledAt: "asc" },
      });

      if (!requestedId && clientName) {
        const searchedName = normalize(clientName);
        candidates = candidates.filter((candidate) =>
          candidate.client && normalize(getClientDisplayName(candidate.client)).includes(searchedName),
        );
      }
      if (candidates.length !== 1) {
        return NextResponse.json(
          { error: candidates.length ? "Plusieurs chantiers correspondent. Précise le client ou la date." : "Aucun chantier actif correspondant n’a été trouvé." },
          { status: candidates.length ? 409 : 404 },
        );
      }

      const target = candidates[0];
      const tasks = normalizeInterventionDayTasks(body.dayTasks, target.scheduledAt, target.endDate);
      const existingKeys = new Set(target.dayTasks.map((task) =>
        `${formatParisDateKey(task.date)}\u0000${normalize(task.title)}`,
      ));
      const newTasks = tasks.filter((task) => !existingKeys.has(`${task.date}\u0000${normalize(task.title)}`));
      if (!newTasks.length) {
        return NextResponse.json({ intervention: target, operation, createdCount: 0 });
      }
      await prisma.interventionDayTask.createMany({
        data: newTasks.map((task, index) => ({
          ...interventionDayTaskCreateData(task),
          interventionId: target.id,
          position: target.dayTasks.length + index,
        })),
      });
      const intervention = await prisma.intervention.findUnique({
        where: { id: target.id },
        include: { client: true, dayTasks: { orderBy: [{ date: "asc" }, { position: "asc" }] } },
      });
      return NextResponse.json({ intervention, operation, createdCount: newTasks.length });
    }

    const interventionId =
      typeof body.interventionId === "string"
        ? body.interventionId.trim()
        : "";

    if (operation === "saveFinalization" || operation === "finalize") {
      if (!interventionId) {
        return NextResponse.json({ error: "Intervention manquante." }, { status: 400 });
      }

      const existing = await prisma.intervention.findFirst({
        where: { id: interventionId, organizationId: workspaceContext.workspace.id },
        select: { id: true },
      });
      if (!existing) {
        return NextResponse.json({ error: "Cette intervention est introuvable." }, { status: 404 });
      }

      const finalizationStep = cleanOptionalString(body.finalizationStep);
      const reportDraft = typeof body.reportDraft === "string"
        ? body.reportDraft
        : undefined;
      const draftReport = body.report && typeof body.report === "object"
        ? body.report as Record<string, unknown>
        : null;
      const intervention = await prisma.intervention.update({
        where: { id: existing.id },
        data: operation === "finalize"
          ? { finalizedAt: new Date(), finalizationStep: "FINALIZED" }
          : {
              ...(finalizationStep ? { finalizationStep } : {}),
              ...(reportDraft !== undefined ? { reportDraft } : {}),
              ...(draftReport ? {
                reportIntervention: cleanOptionalString(draftReport.intervention),
                reportDiagnostic: cleanOptionalString(draftReport.diagnostic),
                reportTravaux: cleanOptionalString(draftReport.travaux),
                reportRecommendation: cleanOptionalString(draftReport.recommandation),
              } : {}),
            },
      });
      return NextResponse.json({ intervention, operation });
    }

    if (operation === "attachClient") {
      if (!interventionId) {
        return NextResponse.json(
          { error: "L’identifiant de l’intervention est obligatoire." },
          { status: 400 },
        );
      }

      const intervention = await prisma.intervention.findFirst({
        where: {
          id: interventionId,
          organizationId: workspaceContext.workspace.id,
        },
      });

      if (!intervention) {
        return NextResponse.json(
          { error: "Cette intervention est introuvable." },
          { status: 404 },
        );
      }

      const requestedClientId = cleanOptionalString(body.clientId);
      let client = requestedClientId
        ? await prisma.client.findFirst({
            where: {
              id: requestedClientId,
              organizationId: workspaceContext.workspace.id,
              archived: false,
            },
          })
        : null;

      if (requestedClientId && !client) {
        return NextResponse.json(
          { error: "Le client sélectionné est introuvable." },
          { status: 404 },
        );
      }

      if (!client) {
        const clientType = body.clientType === "PROFESSIONNEL"
          ? "PROFESSIONNEL" as const
          : "PARTICULIER" as const;
        const firstName = cleanOptionalString(body.firstName);
        const lastName = cleanOptionalString(body.lastName);
        const companyName = cleanOptionalString(body.companyName);

        if (
          (clientType === "PARTICULIER" && !firstName) ||
          (clientType === "PROFESSIONNEL" && !companyName)
        ) {
          return NextResponse.json(
            { error: "Les informations du client sont incomplètes." },
            { status: 400 },
          );
        }

        client = await prisma.client.create({
          data: {
            type: clientType,
            firstName: clientType === "PARTICULIER" ? firstName : null,
            lastName: clientType === "PARTICULIER" ? lastName : null,
            companyName: clientType === "PROFESSIONNEL" ? companyName : null,
            isTemporary: true,
            userId: currentUser.id,
            organizationId: workspaceContext.workspace.id,
          },
        });
      }

      const updatedIntervention = await prisma.intervention.update({
        where: { id: intervention.id },
        data: { clientId: client.id },
        include: { client: true },
      });

      return NextResponse.json({
        intervention: updatedIntervention,
        operation,
        clientId: client.id,
        clientName: getClientDisplayName(client),
      });
    }

    if (operation === "edit") {
      if (!interventionId) {
        return NextResponse.json(
          { error: "L’identifiant de l’intervention est obligatoire." },
          { status: 400 },
        );
      }

      const existingIntervention =
        await prisma.intervention.findFirst({
          where: {
            id: interventionId,
            organizationId: workspaceContext.workspace.id,
          },
          include: { client: true },
        });

      if (!existingIntervention) {
        return NextResponse.json(
          { error: "Cette intervention est introuvable." },
          { status: 404 },
        );
      }

      const scheduledDate =
        typeof body.scheduledDate === "string"
          ? body.scheduledDate.trim()
          : "";
      const scheduledTime =
        typeof body.scheduledTime === "string"
          ? body.scheduledTime.trim()
          : "";
      const scheduledEndDate =
        typeof body.scheduledEndDate === "string"
          ? body.scheduledEndDate.trim()
          : "";
      const scheduledEndTime =
        typeof body.scheduledEndTime === "string"
          ? body.scheduledEndTime.trim()
          : "";
      const period = createParisInterventionPeriod({
        scheduledDate,
        scheduledTime,
        scheduledEndDate: scheduledEndDate || null,
        scheduledEndTime: scheduledEndTime || null,
      });

      if ("error" in period) {
        return NextResponse.json(
          { error: period.error },
          { status: 400 },
        );
      }

      const clientName =
        typeof body.clientName === "string"
          ? body.clientName.trim()
          : "";
      const title =
        typeof body.title === "string"
          ? body.title.trim()
          : "";
      const clientUpdate = existingIntervention.client &&
        existingIntervention.clientId && clientName
        ? prisma.client.update({
            where: { id: existingIntervention.clientId },
            data: existingIntervention.client.type === "PROFESSIONNEL"
              ? { companyName: clientName }
              : splitPersonalClientName(clientName),
          })
        : null;

      const updateIntervention = prisma.intervention.update({
        where: { id: interventionId },
        data: {
          title,
          scheduledAt: period.start,
          endDate: period.end,
        },
      });
      const updatedIntervention = clientUpdate
        ? (await prisma.$transaction([clientUpdate, updateIntervention]))[1]
        : await updateIntervention;

      return NextResponse.json({
        intervention: updatedIntervention,
        operation,
        clientName,
      });
    }

    if (operation === "start" || operation === "complete") {
      if (!interventionId) {
        return NextResponse.json(
          {
            error:
              "L’identifiant de l’intervention est obligatoire.",
          },
          { status: 400 },
        );
      }

      const existingIntervention =
        await prisma.intervention.findFirst({
          where: {
            id: interventionId,
            organizationId: workspaceContext.workspace.id,
          },
          include: {
            client: true,
          },
        });

      if (!existingIntervention) {
        return NextResponse.json(
          { error: "Cette intervention est introuvable." },
          { status: 404 },
        );
      }

      if (operation === "start") {
        if (existingIntervention.status === "ANNULEE") {
          return NextResponse.json(
            {
              error:
                "Une intervention annulée ne peut pas être démarrée.",
            },
            { status: 409 },
          );
        }

        let startedIntervention;
        const suppliedClientInformation = Boolean(
          cleanOptionalString(body.firstName) ||
          cleanOptionalString(body.companyName),
        );

        if (existingIntervention.client || !suppliedClientInformation) {
          startedIntervention = await prisma.intervention.update({
            where: { id: interventionId },
            data: { status: "EN_COURS", startedAt: new Date() },
            include: { client: true },
          });
        } else {
          const clientType =
            body.clientType === "PROFESSIONNEL"
              ? "PROFESSIONNEL" as const
              : "PARTICULIER" as const;
          const firstName = cleanOptionalString(body.firstName);
          const lastName = cleanOptionalString(body.lastName);
          const companyName = cleanOptionalString(body.companyName);
          const title = cleanOptionalString(body.title);

          if (
            (clientType === "PARTICULIER" &&
              !firstName) ||
            (clientType === "PROFESSIONNEL" && !companyName)
          ) {
            return NextResponse.json(
              { error: "Les informations du client sont incomplètes." },
              { status: 400 },
            );
          }

          const phone = cleanOptionalString(body.phone);
          const street = cleanOptionalString(body.address);

          startedIntervention = await prisma.$transaction(
            async (transaction) => {
              const client = await transaction.client.create({
                data: {
                  type: clientType,
                  firstName:
                    clientType === "PARTICULIER" ? firstName : null,
                  lastName:
                    clientType === "PARTICULIER" ? lastName : null,
                  companyName:
                    clientType === "PROFESSIONNEL" ? companyName : null,
                  phone,
                  street,
                  isTemporary: true,
                  userId: currentUser.id,
                  organizationId: workspaceContext.workspace.id,
                },
              });

              return transaction.intervention.update({
                where: { id: interventionId },
                data: {
                  clientId: client.id,
                  ...(title ? { title } : {}),
                  status: "EN_COURS",
                  startedAt: new Date(),
                },
                include: { client: true },
              });
            },
          );
        }

        return NextResponse.json({
          intervention: startedIntervention,
          operation,
          clientId: startedIntervention.clientId,
          clientName: startedIntervention.client
            ? getClientDisplayName(startedIntervention.client)
            : "",
        });
      }

      const reportIntervention = cleanOptionalString(
        body.reportIntervention,
      );
      const reportDiagnostic = cleanOptionalString(
        body.reportDiagnostic,
      );
      const reportTravaux = cleanOptionalString(
        body.reportTravaux,
      );
      const reportRecommendation = cleanOptionalString(
        body.reportRecommendation,
      );

      const reportState = getInterventionReportState({
        reportIntervention,
        reportDiagnostic,
        reportTravaux,
        reportRecommendation,
      });
      const hasCompleteReport = reportState === "complete";

      if (reportState === "incomplete") {
        return NextResponse.json(
          { error: "Le compte rendu est incomplet." },
          { status: 400 },
        );
      }

      const completedIntervention =
        await prisma.intervention.update({
          where: { id: interventionId },
          data: {
            status: "TERMINEE",
            finishedAt: new Date(),
            finalizationStep: "INVOICE_CHOICE",
            reportSkippedAt: hasCompleteReport ? null : new Date(),
            ...(hasCompleteReport
              ? {
                  reportIntervention,
                  reportDiagnostic,
                  reportTravaux,
                  reportRecommendation,
                }
              : {}),
          },
          include: { client: true },
        });

      return NextResponse.json({
        intervention: completedIntervention,
        operation,
        clientId: completedIntervention.clientId,
        clientName: completedIntervention.client
          ? getClientDisplayName(completedIntervention.client)
          : "",
        clientIsTemporary:
          completedIntervention.client?.isTemporary ??
          false,
        message: hasCompleteReport
          ? "Le compte rendu a été enregistré et l’intervention est terminée."
          : "L’intervention est terminée.",
      });
    }

    if (operation === "extend" || operation === "updateNotes") {
      if (!interventionId) {
        return NextResponse.json(
          { error: "L’identifiant de l’intervention est obligatoire." },
          { status: 400 },
        );
      }

      const notes = cleanOptionalString(body.notes);
      const scheduledDate =
        typeof body.scheduledDate === "string"
          ? body.scheduledDate.trim()
          : "";
      const dateBounds = scheduledDate
        ? getParisDayBounds(scheduledDate)
        : null;

      if (operation === "extend" && !dateBounds) {
        return NextResponse.json(
          { error: "La date de prolongation est invalide." },
          { status: 400 },
        );
      }

      const existingIntervention =
        await prisma.intervention.findFirst({
          where: {
            id: interventionId,
            organizationId: workspaceContext.workspace.id,
          },
        });

      if (!existingIntervention) {
        return NextResponse.json(
          { error: "Cette intervention est introuvable." },
          { status: 404 },
        );
      }

      const notesMarker = "Notes de prolongation :";
      const descriptionWithoutNotes =
        existingIntervention.description
          ?.split(notesMarker)[0]
          .trim() || null;
      const description = notes
        ? [
            descriptionWithoutNotes,
            `${notesMarker} ${notes}`,
          ]
            .filter(Boolean)
            .join("\n\n")
        : descriptionWithoutNotes;

      const extendedIntervention =
        await prisma.intervention.update({
          where: { id: interventionId },
          data: {
            ...(dateBounds
              ? { endDate: dateBounds.end }
              : {}),
            description,
          },
          include: { client: true },
        });

      return NextResponse.json({
        intervention: extendedIntervention,
        operation,
        message:
          operation === "extend"
            ? "La prolongation et les notes ont été enregistrées."
            : "Les notes ont été enregistrées.",
      });
    }

    const clientName =
      typeof body.clientName === "string"
        ? body.clientName.trim()
        : "";

    const currentScheduledDate =
      typeof body.currentScheduledDate === "string"
        ? body.currentScheduledDate.trim()
        : "";

    const scheduledDate =
      typeof body.scheduledDate === "string"
        ? body.scheduledDate.trim()
        : "";

    const scheduledTime =
      typeof body.scheduledTime === "string"
        ? body.scheduledTime.trim()
        : "";

    const scheduledEndDate =
      typeof body.scheduledEndDate === "string"
        ? body.scheduledEndDate.trim()
        : "";

    const scheduledEndTime =
      typeof body.scheduledEndTime === "string"
        ? body.scheduledEndTime.trim()
        : "";

    if (!clientName) {
      return NextResponse.json(
        { error: "Précise le client concerné." },
        { status: 400 },
      );
    }

    const clients =
      await prisma.client.findMany({
        where: {
          organizationId: workspaceContext.workspace.id,
        },
      });
    const normalizedClientName = normalize(clientName);

    const matchingClients = clients.filter((client) => {
      const normalizedDisplayName = normalize(
        getClientDisplayName(client),
      );

      return (
        normalizedDisplayName === normalizedClientName ||
        normalizedDisplayName.includes(normalizedClientName)
      );
    });

    if (matchingClients.length === 0) {
      return NextResponse.json(
        {
          error: `Aucun client trouvé pour « ${clientName} ».`,
        },
        { status: 404 },
      );
    }

    if (matchingClients.length > 1) {
      return NextResponse.json(
        {
          error: `Plusieurs clients correspondent à « ${clientName} ». Précise davantage le nom.`,
        },
        { status: 409 },
      );
    }

    const client = matchingClients[0];

    const dateBounds = currentScheduledDate
      ? getParisDayBounds(currentScheduledDate)
      : null;

    if (currentScheduledDate && !dateBounds) {
      return NextResponse.json(
        {
          error:
            "La date actuelle de l’intervention est invalide.",
        },
        { status: 400 },
      );
    }

    const matchingInterventions =
      await prisma.intervention.findMany({
        where: {
          clientId: client.id,
          organizationId: workspaceContext.workspace.id,
          status: {
            in: ["PLANIFIEE", "EN_COURS"],
          },
          ...(dateBounds
            ? {
                OR: [
                  {
                    scheduledAt: {
                      gte: dateBounds.start,
                      lte: dateBounds.end,
                    },
                  },
                  {
                    scheduledAt: { lte: dateBounds.end },
                    endDate: { gte: dateBounds.start },
                  },
                ],
              }
            : {}),
        },
        include: { client: true },
        orderBy: { scheduledAt: "asc" },
      });

    if (matchingInterventions.length === 0) {
      return NextResponse.json(
        {
          error: currentScheduledDate
            ? `Aucune intervention trouvée pour ${clientName} à cette date.`
            : `Aucune intervention active trouvée pour ${clientName}.`,
        },
        { status: 404 },
      );
    }

    if (matchingInterventions.length > 1) {
      return NextResponse.json(
        {
          error:
            "Plusieurs interventions correspondent. Précise la date actuelle de l’intervention.",
        },
        { status: 409 },
      );
    }

    const intervention = matchingInterventions[0];

    if (operation === "cancel") {
      const cancelledIntervention =
        await prisma.intervention.update({
          where: { id: intervention.id },
          data: { status: "ANNULEE" },
          include: { client: true },
        });

      return NextResponse.json({
        intervention: cancelledIntervention,
        operation,
        message: `L’intervention de ${clientName} a été annulée.`,
      });
    }

    if (!scheduledDate || !scheduledTime) {
      return NextResponse.json(
        {
          error:
            "La nouvelle date et la nouvelle heure sont obligatoires.",
        },
        { status: 400 },
      );
    }

    const period = createParisInterventionPeriod({
      scheduledDate,
      scheduledTime,
      scheduledEndDate: scheduledEndDate || null,
      scheduledEndTime: scheduledEndTime || null,
    });

    if ("error" in period) {
      return NextResponse.json(
        {
          error:
            "La nouvelle date ou la nouvelle heure est invalide.",
        },
        { status: 400 },
      );
    }

    const rescheduledIntervention =
      await prisma.intervention.update({
        where: { id: intervention.id },
        data: {
          scheduledAt: period.start,
          endDate: period.end,
          status: "PLANIFIEE",
        },
        include: { client: true },
      });

    return NextResponse.json({
      intervention: rescheduledIntervention,
      operation,
      message: `L’intervention de ${clientName} a été reportée.`,
    });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error(
      "Erreur lors de la modification de l’intervention :",
      error,
    );

    return NextResponse.json(
      { error: "Impossible de modifier l’intervention." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const workspaceContext = await requireWorkspaceContext("write");

    const body = await request.json();

    if (body.deleteAll === true) {
      const scheduledDate =
        typeof body.scheduledDate === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(
          body.scheduledDate,
        )
          ? body.scheduledDate
          : "";

      if (!scheduledDate) {
        return NextResponse.json(
          { error: "La date est obligatoire." },
          { status: 400 },
        );
      }

      const dateBounds = getParisDayBounds(scheduledDate);
      if (!dateBounds) {
        return NextResponse.json(
          { error: "La date est invalide." },
          { status: 400 },
        );
      }

      const where = {
        status: "PLANIFIEE" as const,
        scheduledAt: {
          gte: dateBounds.start,
          lt: dateBounds.nextStart,
        },
        organizationId: workspaceContext.workspace.id,
        invoices: { none: {} },
        workTimes: { none: {} },
        expenses: { none: {} },
        dayStates: {
          none: {
            OR: [
              { startedAt: { not: null } },
              { completedAt: { not: null } },
              { report: { not: null } },
            ],
          },
        },
        dayTasks: {
          none: {
            OR: [{ completedAt: { not: null } }, { report: { not: null } }],
          },
        },
        reportIntervention: null,
        reportDiagnostic: null,
        reportTravaux: null,
        reportRecommendation: null,
      };

      const count =
        await prisma.intervention.count({
          where,
        });

      if (body.confirmed !== true) {
        return NextResponse.json({
          count,
          requiresConfirmation: count > 0,
        });
      }

      const deleted =
        await prisma.intervention.deleteMany({
          where,
        });

      return NextResponse.json({
        success: true,
        deletedCount: deleted.count,
      });
    }

    const interventionId =
      typeof body.interventionId === "string"
        ? body.interventionId.trim()
        : "";

    const intervention =
      await prisma.intervention.findFirst({
        where: {
          id: interventionId,
          organizationId: workspaceContext.workspace.id,
        },
        select: {
          id: true,
          status: true,
          startedAt: true,
          finishedAt: true,
          reportIntervention: true,
          reportDiagnostic: true,
          reportTravaux: true,
          reportRecommendation: true,
          invoices: { select: { id: true } },
          workTimes: { select: { id: true }, take: 1 },
          expenses: { select: { id: true }, take: 1 },
          dayStates: {
            where: {
              OR: [
                { startedAt: { not: null } },
                { completedAt: { not: null } },
                { report: { not: null } },
              ],
            },
            select: { id: true },
            take: 1,
          },
          dayTasks: {
            where: {
              OR: [{ completedAt: { not: null } }, { report: { not: null } }],
            },
            select: { id: true },
            take: 1,
          },
        },
      });

    if (!intervention) {
      return NextResponse.json(
        { error: "Cette intervention est introuvable." },
        { status: 404 },
      );
    }

    if (intervention.invoices.length > 0) {
      return NextResponse.json(
        { error: "Ce chantier ne peut pas être supprimé car une facture lui est associée." },
        { status: 409 },
      );
    }

    const hasHistoricalData =
      intervention.status === "EN_COURS" ||
      intervention.status === "TERMINEE" ||
      intervention.startedAt !== null ||
      intervention.finishedAt !== null ||
      intervention.workTimes.length > 0 ||
      intervention.expenses.length > 0 ||
      intervention.dayStates.length > 0 ||
      intervention.dayTasks.length > 0 ||
      Boolean(
        intervention.reportIntervention ||
        intervention.reportDiagnostic ||
        intervention.reportTravaux ||
        intervention.reportRecommendation,
      );

    if (hasHistoricalData) {
      return NextResponse.json(
        { error: "Ce chantier contient déjà un historique de travail. Il ne peut pas être supprimé." },
        { status: 409 },
      );
    }

    await prisma.intervention.delete({
      where: { id: intervention.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error(
      "Erreur lors de la suppression de l’intervention :",
      error,
    );

    return NextResponse.json(
      { error: "Impossible de supprimer l’intervention." },
      { status: 500 },
    );
  }
}
