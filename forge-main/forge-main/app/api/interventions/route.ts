import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";

async function getCurrentUser() {
  const cookieStore = await cookies();

  const sessionToken =
    cookieStore.get("forgeSession")?.value;

  if (!sessionToken) {
    return null;
  }

  const session =
    await prisma.session.findUnique({
      where: {
        token: sessionToken,
      },
      include: {
        user: true,
      },
    });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({
      where: {
        id: session.id,
      },
    });

    return null;
  }

  return session.user;
}

type InterventionOperation =
  | "reschedule"
  | "rescheduleById"
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

function cleanClientName(value: string) {
  return value
    .replace(/\b(mme|monsieur|madame|mr|m)\b\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitClientName(value: string) {
  const cleanedName = cleanClientName(value);
  const parts = cleanedName.split(" ").filter(Boolean);

  if (parts.length === 0) {
    return { firstName: null, lastName: "Client" };
  }

  if (parts.length === 1) {
    return { firstName: null, lastName: parts[0] };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? "Client",
  };
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
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          error:
            "Tu dois être connecté pour créer une intervention.",
        },
        {
          status: 401,
        },
      );
    }

    const body = await request.json();

    const clientName =
      typeof body.clientName === "string"
        ? body.clientName.trim()
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

    if (!clientName || !title || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        {
          error:
            "Le client, le motif, la date et l’heure sont obligatoires.",
        },
        { status: 400 },
      );
    }

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

    const clients =
      await prisma.client.findMany({
        where: {
          userId: currentUser.id,
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

    if (matchingClients.length > 1) {
      return NextResponse.json(
        {
          error: `Plusieurs clients correspondent à « ${clientName} ». Précise davantage le nom.`,
        },
        { status: 409 },
      );
    }

    let client = matchingClients[0];
    let clientCreated = false;
    let clientUpdated = false;

    if (!client) {
      const { firstName, lastName } = splitClientName(clientName);

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
  },
});

      clientCreated = true;
    } else {
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
        clientId: client.id,
        title,
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
        message: clientCreated
          ? "Le client et l’intervention ont été créés."
          : clientUpdated
            ? "La fiche client a été complétée et l’intervention a été créée."
            : "L’intervention a été créée pour le client existant.",
      },
      { status: 201 },
    );
  } catch (error) {
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
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          error:
            "Tu dois être connecté pour modifier une intervention.",
        },
        {
          status: 401,
        },
      );
    }

    const body = await request.json();

    const operation: InterventionOperation | null =
      body.operation === "reschedule" ||
      body.operation === "rescheduleById" ||
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

    if (operation === "edit" || operation === "rescheduleById") {
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
            client: { userId: currentUser.id },
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

      if (operation === "rescheduleById") {
        const updatedIntervention =
          await prisma.intervention.update({
            where: { id: interventionId },
            data: {
              scheduledAt,
              status: "PLANIFIEE",
            },
          });

        return NextResponse.json({
          intervention: updatedIntervention,
          operation,
        });
      }

      const clientName =
        typeof body.clientName === "string"
          ? body.clientName.trim()
          : "";
      const title =
        typeof body.title === "string"
          ? body.title.trim()
          : "";
      const description = cleanOptionalString(body.description);

      if (!clientName || !title) {
        return NextResponse.json(
          { error: "Le client et le titre sont obligatoires." },
          { status: 400 },
        );
      }

      const clientData =
        existingIntervention.client.type === "PROFESSIONNEL"
          ? { companyName: clientName }
          : splitClientName(clientName);

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
              description,
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
            client: {
              userId: currentUser.id,
            },
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

        const startedIntervention =
          await prisma.intervention.update({
            where: { id: interventionId },
            data: { status: "EN_COURS" },
            include: { client: true },
          });

        return NextResponse.json({
          intervention: startedIntervention,
          operation,
          clientId: startedIntervention.clientId,
          clientName: getClientDisplayName(
            startedIntervention.client,
          ),
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
        clientName: getClientDisplayName(
          completedIntervention.client,
        ),
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
            client: { userId: currentUser.id },
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
          userId: currentUser.id,
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
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Tu dois être connecté pour supprimer une intervention." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const interventionId =
      typeof body.interventionId === "string"
        ? body.interventionId.trim()
        : "";

    const intervention =
      await prisma.intervention.findFirst({
        where: {
          id: interventionId,
          client: { userId: currentUser.id },
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
