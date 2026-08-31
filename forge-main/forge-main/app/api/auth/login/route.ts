import { createHash, randomBytes } from "node:crypto";

import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { getPhoneSearchVariants } from "@/src/lib/phone";
import { getSubscriptionAccessForUser } from "@/src/lib/subscription-access";
import { ensurePersonalWorkspaceForUser } from "@/src/lib/workspace-access";

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
        ? { email: identifier.toLowerCase() }
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

    if (invitationToken) {
      const invitation = await prisma.teamInvitation.findUnique({
        where: {
          tokenHash: createHash("sha256")
            .update(invitationToken)
            .digest("hex"),
        },
        select: {
          email: true,
          expiresAt: true,
          status: true,
        },
      });

      if (!invitation || invitation.status === "REVOKED") {
        return NextResponse.json(
          { error: "Le lien d’invitation est invalide." },
          { status: 400 },
        );
      }

      if (invitation.expiresAt <= new Date()) {
        return NextResponse.json(
          { error: "Cette invitation a expiré." },
          { status: 410 },
        );
      }

      if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
        return NextResponse.json(
          {
            error:
              "Cette invitation a été envoyée à une autre adresse e-mail.",
          },
          { status: 403 },
        );
      }
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

    await prisma.session.create({
      data: {
        token: sessionToken,
        expiresAt:
          sessionExpiresAt,
        userId: user.id,
        activeOrganizationId: personalWorkspace.id,
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
