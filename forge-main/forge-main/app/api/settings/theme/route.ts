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

  return NextResponse.json({
    themePreference: currentUser.themePreference,
  });
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

  return NextResponse.json({
    themePreference: body.theme,
  });
}
