import { randomBytes } from "node:crypto";

import { hash } from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";


type RegisterBody = {
  firstName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  password?: string;
};


function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "").trim();
}



function parseBirthDate(value: string) {

  const cleanValue =
    value.trim();


  let date: Date;


  // Format JJ/MM/AAAA
  if (cleanValue.includes("/")) {

    const parts =
      cleanValue.split("/");


    if (parts.length !== 3) {
      return new Date("invalid");
    }


    const day =
      Number(parts[0]);

    const month =
      Number(parts[1]);

    const year =
      Number(parts[2]);


    date = new Date(
      year,
      month - 1,
      day,
    );


    // Vérification que la date existe
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return new Date("invalid");
    }


    return date;
  }


  // Format ISO AAAA-MM-JJ
  date = new Date(cleanValue);


  return date;
}




export async function POST(
  request: Request,
) {

  try {

    const body =
      (await request.json()) as RegisterBody;



    const firstName =
      body.firstName?.trim() ?? "";


    const email =
      body.email?.trim().toLowerCase() ?? "";


    const phone =
      normalizePhone(
        body.phone ?? "",
      );


    const birthDate =
      body.birthDate ?? "";


    const password =
      body.password ?? "";



    if (
      !firstName ||
      !email ||
      !phone ||
      !birthDate ||
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




    const parsedBirthDate =
      parseBirthDate(
        birthDate,
      );



    if (
      Number.isNaN(
        parsedBirthDate.getTime(),
      )
    ) {

      return NextResponse.json(
        {
          error:
            "La date de naissance est invalide.",
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




    const sessionToken =
      randomBytes(
        32,
      ).toString("hex");




    const sessionExpiresAt =
      new Date();


    sessionExpiresAt.setDate(
      sessionExpiresAt.getDate() + 30,
    );





    const user =
      await prisma.user.create({

        data: {

          firstName,

          email,

          phone,

          birthDate:
            parsedBirthDate,

          passwordHash,

            trialEndsAt: new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000,
  ),

  subscriptionStatus: "TRIAL",



          sessions: {

            create: {

              token:
                sessionToken,

              expiresAt:
                sessionExpiresAt,

            },

          },

        },


        select: {

          id: true,

          firstName: true,

          email: true,

          phone: true,

          birthDate: true,

          onboardingCompleted: true,

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

        expires:
          sessionExpiresAt,

      },
    );





    return NextResponse.json(
      {
        user,
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