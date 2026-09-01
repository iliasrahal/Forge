import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { sendTeamInvitationEmail } from "@/src/lib/email";
import { normalizeEmail } from "@/src/lib/email-normalization";
import { prisma } from "@/src/lib/prisma";
import { teamMemberLimit } from "@/src/lib/team-access";
import { TEAM_INVITATION_TTL_MS } from "@/src/lib/team-invitations";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";

type InvitationBody = {
  emails?: string[];
  role?: "ADMIN" | "READ_ONLY";
};

export async function POST(request: Request) {
  try {
    const context = await requireWorkspaceContext("manageTeam");
    if (context.workspace.type !== "TEAM") {
      return NextResponse.json({ error: "Active d’abord un espace d’équipe." }, { status: 409 });
    }

    const body = (await request.json()) as InvitationBody;
    const role = body.role === "ADMIN" ? "ADMIN" : "READ_ONLY";
    const emails = [
      ...new Set(
        (body.emails ?? []).map((email) =>
          normalizeEmail(email),
        ),
      ),
    ].filter(
      (email) =>
        email.includes("@") &&
        email !== normalizeEmail(context.user.email),
    );

    if (emails.length === 0) {
      return NextResponse.json(
        { error: "Ajoute au moins une adresse e-mail valide." },
        { status: 400 },
      );
    }

    // Plafond de membres (illimité si le propriétaire est Pro).
    const limit = teamMemberLimit(context.user.subscriptionStatus);
    if (Number.isFinite(limit)) {
      const [memberCount, pendingCount] = await Promise.all([
        prisma.organizationMember.count({
          where: { organizationId: context.workspace.id },
        }),
        prisma.teamInvitation.count({
          where: {
            organizationId: context.workspace.id,
            status: "PENDING",
            expiresAt: { gt: new Date() },
          },
        }),
      ]);

      if (memberCount + pendingCount + emails.length > limit) {
        return NextResponse.json(
          {
            error: `Une équipe est limitée à ${limit} personnes (abonnement Standard). Passe au Pro (49,99 €) pour une équipe plus grande.`,
            code: "TEAM_MEMBER_LIMIT",
          },
          { status: 403 },
        );
      }
    }

    const appUrl = (
      process.env.APP_URL || new URL(request.url).origin
    ).replace(/\/$/, "");

    await Promise.all(
      emails.map(async (email) => {
        const rawToken = randomBytes(32).toString("hex");
        const tokenHash = createHash("sha256")
          .update(rawToken)
          .digest("hex");

        await prisma.teamInvitation.create({
          data: {
            email,
            role,
            tokenHash,
            expiresAt: new Date(Date.now() + TEAM_INVITATION_TTL_MS),
            organizationId: context.workspace.id,
            invitedById: context.user.id,
          },
        });

        await sendTeamInvitationEmail(
          email,
          context.workspace.name,
          `${appUrl}/invite?token=${rawToken}`,
        );
      }),
    );

    return NextResponse.json({ count: emails.length });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("Erreur invitations équipe :", error);
    return NextResponse.json(
      { error: "Impossible d’envoyer les invitations. Réessaie dans un instant." },
      { status: 500 },
    );
  }
}
