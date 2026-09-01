import { randomBytes } from "node:crypto";

import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { normalizeEmail } from "@/src/lib/email-normalization";
import { getPhoneSearchVariants } from "@/src/lib/phone";
import { getSubscriptionAccessForUser } from "@/src/lib/subscription-access";
import { ensurePersonalWorkspaceForUser } from "@/src/lib/workspace-access";
import {
  acceptTeamInvitation,
  TeamInvitationError,
} from "@/src/lib/team-invitations";

type LoginBody = {
  identifier?: string;
  password?: string;
  invitationToken?: string;
};

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as LoginBody;

    const identifier =
      body.identifier?.trim() ?? "";

    const password = body.password ?? "";
    const invitationToken = body.invitationToken?.trim() ?? "";

    if (!identifier || !password) {
      return NextResponse.json(
        {
          error:
            "Renseigne ton e-mail ou ton téléphone et ton mot de passe.",
        },
        {
          status: 400,
        },
      );
    }

    const isEmail = identifier.includes("@");
    const users = await prisma.user.findMany({
      where: isEmail
        ? {
            email: {
              equals: normalizeEmail(identifier),
              mode: "insensitive",
            },
          }
        : { phone: { in: getPhoneSearchVariants(identifier) } },
      take: 2,
    });
    const user = users.length === 1 ? users[0] : null;

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Identifiants incorrects.",
        },
        {
          status: 401,
        },
      );
    }

    if (!user.emailVerifiedAt) {
      return NextResponse.json(
        {
          error:
            "Active ton compte depuis l’e-mail reçu avant de te connecter.",
        },
        {
          status: 403,
        },
      );
    }

    const passwordIsValid =
      await compare(
        password,
        user.passwordHash,
      );

    if (!passwordIsValid) {
      return NextResponse.json(
        {
          error:
            "Identifiants incorrects.",
        },
        {
          status: 401,
        },
      );
    }

    await prisma.session.deleteMany({
      where: {
        userId: user.id,
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    const sessionToken =
      randomBytes(32).toString("hex");

    const sessionExpiresAt =
      new Date();

    sessionExpiresAt.setDate(
      sessionExpiresAt.getDate() + 30,
    );

    const personalWorkspace = await ensurePersonalWorkspaceForUser(user.id);
    const invitationResult = invitationToken
      ? await acceptTeamInvitation({
          token: invitationToken,
          userId: user.id,
          userEmail: user.email,
        })
      : null;

    await prisma.session.create({
      data: {
        token: sessionToken,
        expiresAt:
          sessionExpiresAt,
        userId: user.id,
        activeOrganizationId:
          invitationResult?.workspaceId ?? personalWorkspace.id,
      },
    });

    const cookieStore =
      await cookies();

    cookieStore.set(
      "forgeSession",
      sessionToken,
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV ===
          "production",
        path: "/",
        expires: sessionExpiresAt,
      },
    );

    const subscriptionAccess =
      await getSubscriptionAccessForUser(user.id);

return NextResponse.json({
  subscriptionRequired: !subscriptionAccess.hasAccess,
  invitation: invitationResult,
  user: {
    id: user.id,
    firstName: user.firstName,
    email: user.email,
    phone: user.phone,
    job: user.job,
    workMode: user.workMode,
    onboardingCompleted:
      user.onboardingCompleted,
    themePreference:
      user.themePreference,
  },
});
  } catch (error) {
    if (error instanceof TeamInvitationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    console.error(
      "Erreur connexion :",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Impossible de se connecter.",
      },
      {
        status: 500,
      },
    );
  }
}
