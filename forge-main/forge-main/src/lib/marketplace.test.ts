import assert from "node:assert/strict";
import test from "node:test";

import { MarketplaceJobStatus, OrganizationType } from "@/src/generated/prisma/client";
import { buildMarketplacePublicPostingWhere, canAcceptMarketplaceApplication, canManageMarketplacePosting, getMarketplaceApplicationBlockReason, parseMarketplacePostingInput, toMarketplacePublicPosting, type MarketplacePublicPostingRecord } from "./marketplace";

test("valide un formulaire minimal et convertit le budget en centimes", () => {
  const result = parseMarketplacePostingInput({
    title: "Renfort plomberie",
    trade: "Plombier",
    description: "Remplacement d’un réseau sanitaire.",
    location: "Saint-Denis",
    startDate: "2026-10-12",
    endDate: "2026-10-15",
    positions: 2,
    budget: "450.50",
  });
  assert.equal(result?.budgetCents, 45050);
  assert.equal(result?.positions, 2);
});

test("refuse une acceptation au-delà de la dernière place", () => {
  assert.equal(canAcceptMarketplaceApplication({ postingStatus: "OPEN", acceptedCount: 1, positions: 1 }), false);
  assert.equal(canAcceptMarketplaceApplication({ postingStatus: "OPEN", acceptedCount: 0, positions: 1 }), true);
});

test("bloque sa propre annonce, un doublon, une annonce fermée ou complète", () => {
  const base = { postingStatus: "OPEN", acceptedCount: 0, positions: 1, isPublisherMember: false, hasExistingApplication: false };
  assert.equal(getMarketplaceApplicationBlockReason({ ...base, isPublisherMember: true }), "OWN_POSTING");
  assert.equal(getMarketplaceApplicationBlockReason({ ...base, hasExistingApplication: true }), "DUPLICATE");
  assert.equal(getMarketplaceApplicationBlockReason({ ...base, postingStatus: "CLOSED" }), "UNAVAILABLE");
  assert.equal(getMarketplaceApplicationBlockReason({ ...base, acceptedCount: 1 }), "UNAVAILABLE");
  assert.equal(getMarketplaceApplicationBlockReason(base), null);
});

test("le DTO public ne sérialise aucune donnée privée", () => {
  const record: MarketplacePublicPostingRecord = {
    id: "posting",
    title: "Renfort",
    trade: "Plombier",
    publicDescription: "Description publique",
    location: "Paris 12e",
    startDate: new Date("2026-10-12T00:00:00Z"),
    endDate: new Date("2026-10-15T00:00:00Z"),
    positions: 2,
    budgetCents: null,
    status: MarketplaceJobStatus.OPEN,
    publishedAt: new Date("2026-09-22T00:00:00Z"),
    organizationId: "organization",
    createdByUserId: "user",
    organization: { name: "Équipe Martin", legalName: "Martin SARL", type: OrganizationType.TEAM },
    applications: [{ id: "accepted" }],
  };
  const result = toMarketplacePublicPosting(record);
  assert.equal(result.publisher, "Martin SARL");
  assert.equal(result.remainingPositions, 1);
  assert.equal("email" in result, false);
  assert.equal("phone" in result, false);
  assert.equal("organizationId" in result, false);
  assert.equal("createdByUserId" in result, false);
});

test("refuse une période inversée et un nombre de places invalide", () => {
  assert.equal(parseMarketplacePostingInput({ title: "x", trade: "x", description: "x", location: "x", startDate: "2026-10-15", endDate: "2026-10-12", positions: 0 }), null);
});

test("limite la gestion au workspace éditeur et à son auteur ou ses responsables", () => {
  assert.equal(canManageMarketplacePosting({ postingOrganizationId: "team", postingCreatedByUserId: "author", activeOrganizationId: "team", userId: "author", role: "READ_ONLY" }), true);
  assert.equal(canManageMarketplacePosting({ postingOrganizationId: "team", postingCreatedByUserId: "author", activeOrganizationId: "team", userId: "admin", role: "ADMIN" }), true);
  assert.equal(canManageMarketplacePosting({ postingOrganizationId: "other", postingCreatedByUserId: "author", activeOrganizationId: "team", userId: "author", role: "OWNER" }), false);
});

test("le catalogue public est global et ne contient aucun filtre workspace", () => {
  const where = buildMarketplacePublicPostingWhere(
    { q: "plombier", location: "Paris" },
    new Date("2026-09-21T22:30:00.000Z"),
  );
  const serialized = JSON.stringify(where);

  assert.equal(where.status, "OPEN");
  assert.equal(serialized.includes("organizationId"), false);
  assert.equal(serialized.includes("activeOrganizationId"), false);
  assert.equal(serialized.includes("workspace"), false);
  assert.deepEqual(where.endDate, { gte: new Date("2026-09-22T00:00:00.000Z") });
});

test("les filtres du catalogue global couvrent texte, métier, zone et période", () => {
  const where = buildMarketplacePublicPostingWhere(
    { q: "chauffage", trade: "plombier", location: "Saint-Denis", from: "2026-10-12", to: "2026-10-15" },
    new Date("2026-09-22T00:00:00.000Z"),
  );

  assert.equal(where.OR?.length, 4);
  assert.deepEqual(where.trade, { contains: "plombier", mode: "insensitive" });
  assert.deepEqual(where.location, { contains: "Saint-Denis", mode: "insensitive" });
  assert.deepEqual(where.endDate, { gte: new Date("2026-10-12T00:00:00.000Z") });
  assert.deepEqual(where.startDate, { lte: new Date("2026-10-15T00:00:00.000Z") });
});
