import { createHash, randomBytes } from "node:crypto";

import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { sendActivationEmail } from "@/src/lib/email";


type RegisterBody = {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  password?: string;
};


function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "").trim();
}



export async function POST(
  request: Request,
) {

  try {

    const body =
      (await request.json()) as RegisterBody;



    const firstName =
      body.firstName?.trim() ?? "";

    const lastName =
      body.lastName?.trim() ?? "";

    const companyName =
      body.companyName?.trim() || null;


    const email =
      body.email?.trim().toLowerCase() ?? "";


    const phone =
      normalizePhone(
        body.phone ?? "",
      );


    const password =
      body.password ?? "";



    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !password
    ) {

      return NextResponse.json(
        {
          error:
            "Toutes les informations sont obligatoires.",
        },
        {
          status: 400,
        },
      );

    }




    if (!email.includes("@")) {

      return NextResponse.json(
        {
          error:
            "L’adresse e-mail semble incorrecte.",
        },
        {
          status: 400,
        },
      );

    }




    if (password.length < 8) {

      return NextResponse.json(
        {
          error:
            "Le mot de passe doit contenir au moins 8 caractères.",
        },
        {
          status: 400,
        },
      );

    }





    const existingUser =
      await prisma.user.findFirst({

        where: {

          OR: [

            {
              email,
            },

            {
              phone,
            },

          ],

        },


        select: {

          email: true,

          phone: true,

        },

      });



    if (existingUser) {

      const message =
        existingUser.email === email
          ? "Cette adresse e-mail est déjà utilisée."
          : "Ce numéro de téléphone est déjà utilisé.";


      return NextResponse.json(
        {
          error: message,
        },
        {
          status: 409,
        },
      );

    }





    const passwordHash =
      await hash(
        password,
        12,
      );




    const user =
      await prisma.user.create({

        data: {

          firstName,

          lastName,

          companyName,

          email,

          phone,

          passwordHash,

            trialEndsAt: new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000,
  ),

  subscriptionStatus: "TRIAL",



        },


        select: {

          id: true,

          firstName: true,

          lastName: true,

          companyName: true,

          email: true,

          phone: true,

          onboardingCompleted: true,

        },

      });





    const activationToken = randomBytes(32).toString("hex");
    const activationTokenHash = createHash("sha256")
      .update(activationToken)
      .digest("hex");
    const activationExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );

    await prisma.accountActivationToken.deleteMany({
      where: { userId: user.id },
    });
    await prisma.accountActivationToken.create({
      data: {
        tokenHash: activationTokenHash,
        expiresAt: activationExpiresAt,
        userId: user.id,
      },
    });

    const appUrl = process.env.APP_URL || new URL(request.url).origin;

    try {
      await sendActivationEmail(
        user.email,
        user.firstName,
        `${appUrl}/activate-account?token=${activationToken}`,
      );
    } catch (error) {
      console.error("Erreur envoi e-mail d’activation :", error);
    }





    return NextResponse.json(
      {
        user,
        activationRequired: true,
      },
      {
        status: 201,
      },
    );



  } catch (error) {


    console.error(
      "Erreur création utilisateur :",
      error,
    );



    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur inconnue",
      },
      {
        status: 500,
      },
    );

  }

}
