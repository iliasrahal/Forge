/**
 * Classe d'une pastille de statut de document. Les couleurs sont celles du
 * monde Cyclorama (cobalt = en cours, jade = réglé, ambre = en retard,
 * braise = refusé / annulé, discret = brouillon).
 * Fond plein (mélangé à la surface) : jamais transparent, lisible partout.
 */

const JADE =
  "text-[#4fe3b4] bg-[color-mix(in_srgb,#34d9a6_20%,var(--forge-surface))] border-[color-mix(in_srgb,#34d9a6_42%,var(--forge-surface))]";
const COBALT =
  "text-[var(--forge-accent-blue-lit)] bg-[color-mix(in_srgb,var(--forge-accent-blue)_22%,var(--forge-surface))] border-[color-mix(in_srgb,var(--forge-accent-blue)_42%,var(--forge-surface))]";
const AMBER =
  "text-[#f7c15f] bg-[color-mix(in_srgb,#f0b24a_20%,var(--forge-surface))] border-[color-mix(in_srgb,#f0b24a_42%,var(--forge-surface))]";
const EMBER =
  "text-[#ff9974] bg-[color-mix(in_srgb,#ff7a4d_18%,var(--forge-surface))] border-[color-mix(in_srgb,#ff7a4d_40%,var(--forge-surface))]";
const MUTED =
  "text-[var(--forge-text-secondary)] bg-[color-mix(in_srgb,var(--forge-text-muted)_20%,var(--forge-surface))] border-[color-mix(in_srgb,var(--forge-text-muted)_34%,var(--forge-surface))]";

const MAP: Record<string, string> = {
  PAYEE: JADE,
  ENVOYEE: COBALT,
  EN_RETARD: AMBER,
  BROUILLON: MUTED,
  ANNULEE: EMBER,
  ACCEPTE: JADE,
  ENVOYE: COBALT,
  REFUSE: EMBER,
  EMISE: JADE,
};

export function statusChipClasses(status: string): string {
  const tone = MAP[status] ?? COBALT;
  return `inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`;
}
