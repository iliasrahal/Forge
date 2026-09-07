import { Prisma } from "@/src/generated/prisma/client";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/src/lib/auth";
import { normalizeEmail } from "@/src/lib/email-normalization";
import { normalizePhone } from "@/src/lib/phone";
import { prisma } from "@/src/lib/prisma";

type ProfileBody = {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  phone?: unknown;
  companyName?: unknown;
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Tu dois être connecté pour modifier ton compte." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as ProfileBody;
    const firstName = cleanString(body.firstName);
    const lastName = cleanString(body.lastName);
    const companyName = cleanString(body.companyName);
    const email = normalizeEmail(cleanString(body.email));
    const phone = normalizePhone(cleanString(body.phone));

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: "Le prénom, le nom, l’e-mail et le téléphone sont obligatoires." },
        { status: 400 },
      );
    }
    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "L’adresse e-mail semble incorrecte." },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        id: { not: currentUser.id },
        OR: [{ email }, { phone }],
      },
      select: { email: true },
    });
    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.email === email
              ? "Cette adresse e-mail est déjà utilisée."
              : "Ce numéro de téléphone est déjà utilisé.",
        },
        { status: 409 },
      );
    }

    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        firstName,
        lastName: lastName || null,
        companyName: companyName || null,
        email,
        phone,
      },
      select: {
        firstName: true,
        lastName: true,
        companyName: true,
        email: true,
        phone: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Cette adresse e-mail ou ce téléphone est déjà utilisé." },
        { status: 409 },
      );
    }

    console.error("UPDATE PROFILE ERROR", error);
    return NextResponse.json(
      { error: "Impossible d’enregistrer les informations." },
      { status: 500 },
    );
  }
}
