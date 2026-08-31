"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CreditCard, Download, KeyRound, Mail, ShieldAlert } from "lucide-react";

import {
  deleteUserAccount,
  exportUserData,
  sendUserPasswordResetEmail,
  setUserSubscription,
  setUserTempPassword,
} from "@/app/admin/_actions";
import AsyncButton from "@/app/admin/_components/AsyncButton";

const SUBSCRIPTION_STATUSES = [
  "TRIAL",
  "ACTIVE",
  "PAID",
  "ORGANIZATION",
  "CANCELED",
  "EXPIRED",
];

function Panel({
  title,
  icon: Icon,
  danger = false,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`admin-card p-5 ${
        danger ? "ring-1 ring-inset ring-red-500/20" : ""
      }`}
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
        <Icon className={`h-4 w-4 ${danger ? "text-red-500" : ""}`} />
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

const inputCls =
  "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950";

export default function UserAdminPanel({
  userId,
  email,
  subscriptionStatus,
  trialEndsAt,
  canManage,
  canDelete,
}: {
  userId: string;
  email: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  canManage: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const [subPending, startSub] = useTransition();
  const [subMsg, setSubMsg] = useState<string | null>(null);

  const [confirmEmail, setConfirmEmail] = useState("");
  const [delPending, startDel] = useTransition();
  const [delMsg, setDelMsg] = useState<string | null>(null);

  if (!canManage) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Actions réservées aux rôles ADMIN et supérieurs.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel title="Mot de passe" icon={KeyRound}>
        <div className="flex flex-wrap gap-2">
          <AsyncButton action={() => sendUserPasswordResetEmail(userId)}>
            <Mail className="h-4 w-4" />
            Envoyer un lien
          </AsyncButton>
          <AsyncButton
            confirm="Générer un mot de passe temporaire ? Toutes les sessions de ce compte seront déconnectées."
            action={() => setUserTempPassword(userId)}
            onDone={(result) => {
              if (
                result &&
                "ok" in result &&
                result.ok === true &&
                "tempPassword" in result
              ) {
                setTempPassword(String(result.tempPassword));
              }
            }}
          >
            Mot de passe temporaire
          </AsyncButton>
        </div>
        {tempPassword ? (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-500/40 dark:bg-amber-500/10">
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              À transmettre au client — affiché une seule fois
            </p>
            <code className="mt-1 block break-all rounded-md bg-white/70 px-2 py-1 font-mono text-base dark:bg-slate-950/50">
              {tempPassword}
            </code>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              Le client devra le changer à sa prochaine connexion.
            </p>
          </div>
        ) : null}
      </Panel>

      <Panel title="Abonnement" icon={CreditCard}>
        <form
          action={(formData) => {
            setSubMsg(null);
            startSub(async () => {
              const result = await setUserSubscription(userId, formData);
              setSubMsg(result.ok ? "Enregistré." : result.error);
              if (result.ok) router.refresh();
            });
          }}
          className="space-y-2"
        >
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Statut
            <select
              name="subscriptionStatus"
              defaultValue={subscriptionStatus}
              className={`mt-1 w-full ${inputCls}`}
            >
              {SUBSCRIPTION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Fin d'essai
            <input
              type="date"
              name="trialEndsAt"
              defaultValue={trialEndsAt ?? ""}
              className={`mt-1 w-full ${inputCls}`}
            />
          </label>
          <button
            type="submit"
            disabled={subPending}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {subPending ? "…" : "Enregistrer"}
          </button>
          {subMsg ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">{subMsg}</p>
          ) : null}
        </form>
      </Panel>

      <Panel title="Export RGPD" icon={Download}>
        <AsyncButton
          action={async () => {
            const result = await exportUserData(userId);
            if (result.ok && "json" in result) {
              const blob = new Blob([String(result.json)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = String(result.filename);
              a.click();
              URL.revokeObjectURL(url);
            }
            return result;
          }}
        >
          <Download className="h-4 w-4" />
          Télécharger les données
        </AsyncButton>
      </Panel>

      {canDelete ? (
        <Panel title="Zone dangereuse" icon={ShieldAlert} danger>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Supprime définitivement le compte et toutes ses données. Retape{" "}
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {email}
            </span>{" "}
            pour confirmer.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              value={confirmEmail}
              onChange={(event) => setConfirmEmail(event.target.value)}
              placeholder={email}
              className={inputCls}
            />
            <button
              type="button"
              disabled={
                delPending ||
                confirmEmail.trim().toLowerCase() !== email.toLowerCase()
              }
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
              onClick={() => {
                if (
                  !window.confirm(
                    "Dernière confirmation : supprimer définitivement ce compte ?",
                  )
                ) {
                  return;
                }
                setDelMsg(null);
                startDel(async () => {
                  const formData = new FormData();
                  formData.set("confirmEmail", confirmEmail);
                  const result = await deleteUserAccount(userId, formData);
                  if (result.ok) router.push("/admin/users");
                  else setDelMsg(result.error);
                });
              }}
            >
              {delPending ? "…" : "Supprimer le compte"}
            </button>
          </div>
          {delMsg ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {delMsg}
            </p>
          ) : null}
        </Panel>
      ) : null}
    </div>
  );
}
