import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/src/lib/prisma";
import { resolveEffectiveStatus } from "@/src/lib/subscription-policy";


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



  // Bascule paresseuse : un essai terminé sans abonnement passe en FREE.
  const effectiveStatus = resolveEffectiveStatus(
    session.user.subscriptionStatus,
    session.user.trialEndsAt,
  );

  if (effectiveStatus !== session.user.subscriptionStatus) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { subscriptionStatus: effectiveStatus },
    });
    session.user.subscriptionStatus = effectiveStatus;
  }



  return session.user;
}




export async function requireCurrentUser() {

  const user =
    await getCurrentUser();



  if (!user) {
    redirect("/login");
  }



  // Mot de passe temporaire attribué par un admin : on force le changement
  // avant tout accès à l'application. La page de changement n'appelle pas
  // requireCurrentUser, donc pas de boucle.
  if (user.mustChangePassword) {
    redirect("/settings/security/password");
  }



  return user;
}
