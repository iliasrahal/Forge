import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";



export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {

  const { id } = await params;


  try {
    const workspaceContext = await requireWorkspaceContext("write");

    const body =
      await request.json();



    const result =
      await prisma.client.updateMany({

        where: {
          id,
          organizationId: workspaceContext.workspace.id,
        },


        data: {
          isTemporary:
            body.isTemporary ?? false,
          ...(typeof body.email === "string"
            ? { email: body.email.trim() || null }
            : {}),
        },

      });

    if (result.count !== 1) {
      return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
    }

    const client = await prisma.client.findFirst({
      where: { id, organizationId: workspaceContext.workspace.id },
    });



    return NextResponse.json({
      success: true,
      client,
    });



  } catch (error) {

    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }


    console.error(
      "Erreur conservation client :",
      error,
    );


    return NextResponse.json(
      {
        success: false,
        error:
          "Impossible de conserver le client.",
      },
      {
        status: 500,
      },
    );

  }

}





export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {

  const { id } = await params;


  try {

    const workspaceContext = await requireWorkspaceContext("write");
    const client = await prisma.client.findFirst({
      where: { id, organizationId: workspaceContext.workspace.id },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
    }


    await prisma.$transaction([


      // Supprimer les interventions du client
      prisma.intervention.deleteMany({

        where: {
          clientId: id,
          organizationId: workspaceContext.workspace.id,
        },

      }),



      // Supprimer les devis du client
      prisma.quote.deleteMany({

        where: {
          clientId: id,
          organizationId: workspaceContext.workspace.id,
        },

      }),



      // Supprimer les factures du client
      prisma.invoice.deleteMany({

        where: {
          clientId: id,
          organizationId: workspaceContext.workspace.id,
        },

      }),



      // Supprimer le client
      prisma.client.deleteMany({

        where: {
          id,
          organizationId: workspaceContext.workspace.id,
        },

      }),


    ]);



    return NextResponse.json({
      success: true,
    });



  } catch (error) {

    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }


    console.error(
      "Erreur suppression client :",
      error,
    );



    return NextResponse.json(
      {
        success: false,
        error:
          "Impossible de supprimer le client",
      },
      {
        status: 500,
      },
    );

  }

}
