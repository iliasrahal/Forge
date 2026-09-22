import { Prisma } from "@/src/generated/prisma/client";
import type { EffectiveWorkspaceRole } from "@/src/lib/workspace-access";

export const marketplacePublicPostingSelect = {
  id: true,
  title: true,
  trade: true,
  publicDescription: true,
  location: true,
  startDate: true,
  endDate: true,
  positions: true,
  budgetCents: true,
  status: true,
  publishedAt: true,
  organizationId: true,
  createdByUserId: true,
  organization: { select: { name: true, legalName: true, type: true } },
  applications: { where: { status: "ACCEPTED" }, select: { id: true } },
} satisfies Prisma.MarketplaceJobPostingSelect;

export type MarketplacePublicPostingRecord = Prisma.MarketplaceJobPostingGetPayload<{
  select: typeof marketplacePublicPostingSelect;
}>;

export type MarketplacePublicPosting = ReturnType<typeof toMarketplacePublicPosting>;

export type MarketplacePublicPostingFilters = {
  q?: string | null;
  trade?: string | null;
  location?: string | null;
  from?: string | null;
  to?: string | null;
};

/**
 * Global Forge catalogue filter. Deliberately contains no organization/workspace
 * predicate: ownership is only relevant to management views and mutations.
 */
export function buildMarketplacePublicPostingWhere(
  filters: MarketplacePublicPostingFilters,
  today = new Date(),
): Prisma.MarketplaceJobPostingWhereInput {
  const search = filters.q?.trim().slice(0, 120) ?? "";
  const trade = filters.trade?.trim().slice(0, 80) ?? "";
  const location = filters.location?.trim().slice(0, 120) ?? "";
  const from = parseMarketplaceDate(filters.from);
  const to = parseMarketplaceDate(filters.to);
  const parisDateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(today);
  const parisDate = Object.fromEntries(parisDateParts.map(({ type, value }) => [type, value]));
  const startOfTodayUtc = new Date(`${parisDate.year}-${parisDate.month}-${parisDate.day}T00:00:00.000Z`);

  return {
    status: "OPEN",
    // An OPEN announcement whose period has ended is no longer available.
    endDate: { gte: from && from > startOfTodayUtc ? from : startOfTodayUtc },
    ...(search ? { OR: [
      { title: { contains: search, mode: "insensitive" } },
      { trade: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
      { publicDescription: { contains: search, mode: "insensitive" } },
    ] } : {}),
    ...(trade ? { trade: { contains: trade, mode: "insensitive" } } : {}),
    ...(location ? { location: { contains: location, mode: "insensitive" } } : {}),
    ...(to ? { startDate: { lte: to } } : {}),
  };
}

export function toMarketplacePublicPosting(posting: MarketplacePublicPostingRecord) {
  const acceptedCount = posting.applications.length;
  return {
    id: posting.id,
    title: posting.title,
    trade: posting.trade,
    description: posting.publicDescription,
    location: posting.location,
    startDate: posting.startDate.toISOString().slice(0, 10),
    endDate: posting.endDate.toISOString().slice(0, 10),
    positions: posting.positions,
    remainingPositions: Math.max(0, posting.positions - acceptedCount),
    budgetCents: posting.budgetCents,
    status: posting.status,
    publishedAt: posting.publishedAt.toISOString(),
    publisher: posting.organization.legalName || posting.organization.name,
  };
}

export function canManageMarketplacePosting(input: {
  postingOrganizationId: string;
  postingCreatedByUserId: string;
  activeOrganizationId: string;
  userId: string;
  role: EffectiveWorkspaceRole;
}) {
  if (input.postingOrganizationId !== input.activeOrganizationId) return false;
  return (
    input.postingCreatedByUserId === input.userId ||
    input.role === "OWNER" ||
    input.role === "ADMIN"
  );
}

export function parseMarketplaceDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export type MarketplacePostingInput = {
  title: string;
  trade: string;
  publicDescription: string;
  location: string;
  startDate: Date;
  endDate: Date;
  positions: number;
  budgetCents: number | null;
};

export function parseMarketplacePostingInput(body: Record<string, unknown>): MarketplacePostingInput | null {
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 140) : "";
  const trade = typeof body.trade === "string" ? body.trade.trim().slice(0, 80) : "";
  const publicDescription = typeof body.description === "string" ? body.description.trim().slice(0, 2000) : "";
  const location = typeof body.location === "string" ? body.location.trim().slice(0, 120) : "";
  const startDate = parseMarketplaceDate(body.startDate);
  const endDate = parseMarketplaceDate(body.endDate);
  const positions = Number(body.positions);
  const budget = body.budget === "" || body.budget == null ? null : Number(body.budget);
  if (!title || !trade || !publicDescription || !location || !startDate || !endDate) return null;
  if (endDate < startDate || !Number.isInteger(positions) || positions < 1 || positions > 20) return null;
  if (budget !== null && (!Number.isFinite(budget) || budget < 0 || budget > 10_000_000)) return null;
  return {
    title,
    trade,
    publicDescription,
    location,
    startDate,
    endDate,
    positions,
    budgetCents: budget === null ? null : Math.round(budget * 100),
  };
}

export function formatMarketplaceStatus(status: string) {
  if (status === "FILLED") return "Complète";
  if (status === "CLOSED") return "Fermée";
  return "Ouverte";
}

export function formatMarketplaceApplicationStatus(status: string) {
  if (status === "ACCEPTED") return "Acceptée";
  if (status === "REJECTED") return "Refusée";
  if (status === "CANCELLED") return "Annulée";
  return "En attente";
}

export function canAcceptMarketplaceApplication(input: {
  postingStatus: string;
  acceptedCount: number;
  positions: number;
}) {
  return input.postingStatus === "OPEN" && input.acceptedCount < input.positions;
}

export type MarketplaceApplicationBlockReason =
  | "OWN_POSTING"
  | "DUPLICATE"
  | "UNAVAILABLE"
  | null;

export function getMarketplaceApplicationBlockReason(input: {
  postingStatus: string;
  acceptedCount: number;
  positions: number;
  isPublisherMember: boolean;
  hasExistingApplication: boolean;
}): MarketplaceApplicationBlockReason {
  if (input.isPublisherMember) return "OWN_POSTING";
  if (input.hasExistingApplication) return "DUPLICATE";
  if (input.postingStatus !== "OPEN" || input.acceptedCount >= input.positions) return "UNAVAILABLE";
  return null;
}
