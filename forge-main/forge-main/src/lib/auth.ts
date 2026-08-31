import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/src/lib/prisma";


export async function getCurrentUser() {

  const cookieStore = await cookies();


  const token =
    cookieStore.get("forgeSession")?.value;



  if (!token) {
    return null;
  }



  const session =
    await prisma.session.findUnique({

      where: {
        token,
      },

      include: {
        user: true,
      },

    });



  if (!session) {
    return null;
  }



  if (
    session.expiresAt <= new Date()
  ) {

    await prisma.session.deleteMany({

      where: {
        id: session.id,
      },

    });


    return null;
  }



  return session.user;
}




export async function requireCurrentUser() {

  const user =
    await getCurrentUser();



  if (!user) {
    redirect("/login");
  }



  return user;
}
