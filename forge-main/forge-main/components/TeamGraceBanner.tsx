import Link from "next/link";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
});

/**
 * Bandeau affiché quand l'équipe active n'a plus aucun membre abonné :
 * elle sera supprimée à `graceExpiresAt`.
 */
export default function TeamGraceBanner({
  workspaceName,
  graceExpiresAt,
}: {
  workspaceName: string;
  graceExpiresAt: Date | string | null | undefined;
}) {
  if (!graceExpiresAt) return null;

  const date = new Date(graceExpiresAt);
  const days = Math.max(
    0,
    Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
  );

  return (
    <div className="fixed inset-x-0 top-0 z-[60] bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950 shadow-md">
      L’équipe <strong>{workspaceName}</strong> n’a plus aucun membre abonné.
      Elle sera <strong>supprimée le {dateFmt.format(date)}</strong>
      {days > 0 ? ` (dans ${days} j)` : ""}.{" "}
      <Link href="/subscription" className="underline underline-offset-2">
        Prendre un abonnement pour la conserver
      </Link>
      .
    </div>
  );
}
