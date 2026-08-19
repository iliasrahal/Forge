import { randomBytes } from "node:crypto";

import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";

type LoginBody = {
  identifier?: string;
  password?: string;
};

function normalizePhone(value: string) {
  return value.replace(/\s+/g, "").trim();
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as LoginBody;

    const identifier =
      body.identifier?.trim() ?? "";

    const password = body.password ?? "";

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

    const normalizedIdentifier =
      identifier.toLowerCase();

    const normalizedPhone =
      normalizePhone(identifier);

    const user =
      await prisma.user.findFirst({
        where: {
          OR: [
            {
              email:
                normalizedIdentifier,
            },
            {
              phone: normalizedPhone,
            },
          ],
        },
      });

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

    await prisma.session.create({
      data: {
        token: sessionToken,
        expiresAt:
          sessionExpiresAt,
        userId: user.id,
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

return NextResponse.json({
  user: {
    id: user.id,
    firstName: user.firstName,
    email: user.email,
    phone: user.phone,
    job: user.job,
    workMode: user.workMode,
    age: user.age,
    onboardingCompleted:
      user.onboardingCompleted,
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