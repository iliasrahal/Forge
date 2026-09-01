import { createHash } from "node:crypto";
import { redirect } from "next/navigation";

import AuthShell from "@/components/auth/AuthShell";
import InvitationAcceptance from "@/components/team/InvitationAcceptance";
import { getCurrentUser } from "@/src/lib/auth";
import { normalizeEmail } from "@/src/lib/email-normalization";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

type InvitePageProps = {
  searchParams: Promise<{ token?: string }>;
};

function InvitationMessage({ message }: { message: string }) {
  return (
    <AuthShell
      eyebrow="Invitation Forge"
      title="Impossible de rejoindre cette équipe."
      description={message}
    >
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Demandez au responsable de l’équipe de vous envoyer une nouvelle
        invitation si nécessaire.
      </p>
    </AuthShell>
  );
}

export default async function InvitePage({ searchParams }: InvitePageProps) {
  const { token: rawToken } = await searchParams;
  const token = rawToken?.trim() ?? "";

  if (!token) {
    return <InvitationMessage message="Le lien d’invitation est invalide." />;
  }

  const invitation = await prisma.teamInvitation.findUnique({
    where: {
      tokenHash: createHash("sha256").update(token).digest("hex"),
    },
    include: {
      organization: { select: { id: true, name: true } },
    },
  });

  if (!invitation || invitation.status === "REVOKED") {
    return <InvitationMessage message="Le lien d’invitation est invalide." />;
  }

  if (invitation.expiresAt <= new Date()) {
    return <InvitationMessage message="Cette invitation a expiré." />;
  }

  const [currentUser, invitedUser] = await Promise.all([
    getCurrentUser(),
    prisma.user.findFirst({
      where: {
        email: {
          equals: normalizeEmail(invitation.email),
          mode: "insensitive",
        },
      },
      select: { id: true },
    }),
  ]);

  if (!currentUser) {
    const destination = invitedUser ? "/login" : "/register";
    redirect(`${destination}?invitation=${encodeURIComponent(token)}`);
  }

  const emailMismatch =
    normalizeEmail(currentUser.email) !== normalizeEmail(invitation.email);
  const membership = emailMismatch
    ? null
    : await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: currentUser.id,
            organizationId: invitation.organizationId,
          },
        },
        select: { id: true },
      });

  if (invitation.status === "ACCEPTED" && !membership && !emailMismatch) {
    return <InvitationMessage message="Cette invitation a déjà été utilisée." />;
  }

  return (
    <AuthShell
      eyebrow="Invitation Forge"
      title={`Rejoindre ${invitation.organization.name}`}
      description="Retrouvez cette équipe dans votre espace Forge existant."
    >
      <InvitationAcceptance
        token={token}
        workspaceName={invitation.organization.name}
        invitedEmail={invitation.email}
        currentUserEmail={currentUser.email}
        role={invitation.role}
        initialWorkspaceId={invitation.organizationId}
        alreadyMember={Boolean(
          membership && invitation.status === "ACCEPTED",
        )}
        emailMismatch={emailMismatch}
      />
    </AuthShell>
  );
}
