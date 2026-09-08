export type BottomNavigationSection =
  | "home"
  | "clients"
  | "quotes"
  | "invoices"
  | null;

/**
 * Détermine l'onglet depuis l'entité réellement consultée. Les documents
 * imbriqués sous un client restent des devis/factures, pas des pages Clients.
 */
export function getBottomNavigationSection(
  pathname: string,
): BottomNavigationSection {
  const segments = pathname.split("/").filter(Boolean);
  const root = segments[0];

  if (
    root === "quotes" ||
    (root === "clients" && segments[2] === "quotes")
  ) {
    return "quotes";
  }

  if (
    root === "invoices" ||
    (root === "clients" && segments[2] === "invoices")
  ) {
    return "invoices";
  }

  if (root === "clients") return "clients";

  if (root === "app" || root === "interventions" || root === "history") {
    return "home";
  }

  return null;
}
