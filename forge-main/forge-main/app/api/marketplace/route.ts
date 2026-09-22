import { NextResponse } from "next/server";

import { buildMarketplacePublicPostingWhere, marketplacePublicPostingSelect, parseMarketplacePostingInput, toMarketplacePublicPosting } from "@/src/lib/marketplace";
import { prisma } from "@/src/lib/prisma";
import { checkRateLimit } from "@/src/lib/rate-limit";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

export async function GET(request: Request) {
  try {
    await requireWorkspaceContext("read");
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Math.min(100, Number(params.get("page")) || 1));
    const take = 24;
    const postings = await prisma.marketplaceJobPosting.findMany({
      where: buildMarketplacePublicPostingWhere({
        q: params.get("q"),
        trades: params.getAll("trade"),
        location: params.get("location"),
        from: params.get("from"),
        to: params.get("to"),
      }),
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
