import { Prisma } from "@/src/generated/prisma/client";
import type { EffectiveWorkspaceRole } from "@/src/lib/workspace-access";

export const marketplacePublicPostingSelect = {
  id: true,
  title: true,
  trade: true,
  trades: true,
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
  requirements: {
    select: {
      id: true,
      tradeKey: true,
      customTradeName: true,
      requiredCount: true,
      startDate: true,
      endDate: true,
      applications: { where: { status: "ACCEPTED" }, select: { id: true } },
    },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.MarketplaceJobPostingSelect;

export type MarketplacePublicPostingRecord = Prisma.MarketplaceJobPostingGetPayload<{
  select: typeof marketplacePublicPostingSelect;
}>;

export type MarketplacePublicPosting = ReturnType<typeof toMarketplacePublicPosting>;

export type MarketplacePublicPostingFilters = {
  q?: string | null;
  trade?: string | null;
  trades?: string[] | string | null;
  location?: string | null;
  from?: string | null;
  to?: string | null;
};

export const MARKETPLACE_TRADES = [
  "Plombier",
  "Chauffagiste",
  "Électricien",
  "Peintre",
  "Maçon",
  "Menuisier",
  "Carreleur",
  "Couvreur",
  "Plaquiste",
  "Serrurier",
  "Climaticien",
  "Paysagiste",
  "Autre",
] as const;

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
  const selectedTrades = (Array.isArray(filters.trades) ? filters.trades : filters.trades ? [filters.trades] : [])
    .map((value) => value.trim().slice(0, 80))
    .filter(Boolean);
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
      { requirements: { some: { customTradeName: { contains: search, mode: "insensitive" } } } },
    ] } : {}),
    ...(trade ? { trade: { contains: trade, mode: "insensitive" } } : {}),
    ...(selectedTrades.length ? { requirements: { some: { tradeKey: { in: selectedTrades.map((value) => value === "Autre" ? "OTHER" : value) } } } } : {}),
    ...(location ? { location: { contains: location, mode: "insensitive" } } : {}),
    ...(to ? { startDate: { lte: to } } : {}),
  };
}

export function toMarketplacePublicPosting(posting: MarketplacePublicPostingRecord) {
  const acceptedCount = posting.applications.length;
  const requirements = posting.requirements.map((requirement) => {
    const requirementAcceptedCount = requirement.applications.length;
    return {
      id: requirement.id,
      tradeKey: requirement.tradeKey,
      trade: requirement.tradeKey === "OTHER" ? requirement.customTradeName || "Autre" : requirement.tradeKey,
      requiredCount: requirement.requiredCount,
      startDate: requirement.startDate.toISOString().slice(0, 10),
      endDate: requirement.endDate.toISOString().slice(0, 10),
      acceptedCount: requirementAcceptedCount,
      remainingPositions: Math.max(0, requirement.requiredCount - requirementAcceptedCount),
    };
  });
  return {
    id: posting.id,
    title: posting.title,
    trade: posting.trade,
    trades: requirements.length ? requirements.map((requirement) => requirement.trade) : posting.trades.length ? posting.trades : [posting.trade],
    requirements,
    description: posting.publicDescription,
    location: posting.location,
    startDate: posting.startDate.toISOString().slice(0, 10),
    endDate: posting.endDate.toISOString().slice(0, 10),
    positions: posting.positions,
    remainingPositions: requirements.length ? requirements.reduce((total, requirement) => total + requirement.remainingPositions, 0) : Math.max(0, posting.positions - acceptedCount),
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

export function canDeleteMarketplacePosting(input: Parameters<typeof canManageMarketplacePosting>[0] & { canWrite: boolean }) {
  return input.canWrite && canManageMarketplacePosting(input);
}

export function shouldRecordMarketplaceView(input: { isPublisherMember: boolean }) {
  return !input.isPublisherMember;
}

export function parseMarketplaceDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export type MarketplacePostingInput = {
  title: string;
  trade: string;
  trades: string[];
  publicDescription: string;
  location: string;
  startDate: Date;
  endDate: Date;
  positions: number;
  budgetCents: number | null;
  requirements: Array<{
    tradeKey: string;
    customTradeName: string | null;
    requiredCount: number;
    startDate: Date;
    endDate: Date;
  }>;
};

export function parseMarketplacePostingInput(body: Record<string, unknown>): MarketplacePostingInput | null {
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 140) : "";
  const submittedTrades = Array.isArray(body.trades)
    ? body.trades
    : typeof body.trades === "string"
      ? [body.trades]
      : typeof body.trade === "string"
        ? [body.trade]
        : [];
  let trades = [...new Set(submittedTrades
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().slice(0, 80))
    .filter(Boolean))].slice(0, 8);
  let trade = trades[0] ?? "";
  const publicDescription = typeof body.description === "string" ? body.description.trim().slice(0, 2000) : "";
  const location = typeof body.location === "string" ? body.location.trim().slice(0, 120) : "";
  const startDate = parseMarketplaceDate(body.startDate);
  const endDate = parseMarketplaceDate(body.endDate);
  const rawRequirements = Array.isArray(body.requirements) ? body.requirements : [];
  const requirements = rawRequirements.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const value = raw as Record<string, unknown>;
    const rawTradeKey = typeof value.tradeKey === "string" ? value.tradeKey.trim().slice(0, 80) : "";
    const tradeKey = rawTradeKey === "Autre" ? "OTHER" : rawTradeKey;
    const customTradeName = typeof value.customTradeName === "string" ? value.customTradeName.trim().slice(0, 80) : "";
    const requiredCount = Number(value.requiredCount);
    const requirementStartDate = parseMarketplaceDate(value.startDate);
    const requirementEndDate = parseMarketplaceDate(value.endDate);
    if (!tradeKey || (tradeKey === "OTHER" && !customTradeName) || !Number.isInteger(requiredCount) || requiredCount < 1 || requiredCount > 20 || !requirementStartDate || !requirementEndDate) return [];
    return [{ tradeKey, customTradeName: tradeKey === "OTHER" ? customTradeName : null, requiredCount, startDate: requirementStartDate, endDate: requirementEndDate }];
  });
  if (requirements.length) {
    trades = requirements.map((requirement) => requirement.tradeKey === "OTHER" ? requirement.customTradeName || "Autre" : requirement.tradeKey);
    trade = trades[0] ?? "";
  }
  const legacyPositions = Number(body.positions);
  const budget = body.budget === "" || body.budget == null ? null : Number(body.budget);
  if (!title || !trade || !publicDescription || !location || !startDate || !endDate) return null;
  if (endDate < startDate) return null;
  if (rawRequirements.length && requirements.length !== rawRequirements.length) return null;
  if (new Set(requirements.map((requirement) => requirement.tradeKey)).size !== requirements.length) return null;
  const normalizedRequirements = requirements.length ? requirements : [{ tradeKey: trade, customTradeName: null, requiredCount: legacyPositions, startDate, endDate }];
  if (normalizedRequirements.some((requirement) => requirement.startDate < startDate || requirement.endDate > endDate || requirement.endDate < requirement.startDate)) return null;
  const positions = normalizedRequirements.reduce((total, requirement) => total + requirement.requiredCount, 0);
  if (!Number.isInteger(positions) || positions < 1 || positions > 100) return null;
  if (budget !== null && (!Number.isFinite(budget) || budget < 0 || budget > 10_000_000)) return null;
  return {
    title,
    trade,
    trades,
    publicDescription,
    location,
    startDate,
    endDate,
    positions,
    budgetCents: budget === null ? null : Math.round(budget * 100),
    requirements: normalizedRequirements,
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

export function areMarketplaceRequirementsFilled(requirements: Array<{ requiredCount: number; acceptedCount: number }>) {
  return requirements.length > 0 && requirements.every((requirement) => requirement.acceptedCount >= requirement.requiredCount);
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
