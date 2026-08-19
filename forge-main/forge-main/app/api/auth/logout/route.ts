import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";

export async function POST() {
  const cookieStore = await cookies();

  const sessionToken =
    cookieStore.get("forgeSession")?.value;

  if (sessionToken) {
    await prisma.session.deleteMany({
      where: {
        token: sessionToken,
      },
    });
  }

  cookieStore.set("forgeSession", "", {
    httpOnly: true,
    sameSite: "lax",
    secure:
      process.env.NODE_ENV ===
      "production",
    path: "/",
    expires: new Date(0),
  });

  return NextResponse.json({
    success: true,
  });
}