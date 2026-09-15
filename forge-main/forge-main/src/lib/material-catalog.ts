import type { EditableMaterialSnapshot } from "@/src/lib/quote-lines";

export type EffectiveMaterial = EditableMaterialSnapshot & {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  description: string;
  tags: string[];
  unit: string;
  purchasePriceCents: number | null;
  salePriceCents: number;
  favorite: boolean;
  active: boolean;
  isFixture: boolean;
};

type CatalogRecord = {
  id: string;
  name: string;
  brand: string | null;
  reference: string | null;
  description: string | null;
  specifications: unknown;
  tags: string[];
  unit: string;
  defaultPurchasePriceCents: number | null;
  defaultSalePriceCents: number | null;
  supplier: string | null;
  active: boolean;
  isFixture: boolean;
  category: { id: string; name: string } | null;
  workspaceMaterials: WorkspaceRecord[];
};

type WorkspaceRecord = {
  id: string;
  catalogItemId: string | null;
  name: string | null;
  brand: string | null;
  reference: string | null;
  description: string | null;
  specifications: unknown;
  tags: string[];
  unit: string | null;
  purchasePriceCents: number | null;
  salePriceCents: number | null;
  supplier: string | null;
  favorite: boolean;
  active: boolean;
  catalogItem?: Omit<CatalogRecord, "workspaceMaterials"> | null;
};

export function normalizeSpecifications(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter((entry): entry is [string, string] =>
        typeof entry[1] === "string" && Boolean(entry[1].trim()),
      )
      .slice(0, 50)
      .map(([key, item]) => [key.trim().slice(0, 80), item.trim().slice(0, 200)]),
  );
}

export function buildEffectiveMaterials(
  catalog: CatalogRecord[],
  customMaterials: WorkspaceRecord[],
): EffectiveMaterial[] {
  const inherited = catalog.map((item) => {
    const override = item.workspaceMaterials[0];
    return {
      id: override?.id ?? `catalog:${item.id}`,
      catalogItemId: item.id,
      workspaceMaterialId: override?.id ?? null,
      categoryId: item.category?.id ?? null,
      categoryName: item.category?.name ?? null,
      name: override?.name || item.name,
      brand: override?.brand ?? item.brand ?? "",
      reference: override?.reference ?? item.reference ?? "",
      description: override?.description ?? item.description ?? "",
      specifications: normalizeSpecifications(override?.specifications ?? item.specifications),
      tags: override?.tags.length ? override.tags : item.tags,
      unit: override?.unit || item.unit,
      purchasePriceCents:
        override?.purchasePriceCents ?? item.defaultPurchasePriceCents,
      salePriceCents: override?.salePriceCents ?? item.defaultSalePriceCents ?? 0,
      supplier: override?.supplier ?? item.supplier ?? "",
      favorite: override?.favorite ?? false,
      active: override?.active ?? item.active,
      isFixture: item.isFixture,
    } satisfies EffectiveMaterial;
  });

  const custom = customMaterials.map((item) => ({
    id: item.id,
    catalogItemId: null,
    workspaceMaterialId: item.id,
    categoryId: null,
    categoryName: "Personnalisé",
    name: item.name || "Matériel personnalisé",
    brand: item.brand ?? "",
    reference: item.reference ?? "",
    description: item.description ?? "",
    specifications: normalizeSpecifications(item.specifications),
    tags: item.tags,
    unit: item.unit || "u",
    purchasePriceCents: item.purchasePriceCents,
    salePriceCents: item.salePriceCents ?? 0,
    supplier: item.supplier ?? "",
    favorite: item.favorite,
    active: item.active,
    isFixture: false,
  } satisfies EffectiveMaterial));

  return [...inherited, ...custom].sort(
    (left, right) =>
      Number(right.favorite) - Number(left.favorite) ||
      left.name.localeCompare(right.name, "fr"),
  );
}

function parseCents(value: unknown) {
  const normalized = String(value ?? "").trim().replace(",", ".");
  if (!normalized) return null;
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return NaN;
  return Math.round(Number(normalized) * 100);
}

export function validateWorkspaceMaterialInput(value: unknown) {
  const body = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const catalogItemId = typeof body.catalogItemId === "string" && body.catalogItemId.trim()
    ? body.catalogItemId.trim()
    : null;
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
  if (!catalogItemId && !name) return { ok: false as const, error: "Le nom du matériel est obligatoire." };
  const purchasePriceCents = parseCents(body.purchasePrice);
  const salePriceCents = parseCents(body.salePrice);
  if (Number.isNaN(purchasePriceCents) || Number.isNaN(salePriceCents)) {
    return { ok: false as const, error: "Les prix doivent être des montants valides." };
  }
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim().slice(0, 60)).filter(Boolean).slice(0, 30)
    : String(body.tags ?? "").split(",").map((tag) => tag.trim().slice(0, 60)).filter(Boolean).slice(0, 30);
  return {
    ok: true as const,
    data: {
      catalogItemId,
      name: name || null,
      brand: typeof body.brand === "string" && body.brand.trim() ? body.brand.trim().slice(0, 120) : null,
      reference: typeof body.reference === "string" && body.reference.trim() ? body.reference.trim().slice(0, 120) : null,
      description: typeof body.description === "string" && body.description.trim() ? body.description.trim().slice(0, 1000) : null,
      specifications: normalizeSpecifications(body.specifications),
      tags,
      unit: typeof body.unit === "string" && body.unit.trim() ? body.unit.trim().slice(0, 16) : null,
      purchasePriceCents,
      salePriceCents,
      supplier: typeof body.supplier === "string" && body.supplier.trim() ? body.supplier.trim().slice(0, 200) : null,
      favorite: body.favorite === true,
      active: body.active !== false,
    },
  };
}

export function materialSearchHaystack(material: EffectiveMaterial) {
  return [
    material.name,
    material.brand,
    material.reference,
    material.description,
    material.categoryName,
    material.supplier,
    ...material.tags,
    ...Object.entries(material.specifications).flat(),
  ]
    .join(" ")
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
