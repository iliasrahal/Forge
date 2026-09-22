import { NextResponse } from "next/server";

import { marketplacePublicPostingSelect, parseMarketplacePostingInput, toMarketplacePublicPosting } from "@/src/lib/marketplace";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limit";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

export async function GET(request: Request) {
  try {
    await requireWorkspaceContext("read");
    const params = new URL(request.url).searchParams;
    const search = params.get("q")?.trim().slice(0, 120) ?? "";
    const trade = params.get("trade")?.trim().slice(0, 80) ?? "";
    const location = params.get("location")?.trim().slice(0, 120) ?? "";
    const from = params.get("from");
    const to = params.get("to");
    const page = Math.max(1, Math.min(100, Number(params.get("page")) || 1));
    const take = 24;
    const postings = await prisma.marketplaceJobPosting.findMany({
      where: {
        status: "OPEN",
        ...(search ? { OR: [
          { title: { contains: search, mode: "insensitive" } },
          { trade: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
          { publicDescription: { contains: search, mode: "insensitive" } },
        ] } : {}),
        ...(trade ? { trade: { contains: trade, mode: "insensitive" } } : {}),
        ...(location ? { location: { contains: location, mode: "insensitive" } } : {}),
        ...(from ? { endDate: { gte: new Date(`${from}T00:00:00.000Z`) } } : {}),
        ...(to ? { startDate: { lte: new Date(`${to}T00:00:00.000Z`) } } : {}),
      },
      select: marketplacePublicPostingSelect,
      orderBy: [{ startDate: "asc" }, { publishedAt: "desc" }],
      skip: (page - 1) * take,
      take: take + 1,
    });
    return NextResponse.json({
      postings: postings.slice(0, take).map(toMarketplacePublicPosting),
      hasMore: postings.length > take,
      page,
    });
  } catch (error) {
    const access = getWorkspaceErrorResponse(error);
    if (access) return NextResponse.json(access.body, { status: access.status });
    return NextResponse.json({ error: "Impossible de charger les chantiers disponibles." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireWorkspaceContext("write");
    const limit = checkRateLimit(`marketplace:publish:${context.user.id}`, 10, 60 * 60 * 1000);
    if (!limit.allowed) return NextResponse.json({ error: "Trop de publications. Réessaie plus tard." }, { status: 429 });
    const body = await request.json() as Record<string, unknown>;
    const input = parseMarketplacePostingInput(body);
    if (!input) return NextResponse.json({ error: "Vérifie les informations du chantier." }, { status: 400 });
    const posting = await prisma.marketplaceJobPosting.create({
      data: {
        organizationId: context.workspace.id,
        createdByUserId: context.user.id,
        ...input,
      },
      select: { id: true },
    });
    return NextResponse.json({ posting }, { status: 201 });
  } catch (error) {
    const access = getWorkspaceErrorResponse(error);
    if (access) return NextResponse.json(access.body, { status: access.status });
    return NextResponse.json({ error: "Impossible de publier ce chantier." }, { status: 500 });
  }
}
