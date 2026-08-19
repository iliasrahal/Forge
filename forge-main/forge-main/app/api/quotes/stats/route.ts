import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";


export async function GET(
  request: Request,
) {

  const currentUser =
    await requireCurrentUser();


  const { searchParams } =
    new URL(request.url);


  const year =
    Number(
      searchParams.get("year"),
    );


  const quotes =
    await prisma.quote.findMany({

      where: {
        client: {
          userId: currentUser.id,
        },

        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },


      select: {
        amountCents: true,
        createdAt: true,
      },

    });



  return NextResponse.json(
    quotes,
  );

}