import { NextResponse } from "next/server";

import { getCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour enregistrer ce choix." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as { enabled?: unknown };

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json(
      { error: "Le réglage choisi n’est pas valide." },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id: currentUser.id },
    data: { smartRemindersEnabled: body.enabled },
    select: { smartRemindersEnabled: true },
  });

  return NextResponse.json(user);
}
