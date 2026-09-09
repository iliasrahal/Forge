export function cleanPersonalClientName(value: string) {
  return value
    .replace(/\b(mme|monsieur|madame|mr|m)\b\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitPersonalClientName(value: string) {
  const parts = cleanPersonalClientName(value).split(" ").filter(Boolean);

  if (parts.length === 0) {
    return { firstName: null, lastName: null };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? null,
  };
}

export type ClientNameParts = {
  type: "PARTICULIER" | "PROFESSIONNEL";
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
};

/** Nom affiché d'un client : prénom + nom pour un particulier, raison
 *  sociale pour un professionnel. Chaîne vide si rien n'est renseigné. */
export function getClientDisplayName(client: ClientNameParts): string {
  if (client.type === "PARTICULIER") {
    return `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim();
  }
  return (client.companyName ?? "").trim();
}

/** Forme normalisée pour la recherche : minuscules, sans accents ni espaces
 *  superflus. « Café » -> « cafe ». */
export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/** Compare deux clients par nom affiché, ordre alphabétique français. */
export function compareClientsByName(
  a: ClientNameParts,
  b: ClientNameParts,
): number {
  return getClientDisplayName(a).localeCompare(getClientDisplayName(b), "fr", {
    sensitivity: "base",
  });
}
