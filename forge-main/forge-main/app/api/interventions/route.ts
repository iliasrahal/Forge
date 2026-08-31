import { NextResponse } from "next/server";

import { splitPersonalClientName } from "@/src/lib/client-name";
import { prisma } from "@/src/lib/prisma";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";

type InterventionOperation =
  | "reschedule"
  | "edit"
  | "extend"
  | "updateNotes"
  | "cancel"
  | "start"
  | "complete";

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

function createScheduledAt(
  scheduledDate: string,
  scheduledTime: string,
) {
  const scheduledAt = new Date(
    `${scheduledDate}T${scheduledTime}:00`,
  );

  return Number.isNaN(scheduledAt.getTime())
    ? null
    : scheduledAt;
}

function getDayBounds(date: string) {
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(`${date}T23:59:59.999`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return null;
  }

  return { start, end };
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

    const scheduledAt = createScheduledAt(
      scheduledDate,
      scheduledTime || "00:00",
    );

    if (!scheduledAt) {
      return NextResponse.json(
        { error: "La date ou l’heure est invalide." },
        { status: 400 },
      );
    }

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
        title: title || description || "Intervention",
        description: description || null,
        scheduledAt,
        status: "PLANIFIEE",
      },
      include: { client: true },
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
      body.operation === "start" ||
      body.operation === "complete"
        ? body.operation
        : null;

    if (!operation) {
      return NextResponse.json(
        { error: "L’action demandée est invalide." },
        { status: 400 },
      );
    }

    const interventionId =
      typeof body.interventionId === "string"
        ? body.interventionId.trim()
        : "";

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
      const scheduledAt = createScheduledAt(
        scheduledDate,
        scheduledTime,
      );

      if (!scheduledAt) {
        return NextResponse.json(
          { error: "La date ou l’heure est invalide." },
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
      if (!clientName || !title) {
        return NextResponse.json(
          { error: "Le client et le titre sont obligatoires." },
          { status: 400 },
        );
      }

      if (!existingIntervention.client || !existingIntervention.clientId) {
        return NextResponse.json(
          { error: "Aucun client n’est encore associé à cette intervention." },
          { status: 409 },
        );
      }

      const clientData =
        existingIntervention.client.type === "PROFESSIONNEL"
          ? { companyName: clientName }
          : splitPersonalClientName(clientName);

      const [, updatedIntervention] =
        await prisma.$transaction([
          prisma.client.update({
            where: { id: existingIntervention.clientId },
            data: clientData,
          }),
          prisma.intervention.update({
            where: { id: interventionId },
            data: {
              title,
              scheduledAt,
            },
          }),
        ]);

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

        if (existingIntervention.client) {
          startedIntervention =
            await prisma.intervention.update({
              where: { id: interventionId },
              data: { status: "EN_COURS" },
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

          if (!title) {
            return NextResponse.json(
              { error: "Le motif de l’intervention est obligatoire." },
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
                  title,
                  status: "EN_COURS",
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

      if (
        !reportIntervention ||
        !reportDiagnostic ||
        !reportTravaux ||
        !reportRecommendation
      ) {
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
            reportIntervention,
            reportDiagnostic,
            reportTravaux,
            reportRecommendation,
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
        message:
          "Le compte rendu a été enregistré et l’intervention est terminée.",
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
        ? getDayBounds(scheduledDate)
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
      ? getDayBounds(currentScheduledDate)
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
          status: {
            in: ["PLANIFIEE", "EN_COURS"],
          },
          ...(dateBounds
            ? {
                scheduledAt: {
                  gte: dateBounds.start,
                  lte: dateBounds.end,
                },
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

    const newScheduledAt = createScheduledAt(
      scheduledDate,
      scheduledTime,
    );

    if (!newScheduledAt) {
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
          scheduledAt: newScheduledAt,
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

      const startOfDay = new Date(
        `${scheduledDate}T00:00:00.000Z`,
      );
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(
        endOfDay.getUTCDate() + 1,
      );

      const where = {
        status: "PLANIFIEE" as const,
        scheduledAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
        organizationId: workspaceContext.workspace.id,
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
        select: { id: true },
      });

    if (!intervention) {
      return NextResponse.json(
        { error: "Cette intervention est introuvable." },
        { status: 404 },
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
