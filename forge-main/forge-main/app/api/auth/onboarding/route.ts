import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { createTrialPeriod } from "@/src/lib/subscription-access";


type UserJob =
  | "PLOMBIER_CHAUFFAGISTE"
  | "ELECTRICIEN"
  | "PEINTRE_BATIMENT"
  | "MENUISIER"
  | "AUTRE";


type WorkMode =
  | "SOLO"
  | "TEAM";


type OnboardingBody = {
  job?: UserJob;
  workMode?: WorkMode;
  organizationName?: string;
};



const allowedJobs: UserJob[] = [
  "PLOMBIER_CHAUFFAGISTE",
  "ELECTRICIEN",
  "PEINTRE_BATIMENT",
  "MENUISIER",
  "AUTRE",
];


const allowedWorkModes: WorkMode[] = [
  "SOLO",
  "TEAM",
];



export async function PATCH(
  request: Request,
) {

  try {


    const cookieStore =
      await cookies();



    const sessionToken =
      cookieStore.get(
        "forgeSession",
      )?.value;



    if (!sessionToken) {

      return NextResponse.json(
        {
          error:
            "Tu dois être connecté pour terminer l’onboarding.",
        },
        {
          status: 401,
        },
      );

    }



    const session =
      await prisma.session.findUnique({

        where: {
          token: sessionToken,
        },

        include: {
          user: true,
        },

      });



    if (
      !session ||
      session.expiresAt <= new Date()
    ) {

      return NextResponse.json(
        {
          error:
            "Ta session a expiré. Reconnecte-toi.",
        },
        {
          status: 401,
        },
      );

    }



    const body =
      (await request.json()) as OnboardingBody;



    const job =
      body.job;



    const workMode =
      body.workMode;

    const organizationName =
      body.organizationName?.trim() ?? "";




    if (
      !job ||
      !allowedJobs.includes(job)
    ) {

      return NextResponse.json(
        {
          error:
            "Le métier sélectionné est invalide.",
        },
        {
          status: 400,
        },
      );

    }




    if (
      !workMode ||
      !allowedWorkModes.includes(
        workMode,
      )
    ) {

      return NextResponse.json(
        {
          error:
            "Le mode de travail sélectionné est invalide.",
        },
        {
          status: 400,
        },
      );

    }

    if (workMode === "TEAM" && !organizationName) {
      return NextResponse.json(
        { error: "Renseigne le nom de ton entreprise ou de ton équipe." },
        { status: 400 },
      );
    }




    const user = await prisma.$transaction(async (transaction) => {
      let organizationId: string | undefined;

      if (workMode === "TEAM") {
        const existingMembership =
          await transaction.organizationMember.findFirst({
            where: { userId: session.userId },
          });

        if (!existingMembership) {
          const trial =
            session.user.trialStartedAt && session.user.trialEndsAt
              ? {
                  trialStartedAt: session.user.trialStartedAt,
                  trialEndsAt: session.user.trialEndsAt,
                }
              : createTrialPeriod(session.user.createdAt);
          const organization = await transaction.organization.create({
            data: {
              name: organizationName,
              trialStartedAt: trial.trialStartedAt,
              trialEndsAt: trial.trialEndsAt,
              subscriptionStatus: session.user.subscriptionStatus,
              members: {
                create: {
                  userId: session.userId,
                  role: "OWNER",
                },
              },
            },
          });
          organizationId = organization.id;
        } else {
          organizationId = existingMembership.organizationId;
        }

        await Promise.all([
          transaction.client.updateMany({
            where: { userId: session.userId, organizationId: null },
            data: { organizationId },
          }),
          transaction.intervention.updateMany({
            where: { userId: session.userId, organizationId: null },
            data: { organizationId },
          }),
        ]);
      }

      return transaction.user.update({

        where: {
          id: session.userId,
        },


        data: {

          job,

          workMode,

          onboardingCompleted:
            true,

        },


        select: {

          id: true,

          firstName: true,

          job: true,

          workMode: true,

          onboardingCompleted: true,

        },

      });
    });




    return NextResponse.json({
      user,
    });



  } catch (error) {


    console.error(
      "Erreur enregistrement onboarding :",
      error,
    );



    return NextResponse.json(
      {
        error:
          "Impossible d’enregistrer les informations.",
      },
      {
        status: 500,
      },
    );

  }

}
