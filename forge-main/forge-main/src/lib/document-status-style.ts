/**
 * Classe d'une pastille de statut de document. Les couleurs sont celles du
 * monde Cyclorama (cobalt = en cours, jade = réglé, ambre = en retard,
 * discret = brouillon / annulé).
 */

const JADE =
  "text-[#34d9a6] bg-[color-mix(in_srgb,#34d9a6_16%,transparent)] border-[color-mix(in_srgb,#34d9a6_40%,transparent)]";
const COBALT =
  "text-[var(--forge-accent-blue-lit)] bg-[color-mix(in_srgb,var(--forge-accent-blue)_16%,transparent)] border-[color-mix(in_srgb,var(--forge-accent-blue)_38%,transparent)]";
const AMBER =
  "text-[#f0b24a] bg-[color-mix(in_srgb,#f0b24a_16%,transparent)] border-[color-mix(in_srgb,#f0b24a_40%,transparent)]";
const MUTED =
  "text-[var(--forge-text-muted)] bg-[color-mix(in_srgb,var(--forge-text-muted)_14%,transparent)] border-[color-mix(in_srgb,var(--forge-text-muted)_30%,transparent)]";

const MAP: Record<string, string> = {
  PAYEE: JADE,
  ENVOYEE: COBALT,
  EN_RETARD: AMBER,
  BROUILLON: MUTED,
  ANNULEE: MUTED,
  ACCEPTE: JADE,
  ENVOYE: COBALT,
  REFUSE: MUTED,
  EMISE: JADE,
};

export function statusChipClasses(status: string): string {
  const tone = MAP[status] ?? COBALT;
  return `inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`;
}
