import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";


function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(
      /\b(mme|monsieur|madame|mr|m)\b.?/g,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}


function cleanOptionalString(value: unknown) {
  return typeof value === "string" &&
    value.trim()
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

  return `${client.firstName ?? ""} ${
    client.lastName ?? ""
  }`.trim();
}


export async function PATCH(request: Request) {
  try {
    const body = await request.json();


    const clientId =
      typeof body.clientId === "string"
        ? body.clientId
        : null;


    const isTemporary =
      typeof body.isTemporary === "boolean"
        ? body.isTemporary
        : undefined;


    let client;


    if (clientId) {
      client = await prisma.client.findUnique({
        where: {
          id: clientId,
        },
      });
    }


    if (!client) {

      const clientName =
        typeof body.clientName === "string"
          ? body.clientName.trim()
          : "";


      if (!clientName) {
        return NextResponse.json(
          {
            error:
              "Précise le nom du client concerné.",
          },
          {
            status: 400,
          },
        );
      }


      const clients =
        await prisma.client.findMany();


      const normalizedClientName =
        normalize(clientName);


      const matchingClients =
        clients.filter(
          (client) => {

            const displayName =
              getClientDisplayName(client);


            const normalizedDisplayName =
              normalize(displayName);


            return (
              normalizedDisplayName ===
                normalizedClientName ||
              normalizedDisplayName.includes(
                normalizedClientName,
              )
            );
          },
        );


      if (matchingClients.length === 0) {
        return NextResponse.json(
          {
            error:
              `Aucun client trouvé pour « ${clientName} ».`,
          },
          {
            status: 404,
          },
        );
      }


      if (matchingClients.length > 1) {
        return NextResponse.json(
          {
            error:
              `Plusieurs clients correspondent à « ${clientName} ».`,
          },
          {
            status: 409,
          },
        );
      }


      client = matchingClients[0];
    }


    if (!client) {
      return NextResponse.json(
        {
          error:
            "Client introuvable.",
        },
        {
          status: 404,
        },
      );
    }


    const phone = cleanOptionalString(
      body.phone,
    );

    const email = cleanOptionalString(
      body.email,
    );

    const street = cleanOptionalString(
      body.street,
    );

    const postalCode = cleanOptionalString(
      body.postalCode,
    );

    const city = cleanOptionalString(
      body.city,
    );

    const notes = cleanOptionalString(
      body.notes,
    );


    const updatedClient =
      await prisma.client.update({
        where: {
          id: client.id,
        },

        data: {
          ...(phone
            ? { phone }
            : {}),

          ...(email
            ? { email }
            : {}),

          ...(street
            ? { street }
            : {}),

          ...(postalCode
            ? { postalCode }
            : {}),

          ...(city
            ? { city }
            : {}),

          ...(notes
            ? { notes }
            : {}),

          ...(isTemporary !== undefined
            ? {
                isTemporary,
              }
            : {}),
        },
      });


    return NextResponse.json({
      client: updatedClient,
      message:
        "La fiche client a été mise à jour.",
    });


  } catch (error) {

    console.error(
      "Erreur lors de la mise à jour du client :",
      error,
    );


    return NextResponse.json(
      {
        error:
          "Impossible de modifier la fiche client.",
      },
      {
        status: 500,
      },
    );
  }
}




// Suppression uniquement des clients temporaires créés par Forge
export async function DELETE(request: Request) {
  try {

    const body = await request.json();


    const clientName =
      typeof body.clientName === "string"
        ? body.clientName.trim()
        : "";


    if (!clientName) {
      return NextResponse.json(
        {
          error:
            "Précise le nom du client à supprimer.",
        },
        {
          status: 400,
        },
      );
    }


    const clients =
      await prisma.client.findMany();


    const normalizedClientName =
      normalize(clientName);


    const client =
      clients.find(
        (client) =>
          normalize(
            getClientDisplayName(client),
          ) === normalizedClientName,
      );


    if (!client) {
      return NextResponse.json(
        {
          error:
            "Client introuvable.",
        },
        {
          status: 404,
        },
      );
    }


    if (!client.isTemporary) {
      return NextResponse.json(
        {
          error:
            "Ce client n'est pas une fiche temporaire.",
        },
        {
          status: 403,
        },
      );
    }


    const updated = await prisma.client.update({
      where: { id: client.id },
      data: { archived: true, isTemporary: false },
    });

    return NextResponse.json({
      message: "La fiche client temporaire a été supprimée.",
      clientId: updated.id,
    });


  } catch (error) {

    console.error(
      "Erreur suppression client temporaire :",
      error,
    );


    return NextResponse.json(
      {
        error:
          "Impossible de supprimer la fiche client.",
      },
      {
        status: 500,
      },
    );
  }
}