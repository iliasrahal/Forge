export const SERVICE_PRICING_TYPES = ["FIXED", "HOURLY", "UNIT"] as const;

export type ServicePricingTypeValue = (typeof SERVICE_PRICING_TYPES)[number];

export type ServiceCatalogInput = {
  name: string;
  description: string | null;
  priceCents: number;
  pricingType: ServicePricingTypeValue;
};

export function parseEuroPriceToCents(value: unknown) {
  if (typeof value !== "string") return null;

  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;

  const [euros, decimals = ""] = normalized.split(".");
  const cents = Number(euros) * 100 + Number(decimals.padEnd(2, "0"));

  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 2147483647) {
    return null;
  }

  return cents;
}

export function validateServiceCatalogInput(body: unknown):
  | { ok: true; data: ServiceCatalogInput }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Les informations de la prestation sont invalides." };
  }

  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const description =
    typeof input.description === "string" ? input.description.trim() : "";
  const priceCents = parseEuroPriceToCents(input.price);
  const pricingType = input.pricingType;

  if (!name) return { ok: false, error: "Le nom est obligatoire." };
  if (name.length > 120) return { ok: false, error: "Le nom est trop long." };
  if (description.length > 1000) {
    return { ok: false, error: "La description est trop longue." };
  }
  if (priceCents === null) {
    return { ok: false, error: "Saisis un prix valide, supérieur à 0, avec au maximum deux décimales." };
  }
  if (!SERVICE_PRICING_TYPES.includes(pricingType as ServicePricingTypeValue)) {
    return { ok: false, error: "Le type de prix est invalide." };
  }

  return {
    ok: true,
    data: {
      name,
      description: description || null,
      priceCents,
      pricingType: pricingType as ServicePricingTypeValue,
    },
  };
}

export function formatServicePrice(priceCents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(priceCents / 100);
}

export function formatPricingType(pricingType: ServicePricingTypeValue) {
  if (pricingType === "HOURLY") return "Par heure";
  if (pricingType === "UNIT") return "Par unité";
  return "Prix fixe";
}
