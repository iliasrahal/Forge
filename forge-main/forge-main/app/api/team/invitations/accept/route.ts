import { NextResponse } from "next/server";

import {
  acceptTeamInvitation,
  TeamInvitationError,
} from "@/src/lib/team-invitations";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";

export async function POST(request: Request) {
  try {
    const context = await requireWorkspaceContext("read");
    const body = (await request.json()) as { token?: string };
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json(
        { error: "Cette invitation est invalide." },
        { status: 400 },
      );
    }

    const result = await acceptTeamInvitation({
      token,
      userId: context.user.id,
      userEmail: context.user.email,
      sessionId: context.session.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TeamInvitationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, {
        status: accessError.status,
      });
    }

    console.error("Erreur acceptation invitation :", error);
    return NextResponse.json(
      { error: "Impossible d’accepter l’invitation." },
      { status: 500 },
    );
  }
}
