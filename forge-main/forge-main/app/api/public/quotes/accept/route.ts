import { NextResponse } from "next/server";

import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import { cleanQuotePublicToken, getQuoteAcceptanceState, hashQuotePublicToken } from "@/src/lib/quote-public-access";
import { buildQuoteSignatureSnapshot, createQuoteIntegrityHash, validateDrawnSignature, validateSignerName } from "@/src/lib/quote-signature";
import { checkRateLimit } from "@/src/lib/rate-limit";

async function findExistingSignature(tokenHash: string) {
  return prisma.quotePublicAccess.findUnique({
    where: { tokenHash },
    select: {
      revokedAt: true,
      quote: { select: { signature: { select: { signerFirstName: true, signerLastName: true, signedAt: true } } } },
    },
  });
}

export async function POST(request: Request) {
  let tokenHash = "";
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > 150_000) {
      return NextResponse.json({ error: "La signature est trop volumineuse." }, { status: 413 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    const token = cleanQuotePublicToken(body.token);
    if (!token) return NextResponse.json({ error: "Ce lien est invalide." }, { status: 404 });

    tokenHash = hashQuotePublicToken(token);
    const limit = checkRateLimit(`quote-sign:${tokenHash}`, 12, 60_000);
    if (!limit.allowed) return NextResponse.json({ error: "Trop de tentatives. Réessayez dans un instant." }, { status: 429 });

    const firstName = validateSignerName(body.firstName, "Le prénom");
    if (firstName.error) return NextResponse.json({ error: firstName.error }, { status: 400 });
    const lastName = validateSignerName(body.lastName, "Le nom");
    if (lastName.error) return NextResponse.json({ error: lastName.error }, { status: 400 });
    if (body.confirmed !== true) return NextResponse.json({ error: "Vous devez confirmer l’acceptation du devis." }, { status: 400 });
    const drawn = validateDrawnSignature(body.signature);
    if (drawn.error) return NextResponse.json({ error: drawn.error }, { status: 400 });

    const result = await prisma.$transaction(async (transaction) => {
      const access = await transaction.quotePublicAccess.findUnique({
        where: { tokenHash },
        include: {
          quote: {
            include: {
              organization: { select: { name: true } },
              client: { select: { type: true, firstName: true, lastName: true, companyName: true, phone: true, email: true, street: true, postalCode: true, city: true } },
              lines: { select: { category: true, label: true, amountCents: true }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
              signature: { select: { signerFirstName: true, signerLastName: true, signedAt: true } },
            },
          },
        },
      });

      if (!access || access.revokedAt) return { kind: "invalid" as const };
      if (access.quote.signature) return { kind: "signed" as const, alreadySigned: true, ...access.quote.signature };

      const state = getQuoteAcceptanceState(access.quote.status);
      if (state.alreadyAccepted) return { kind: "accepted-before-signatures" as const };
      if (!state.canAccept) return { kind: "unavailable" as const, reason: state.reason };

      const signedAt = new Date();
      const snapshot = buildQuoteSignatureSnapshot(access.quote);
      const integrityHash = createQuoteIntegrityHash({ snapshot, signerFirstName: firstName.value!, signerLastName: lastName.value!, signedAt });
      const updated = await transaction.quote.updateMany({
        where: { id: access.quote.id, status: "ENVOYE", signature: { is: null } },
        data: { status: "ACCEPTE", acceptedAt: signedAt, acceptanceMethod: "CLIENT_LINK" },
      });
      if (updated.count !== 1) return { kind: "retry" as const };

      await transaction.quoteSignature.create({
        data: {
          quoteId: access.quote.id,
          publicAccessId: access.id,
          signerFirstName: firstName.value!,
          signerLastName: lastName.value!,
          method: "DRAWN",
          signatureData: drawn.signature as Prisma.InputJsonValue,
          quoteSnapshot: snapshot as unknown as Prisma.InputJsonValue,
          integrityHash,
          signedAt,
        },
      });
      await transaction.quotePublicAccess.update({ where: { id: access.id }, data: { acceptedAt: signedAt } });
      return { kind: "signed" as const, alreadySigned: false, signerFirstName: firstName.value!, signerLastName: lastName.value!, signedAt };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (result.kind === "invalid") return NextResponse.json({ error: "Ce lien est invalide." }, { status: 404 });
    if (result.kind === "accepted-before-signatures") return NextResponse.json({ error: "Ce devis a déjà été accepté." }, { status: 409 });
    if (result.kind === "unavailable") return NextResponse.json({ error: result.reason || "Ce devis ne peut plus être accepté." }, { status: 409 });
    if (result.kind === "retry") throw new Error("QUOTE_SIGNATURE_CONFLICT");
    return NextResponse.json({ signed: true, ...result });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "La demande est invalide." }, { status: 400 });
    }
    const conflict = error instanceof Prisma.PrismaClientKnownRequestError
      ? error.code === "P2002" || error.code === "P2034"
      : error instanceof Error && error.message === "QUOTE_SIGNATURE_CONFLICT";
    if (conflict && tokenHash) {
      const access = await findExistingSignature(tokenHash);
      if (access && !access.revokedAt && access.quote.signature) {
        return NextResponse.json({ signed: true, alreadySigned: true, ...access.quote.signature });
      }
      return NextResponse.json({ error: "Le devis vient d’être mis à jour. Rechargez la page." }, { status: 409 });
    }
    console.error("PUBLIC QUOTE SIGNATURE ERROR", error);
    return NextResponse.json({ error: "Votre signature n’a pas pu être enregistrée." }, { status: 500 });
  }
}
