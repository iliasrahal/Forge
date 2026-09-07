import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireCurrentUser } from "@/src/lib/auth";
import {
  allocateAvailableDocumentNumber,
  isDraftReference,
} from "@/src/lib/document-numbering";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";
import { sendInvoiceEmail } from "@/src/lib/email";
import {
  createInvoicePublicToken,
  hashInvoicePublicToken,
} from "@/src/lib/invoice-public-access";
import {
  buildInvoiceDescriptionSections,
  parseInvoiceDescriptionSections,
} from "@/src/lib/invoiceDescription";
import { resolveClientEmail } from "@/src/lib/client-email";

async function ensureInvoiceReference(params: {
  invoiceId: string;
  organizationId: string;
  prefix: string;
}) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Sérialise les doubles clics et les nouvelles tentatives concernant
        // cette facture. La seconde requête relira la référence définitive.
        await tx.$queryRaw`
          SELECT "id"
          FROM "Invoice"
          WHERE "id" = ${params.invoiceId}
          FOR UPDATE
        `;

        const currentInvoice = await tx.invoice.findFirst({
          where: {
            id: params.invoiceId,
            organizationId: params.organizationId,
          },
          select: { reference: true },
        });

        if (!currentInvoice) {
          throw new Error("Facture introuvable pendant la numérotation.");
        }

        if (!isDraftReference(currentInvoice.reference)) {
          return currentInvoice.reference;
        }

        const allocated = await allocateAvailableDocumentNumber(tx, {
          organizationId: params.organizationId,
          kind: "INVOICE",
          prefix: params.prefix,
          referenceExists: async (reference) =>
            Boolean(
              await tx.invoice.findUnique({
                where: { reference },
                select: { id: true },
              }),
            ),
        });

        const updatedInvoice = await tx.invoice.update({
          where: { id: params.invoiceId },
          data: { reference: allocated.reference },
          select: { reference: true },
        });

        return updatedInvoice.reference;
      });
    } catch (error) {
      // Une autre organisation peut réserver le même candidat entre notre
      // vérification et l'UPDATE. La contrainte UNIQUE reste l'ultime garde-fou.
      if ((error as { code?: string }).code === "P2002" && attempt < 2) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Impossible d’attribuer un numéro unique à la facture.");
}


export async function POST(
  request: Request,
) {

  try {

    const currentUser =
      await requireCurrentUser();
    const workspaceContext = await requireWorkspaceContext("write");


    const body =
      await request.json();


    const {
      invoiceId,
      email: explicitEmail,
    } = body;



    if (!invoiceId) {

      return NextResponse.json(
        {
          error: "invoice_missing",
        },
        {
          status: 400,
        },
      );

    }



    const invoice =
      await prisma.invoice.findFirst({

        where: {

          id: invoiceId,

          organizationId: workspaceContext.workspace.id,

        },

        include: {
          client: true,
          intervention: true,
        },

      });



    if (!invoice) {

      return NextResponse.json(
        {
          error: "Facture introuvable",
        },
        {
          status: 404,
        },
      );

    }



    if (
      invoice.client.organizationId !==
      workspaceContext.workspace.id
    ) {

      return NextResponse.json(
        {
          error: "Facture introuvable",
        },
        {
          status: 404,
        },
      );

    }

    const recipientEmail = resolveClientEmail({
      explicitEmail,
      clientEmail: invoice.client.email,
    });

    if (!recipientEmail) {

      return NextResponse.json(
        {
          error: "email_missing",
        },
        {
          status: 400,
        },
      );

    }



    // Numéro définitif de facture attribué à la première émission (avant le PDF).
    if (isDraftReference(invoice.reference)) {
      invoice.reference = await ensureInvoiceReference({
        invoiceId: invoice.id,
        organizationId: workspaceContext.workspace.id,
        prefix: workspaceContext.workspace.invoicePrefix,
      });
    }



    /*
      Génération du PDF facture
    */

    const origin =
      new URL(request.url).origin;


    const pdfResponse =
      await fetch(
        `${origin}/api/invoices/${invoice.id}/pdf`,
        {
          headers: {
            cookie:
              request.headers.get("cookie") ?? "",
          },
        },
      );



    if (!pdfResponse.ok) {

      throw new Error(
        "Impossible de générer le PDF facture",
      );

    }



    const pdfBuffer =
      Buffer.from(
        await pdfResponse.arrayBuffer(),
      );



    const clientName =
      invoice.client.type === "PARTICULIER"
        ? invoice.client.firstName?.trim() ||
          `${invoice.client.firstName ?? ""} ${
            invoice.client.lastName ?? ""
          }`.trim() ||
          "Madame, Monsieur"
        : invoice.client.companyName?.trim() ||
          "Madame, Monsieur";

    const artisanSignature =
      currentUser.emailSignature?.trim() ||
      currentUser.firstName?.trim() ||
      "L'équipe Forge";

    const generatedInterventionSections =
      invoice.intervention
        ? buildInvoiceDescriptionSections(
            invoice.intervention,
          )
        : parseInvoiceDescriptionSections(
            invoice.description?.trim() ||
              invoice.title.trim(),
          );
    const interventionSections =
      generatedInterventionSections.length > 0
        ? generatedInterventionSections
        : parseInvoiceDescriptionSections(
            invoice.title,
          );



    // Lien de paiement en ligne : uniquement si l'organisation a activé
    // Stripe Connect et dispose d'un abonnement actif.
    let paymentUrl: string | null = null;
    let publicAccessId: string | null = null;
    if (
      workspaceContext.workspace.stripeChargesEnabled &&
      workspaceContext.subscription.hasAccess
    ) {
      const rawPublicToken = createInvoicePublicToken();
      const publicAccess = await prisma.invoicePublicAccess.create({
        data: {
          invoiceId: invoice.id,
          tokenHash: hashInvoicePublicToken(rawPublicToken),
        },
        select: { id: true },
      });
      publicAccessId = publicAccess.id;
      paymentUrl = `${origin}/facture/${rawPublicToken}`;
    }

    try {
      await sendInvoiceEmail(
        recipientEmail,
        clientName,
        artisanSignature,
        invoice.reference,
        interventionSections,
        pdfBuffer,
        `facture-${invoice.reference}.pdf`,
        paymentUrl,
      );
    } catch (emailError) {
      if (publicAccessId) {
        await prisma.invoicePublicAccess.delete({
          where: { id: publicAccessId },
        });
      }
      throw emailError;
    }

    if (publicAccessId) {
      await prisma.invoicePublicAccess.updateMany({
        where: {
          invoiceId: invoice.id,
          id: { not: publicAccessId },
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }



    await prisma.invoice.update({

      where: {
        id: invoice.id,
      },

      data: {
        status: "ENVOYEE",
      },

    });



    return NextResponse.json({

      success: true,

      message:
        "Facture envoyée avec succès",

    });



  } catch (error) {

    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });


    console.error(
      "SEND INVOICE ERROR",
      error,
    );


    return NextResponse.json(
      {
        error: "Impossible d’envoyer la facture pour le moment. Réessayez.",
      },
      {
        status: 500,
      },
    );

  }

}
