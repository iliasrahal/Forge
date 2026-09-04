import assert from "node:assert/strict";
import test from "node:test";

import {
  allocateDocumentNumber,
  draftReference,
  formatDocumentNumber,
  isDraftReference,
} from "./document-numbering";

test("format : préfixe + année + 6 chiffres", () => {
  assert.equal(formatDocumentNumber("F", 2026, 42), "F2026-000042");
  assert.equal(formatDocumentNumber("D", 2026, 1), "D2026-000001");
  assert.equal(formatDocumentNumber("AV", 2027, 1234567), "AV2027-1234567");
});

test("draftReference est reconnue comme provisoire", () => {
  assert.equal(isDraftReference(draftReference()), true);
});

test("les anciens identifiants provisoires sont renumérotés à l'envoi", () => {
  assert.equal(isDraftReference("DEV-1730000000000"), true);
  assert.equal(isDraftReference("FAC-1730000000000"), true);
  assert.equal(isDraftReference("FA-1730000000000"), true);
});

test("un numéro définitif n'est pas provisoire", () => {
  assert.equal(isDraftReference("F2026-000042"), false);
  assert.equal(isDraftReference("D2026-000001"), false);
});

test("allocateDocumentNumber : séquence 1, 2, 3 sans trou", async () => {
  // Compteur en mémoire simulant Prisma.
  const store = new Map<string, number>();
  const key = (o: string, k: string, y: number) => `${o}|${k}|${y}`;
  const client = {
    documentCounter: {
      async upsert(args: {
        where: { organizationId_kind_year: { organizationId: string; kind: string; year: number } };
        create: { nextNumber: number };
      }) {
        const w = args.where.organizationId_kind_year;
        const k = key(w.organizationId, w.kind, w.year);
        if (!store.has(k)) store.set(k, args.create.nextNumber);
      },
      async update(args: {
        where: { organizationId_kind_year: { organizationId: string; kind: string; year: number } };
        data: { nextNumber: { increment: number } };
      }) {
        const w = args.where.organizationId_kind_year;
        const k = key(w.organizationId, w.kind, w.year);
        const next = (store.get(k) ?? 1) + args.data.nextNumber.increment;
        store.set(k, next);
        return { nextNumber: next };
      },
    },
  };

  const now = new Date("2026-05-01T10:00:00Z");
  const a = await allocateDocumentNumber(client, {
    organizationId: "org1",
    kind: "INVOICE",
    prefix: "F",
    now,
  });
  const b = await allocateDocumentNumber(client, {
    organizationId: "org1",
    kind: "INVOICE",
    prefix: "F",
    now,
  });
  const c = await allocateDocumentNumber(client, {
    organizationId: "org1",
    kind: "INVOICE",
    prefix: "F",
    now,
  });

  assert.deepEqual(
    [a.reference, b.reference, c.reference],
    ["F2026-000001", "F2026-000002", "F2026-000003"],
  );

  // Nature différente => compteur indépendant.
  const quote = await allocateDocumentNumber(client, {
    organizationId: "org1",
    kind: "QUOTE",
    prefix: "D",
    now,
  });
  assert.equal(quote.reference, "D2026-000001");
});
