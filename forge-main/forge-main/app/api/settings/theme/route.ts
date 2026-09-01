import { NextResponse } from "next/server";

import { getCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

const themes = ["light", "dark"] as const;

type Theme = (typeof themes)[number];

function isTheme(value: unknown): value is Theme {
  return themes.includes(value as Theme);
}

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { themePreference: null },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    themePreference: currentUser.themePreference,
  });

  if (isTheme(currentUser.themePreference)) {
    response.cookies.set("forgeTheme", currentUser.themePreference, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour enregistrer ce choix." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as {
    theme?: unknown;
  };

  if (!isTheme(body.theme)) {
    return NextResponse.json(
      { error: "Le thème choisi n’est pas valide." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: currentUser.id },
    data: { themePreference: body.theme },
  });

  const response = NextResponse.json({
    themePreference: body.theme,
  });

  response.cookies.set("forgeTheme", body.theme, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
