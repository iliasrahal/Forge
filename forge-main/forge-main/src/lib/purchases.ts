export type PurchaseLineInput = {
  name: string;
  lineType?: string;
  quantity: string | number;
  unit?: string;
  unitPrice: string | number;
  vatRate?: string | number;
  materialCatalogItemId?: string | null;
  workspaceMaterialId?: string | null;
};

export type NormalizedPurchaseLine = {
  name: string;
  lineType: string;
  quantityMilli: number;
  unit: string;
  unitPriceCents: number;
  vatRateBp: number;
  netAmountCents: number;
  vatAmountCents: number;
  totalAmountCents: number;
  materialCatalogItemId: string | null;
  workspaceMaterialId: string | null;
};

function decimal(value: string | number) {
  return Number(String(value).trim().replace(",", "."));
}

export function normalizePurchaseLines(lines: PurchaseLineInput[]) {
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > 100) throw new Error("Ajoute au moins une ligne d’achat.");
  return lines.map((line): NormalizedPurchaseLine => {
    const name = typeof line.name === "string" ? line.name.trim().slice(0, 200) : "";
    const quantity = decimal(line.quantity);
    const unitPrice = decimal(line.unitPrice);
    const vatRate = line.vatRate === "" || line.vatRate == null ? 0 : decimal(line.vatRate);
    if (!name) throw new Error("La désignation de chaque ligne est obligatoire.");
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("La quantité doit être supérieure à zéro.");
    if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error("Le prix d’achat est invalide.");
    if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) throw new Error("Le taux de TVA est invalide.");
    const quantityMilli = Math.round(quantity * 1000);
    const unitPriceCents = Math.round(unitPrice * 100);
    const vatRateBp = Math.round(vatRate * 100);
    const netAmountCents = Math.round(quantityMilli * unitPriceCents / 1000);
    const vatAmountCents = Math.round(netAmountCents * vatRateBp / 10_000);
    return {
      name,
      lineType: typeof line.lineType === "string" && line.lineType.trim() ? line.lineType.trim().toUpperCase().slice(0, 30) : "MATERIAL",
      quantityMilli,
      unit: typeof line.unit === "string" && line.unit.trim() ? line.unit.trim().slice(0, 30) : "u",
      unitPriceCents,
      vatRateBp,
      netAmountCents,
      vatAmountCents,
      totalAmountCents: netAmountCents + vatAmountCents,
      materialCatalogItemId: typeof line.materialCatalogItemId === "string" && line.materialCatalogItemId ? line.materialCatalogItemId : null,
      workspaceMaterialId: typeof line.workspaceMaterialId === "string" && line.workspaceMaterialId ? line.workspaceMaterialId : null,
    };
  });
}

export function purchaseTotals(lines: Pick<NormalizedPurchaseLine, "netAmountCents" | "vatAmountCents" | "totalAmountCents">[]) {
  return lines.reduce((totals, line) => ({
    netAmountCents: totals.netAmountCents + line.netAmountCents,
    vatAmountCents: totals.vatAmountCents + line.vatAmountCents,
    totalAmountCents: totals.totalAmountCents + line.totalAmountCents,
  }), { netAmountCents: 0, vatAmountCents: 0, totalAmountCents: 0 });
}

export function allocationAmount(quantityMilli: number, unitCostCents: number) {
  return Math.round(quantityMilli * unitCostCents / 1000);
}
