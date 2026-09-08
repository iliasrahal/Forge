export const STATUS_AUTO_REFRESH_INTERVAL_MS = 8_000;

/** Routes de consultation où un statut peut changer depuis un autre appareil. */
export function shouldAutoRefreshStatuses(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const root = segments[0];

  if (segments.includes("new") || segments.at(-1) === "edit") return false;

  if (root === "app") return segments.length === 1;
  if (root === "quotes" || root === "invoices") return true;

  if (root === "clients") {
    // Liste/fiche client, ainsi que les détails de documents imbriqués.
    return segments.length <= 2 || segments[2] === "quotes" || segments[2] === "invoices";
  }

  return false;
}
