/**
 * Numérotation des devis / factures / avoirs.
 *
 * Un brouillon porte une référence provisoire (`DRAFT-<uuid>`). Le numéro
 * définitif — séquentiel, sans trou, par organisation / nature / année — est
 * attribué à la finalisation (envoi ou passage à un statut « émis »).
 * Format : <préfixe><année>-<6 chiffres>, ex. `F2026-000042`.
 */

export type DocumentKindValue = "QUOTE" | "INVOICE" | "CREDIT_NOTE";

const DRAFT_PREFIX = "DRAFT-";

export function draftReference(): string {
  const uuid =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${DRAFT_PREFIX}${uuid}`;
}

/**
 * Vrai quand la référence n'est pas encore un numéro définitif : brouillon
 * Forge (`DRAFT-…`) ou ancien identifiant provisoire (`DEV-1730000000000`,
 * `FAC-…`) qui doit être renuméroté à l'envoi.
 */
export function isDraftReference(reference: string): boolean {
  if (reference.startsWith(DRAFT_PREFIX)) return true;
  return /^(DEV|FAC|FA|DEVIS|FACTURE)-\d{10,}$/i.test(reference);
}

export function formatDocumentNumber(
  prefix: string,
  year: number,
  n: number,
): string {
  return `${prefix}${year}-${String(n).padStart(6, "0")}`;
}

/** Référence lisible : « Brouillon » tant qu'aucun numéro n'est attribué. */
export function displayDocumentReference(reference: string): string {
  return isDraftReference(reference) ? "Brouillon" : reference;
}

// Adaptateur minimal : un client Prisma (ou une transaction) exposant le
// modèle DocumentCounter. Volontairement lâche pour accepter le vrai client.
type PrismaLikeCounterClient = {
  documentCounter: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upsert: (args: any) => Promise<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (args: any) => Promise<{ nextNumber: number }>;
  };
};

/**
 * Réserve et renvoie le prochain numéro pour (organisation, nature, année).
 * À appeler dans une transaction : l'incrément est atomique.
 */
export async function allocateDocumentNumber(
  client: PrismaLikeCounterClient,
  params: {
    organizationId: string;
    kind: DocumentKindValue;
    prefix: string;
    now?: Date;
  },
): Promise<{ number: number; year: number; reference: string }> {
  const year = (params.now ?? new Date()).getFullYear();
  const where = {
    organizationId_kind_year: {
      organizationId: params.organizationId,
      kind: params.kind,
      year,
    },
  };

  await client.documentCounter.upsert({
    where,
    create: {
      organizationId: params.organizationId,
      kind: params.kind,
      year,
      nextNumber: 1,
    },
    update: {},
  });

  const updated = await client.documentCounter.update({
    where,
    data: { nextNumber: { increment: 1 } },
  });
  const number = updated.nextNumber - 1;

  return {
    number,
    year,
    reference: formatDocumentNumber(params.prefix, year, number),
  };
}
