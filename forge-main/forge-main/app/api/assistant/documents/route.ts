import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

type DocumentKind =
  | "quote"
  | "invoice"
  | "invoiceSource";

function normalize(value: string) {
  return value
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getClientName(client: {
  type: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
}) {
  return client.type === "PARTICULIER"
    ? `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()
    : client.companyName ?? "";
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireCurrentUser();
    const body = await request.json();
    const kind: DocumentKind | null =
      body.kind === "quote" ||
      body.kind === "invoice" ||
      body.kind === "invoiceSource"
        ? body.kind
        : null;
    const entity =
      typeof body.entity === "string"
        ? body.entity.trim()
        : "";

    if (!kind) {
      return NextResponse.json(
        { error: "Le type de document est invalide." },
        { status: 400 },
      );
    }

    if (kind === "invoiceSource") {
      if (!entity) {
        return NextResponse.json(
          { error: "Précise le client à facturer." },
          { status: 400 },
        );
      }

      const clients = await prisma.client.findMany({
        where: {
          userId: currentUser.id,
          archived: false,
        },
      });
      const normalizedEntity = normalize(entity);
      const matchingClients = clients.filter((client) =>
        normalize(getClientName(client)).includes(
          normalizedEntity,
        ),
      );

      if (matchingClients.length !== 1) {
        return NextResponse.json(
          {
            error:
              matchingClients.length === 0
                ? `Aucun client ne correspond à « ${entity} ».`
                : "Plusieurs clients correspondent. Précise le nom complet ou l’entreprise.",
          },
          { status: matchingClients.length === 0 ? 404 : 409 },
        );
      }

      const clientId = matchingClients[0].id;
      const intervention =
        await prisma.intervention.findFirst({
          where: {
            clientId,
            status: "TERMINEE",
            invoices: { none: {} },
            OR: [
              { userId: currentUser.id },
              { client: { userId: currentUser.id } },
            ],
          },
          orderBy: { finishedAt: "desc" },
        });

      if (intervention) {
        return NextResponse.json({
          source: {
            source: "intervention",
            sourceId: intervention.id,
          },
        });
      }

      const quote = await prisma.quote.findFirst({
        where: {
          clientId,
          status: { not: "REFUSE" },
          invoices: { none: {} },
          client: { userId: currentUser.id },
        },
        orderBy: { createdAt: "desc" },
      });

      if (quote) {
        return NextResponse.json({
          source: {
            source: "quote",
            sourceId: quote.id,
          },
        });
      }

      return NextResponse.json(
        {
          error:
            "Aucune intervention terminée ni aucun devis disponible ne peut être facturé pour ce client.",
        },
        { status: 404 },
      );
    }

    const documents =
      kind === "quote"
        ? await prisma.quote.findMany({
            where: {
              client: { userId: currentUser.id },
            },
            include: { client: true },
            orderBy: { createdAt: "desc" },
            take: 100,
          })
        : await prisma.invoice.findMany({
            where: {
              client: { userId: currentUser.id },
            },
            include: { client: true },
            orderBy: { createdAt: "desc" },
            take: 100,
          });

    const normalizedEntity = normalize(entity);
    const matches = normalizedEntity
      ? documents.filter((document) => {
          const searchableValues = [
            document.reference,
            document.title,
            getClientName(document.client),
          ];

          return searchableValues.some((value) =>
            normalize(value).includes(normalizedEntity),
          );
        })
      : documents;

    if (matches.length === 0) {
      return NextResponse.json(
        {
          error: `Aucun ${kind === "quote" ? "devis" : "facture"} ne correspond à cette demande. Vérifie le client ou le numéro indiqué.`,
        },
        { status: 404 },
      );
    }

    if (matches.length > 1) {
      return NextResponse.json(
        {
          error: `Plusieurs ${kind === "quote" ? "devis" : "factures"} correspondent. Précise le numéro du document.`,
        },
        { status: 409 },
      );
    }

    const document = matches[0];

    return NextResponse.json({
      document: {
        id: document.id,
        clientId: document.clientId,
        title: document.title,
        description: document.description,
        reference: document.reference,
      },
    });
  } catch (error) {
    console.error("ASSISTANT DOCUMENT RESOLUTION ERROR", error);

    return NextResponse.json(
      {
        error:
          "Impossible de retrouver ce document pour le moment. Réessaie dans quelques instants.",
      },
      { status: 500 },
    );
  }
}
