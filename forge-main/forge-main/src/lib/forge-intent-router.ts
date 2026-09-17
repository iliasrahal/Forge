export type DeterministicForgeDecision = {
  intent: "statistics" | "clientFinancial" | "assignment" | "purchase" | "workTime" | "profitability";
  action: "query" | "assign" | "create" | "search";
  entity: string | null;
  metric?: "sold" | "billed" | "collected" | "remaining" | "purchases" | "margin";
  assignees?: string[];
  durationMinutes?: number | null;
  amountCents?: number | null;
  quantityMilli?: number | null;
  supplier?: string | null;
};

function normalize(value: string) {
  return value.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, "'").trim();
}

function title(value: string) {
  return value.trim().replace(/\s+/g, " ").replace(/^./, (letter) => letter.toLocaleUpperCase("fr-FR"));
}

function durationMinutes(value: string, unit: string) {
  const amount = Number(value.replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(unit.startsWith("h") || unit.includes("heure") ? amount * 60 : amount);
}

export function detectDeterministicForgeIntent(message: string): DeterministicForgeDecision | null {
  const normalized = normalize(message);
  const chantierMargin = message.match(/(?:quelle|combien).+marge.+(?:chantier|intervention)\s+(.+)/i);
  if (chantierMargin) return { intent: "profitability", action: "search", entity: title(chantierMargin[1].replace(/[?.!]+$/, "")) };

  const metric = /\b(vendu|ventes?)\b/.test(normalized) ? "sold"
    : /\bfacture\b/.test(normalized) && /\bcombien\b/.test(normalized) ? "billed"
    : /\bencaisse\b/.test(normalized) ? "collected"
    : /\breste.+encaisser\b|\ba encaisser\b/.test(normalized) ? "remaining"
    : /\b(achats?|depense chez)\b/.test(normalized) && /\bcombien\b/.test(normalized) ? "purchases"
    : /\bmarge\b/.test(normalized) && /\b(combien|quelle)\b/.test(normalized) ? "margin"
    : null;
  if (metric) return { intent: "statistics", action: "query", entity: null, metric };

  const debt = message.match(/combien\s+(.+?)\s+(?:me\s+)?doit\b/i);
  if (debt) return { intent: "clientFinancial", action: "query", entity: title(debt[1]) };

  const assignment = message.match(/(?:affecte|assigne|ajoute)\s+(.+?)\s+(?:a|à|au|sur)\s+(?:l['’]intervention|le chantier|chantier)\s+(.+)/i);
  if (assignment) {
    const assignees = assignment[1].split(/\s*(?:,|\bet\b)\s*/i).map(title).filter(Boolean);
    return { intent: "assignment", action: "assign", entity: title(assignment[2]), assignees };
  }

  const worked = message.match(/(.+?)\s+(?:a\s+)?travaill[ée]\s+(\d+(?:[,.]\d+)?)\s*(h|heures?|minutes?)\s+(?:sur|au chantier)\s+(.+)/i);
  if (worked) return { intent: "workTime", action: "create", entity: title(worked[4]), assignees: [title(worked[1])], durationMinutes: durationMinutes(worked[2], worked[3]) };

  const purchase = message.match(/(?:j['’]ai\s+)?achet[ée]\s+(\d+(?:[,.]\d+)?)\s+(.+?)\s+chez\s+(.+?)\s+pour\s+(\d+(?:[,.]\d+)?)\s*(?:€|euros?)/i);
  if (purchase) return { intent: "purchase", action: "create", entity: title(purchase[2]), quantityMilli: Math.round(Number(purchase[1].replace(",", ".")) * 1000), supplier: title(purchase[3]), amountCents: Math.round(Number(purchase[4].replace(",", ".")) * 100) };
  return null;
}
