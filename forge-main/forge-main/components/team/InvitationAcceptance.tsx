"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type InvitationAcceptanceProps = {
  token: string;
  workspaceName: string;
  invitedEmail: string;
  currentUserEmail: string;
  role: "ADMIN" | "READ_ONLY" | "OWNER" | "MANAGER" | "TECHNICIAN";
  initialWorkspaceId: string;
  alreadyMember: boolean;
  emailMismatch: boolean;
};

type AcceptanceResponse = {
  workspaceId?: string;
  workspaceName?: string;
  alreadyMember?: boolean;
  adminDowngraded?: boolean;
  error?: string;
};

export default function InvitationAcceptance({
  token,
  invitedEmail,
  currentUserEmail,
  role,
  initialWorkspaceId,
  alreadyMember,
  emailMismatch,
}: InvitationAcceptanceProps) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "idle" | "accepting" | "accepted" | "switching" | "error"
  >(alreadyMember ? "accepted" : "idle");
  const [workspaceId, setWorkspaceId] = useState(initialWorkspaceId);
  const [message, setMessage] = useState(
    alreadyMember ? "Vous faites déjà partie de cette équipe." : "",
  );

  async function acceptInvitation() {
    if (status === "accepting") return;

    setStatus("accepting");
    setMessage("");

    try {
      const response = await fetch("/api/team/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await response.json()) as AcceptanceResponse;

      if (!response.ok || !data.workspaceId) {
        throw new Error(data.error || "Impossible de rejoindre l’équipe.");
      }

      setWorkspaceId(data.workspaceId);
      router.replace(
        data.adminDowngraded
          ? "/app?invitationAccess=read-only"
          : "/app",
      );
      router.refresh();
    } catch (acceptanceError) {
      setMessage(
        acceptanceError instanceof Error
          ? acceptanceError.message
          : "Impossible de rejoindre l’équipe.",
      );
      setStatus("error");
    }
  }

  async function openWorkspace() {
    const targetWorkspaceId = workspaceId;

    if (!targetWorkspaceId || status === "switching") return;

    setStatus("switching");

    try {
      const response = await fetch("/api/workspaces/active", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: targetWorkspaceId }),
      });

      if (!response.ok) {
        throw new Error("Impossible d’ouvrir cette équipe.");
      }

      router.replace("/app");
      router.refresh();
    } catch (switchError) {
      setMessage(
        switchError instanceof Error
          ? switchError.message
          : "Impossible d’ouvrir cette équipe.",
      );
      setStatus("error");
    }
  }

  async function switchAccount() {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.clear();
    router.replace(`/login?invitation=${encodeURIComponent(token)}`);
    router.refresh();
  }

  if (emailMismatch) {
    return (
      <div className="text-center">
        <p className="leading-7 text-slate-600 dark:text-slate-300">
          Cette invitation a été envoyée à{" "}
          <strong className="text-slate-900 dark:text-white">
            {invitedEmail}
          </strong>
          . Vous êtes actuellement connecté avec {currentUserEmail}.
        </p>
        <button
          type="button"
          onClick={() => void switchAccount()}
          className="mt-7 h-14 w-full rounded-2xl bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-700"
        >
          Se connecter avec un autre compte
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-slate-600 dark:text-slate-300">
        Accès proposé :{" "}
        <strong className="text-slate-900 dark:text-white">
          {role === "READ_ONLY" ? "Lecture seule" : "Admin"}
        </strong>
      </p>

      {message && (
        <p
          className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${
            status === "error"
              ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
              : "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
          }`}
        >
          {message}
        </p>
      )}

      {status === "accepted" ? (
        <button
          type="button"
          onClick={() => void openWorkspace()}
          className="mt-7 h-14 w-full rounded-2xl bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-700"
        >
          Ouvrir l’équipe
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void acceptInvitation()}
          disabled={status === "accepting"}
          className="mt-7 h-14 w-full rounded-2xl bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
        >
          {status === "accepting" ? "Ajout en cours..." : "Rejoindre l’équipe"}
        </button>
      )}
    </div>
  );
}
