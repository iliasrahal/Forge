import assert from "node:assert/strict";
import test from "node:test";

import { buildEffectiveMaterials } from "@/src/lib/material-catalog";

const catalogImage = { id: "catalog-image", kind: "PRODUCT" as const, isPrimary: true, position: 0, width: 600, height: 600 };
const workspaceImage = { id: "workspace-image", kind: "PRODUCT" as const, isPrimary: true, position: 0, width: 800, height: 600 };
const baseCatalog = {
  id: "catalog-1", name: "Radiateur", brand: "Atlantic", reference: "RAD-1", description: null, specifications: {}, tags: [], unit: "u", defaultPurchasePriceCents: null, defaultSalePriceCents: null, supplier: null, active: true, isFixture: false, category: null, images: [catalogImage], workspaceMaterials: [],
};

test("expose l'image catalogue principale", () => {
  const [material] = buildEffectiveMaterials([baseCatalog], []);
  assert.equal(material.primaryImage?.id, "catalog-image");
  assert.equal(material.primaryImage?.url, "/api/material-images/catalog:catalog-image");
  assert.equal(material.imageCount, 1);
});

test("l'image workspace est prioritaire sans modifier l'image globale", () => {
  const override = { id: "workspace-1", catalogItemId: "catalog-1", name: null, brand: null, reference: null, description: null, specifications: null, tags: [], unit: null, purchasePriceCents: null, salePriceCents: null, supplier: null, favorite: false, active: true, images: [workspaceImage] };
  const [material] = buildEffectiveMaterials([{ ...baseCatalog, workspaceMaterials: [override] }], []);
  assert.equal(material.primaryImage?.id, "workspace-image");
  assert.equal(material.primaryImage?.url, "/api/material-images/workspace:workspace-image");
  assert.equal(material.imageCount, 2);
  assert.equal(baseCatalog.images[0].id, "catalog-image");
});

test("un matériel sans image utilise le placeholder côté composant", () => {
  const [material] = buildEffectiveMaterials([{ ...baseCatalog, images: [] }], []);
  assert.equal(material.primaryImage, null);
  assert.equal(material.imageCount, 0);
});

test("un matériel personnel expose uniquement son image workspace", () => {
  const custom = { id: "custom-1", catalogItemId: null, name: "Matériel personnel", brand: null, reference: null, description: null, specifications: null, tags: [], unit: "u", purchasePriceCents: null, salePriceCents: 2500, supplier: null, favorite: false, active: true, images: [workspaceImage] };
  const [material] = buildEffectiveMaterials([], [custom]);
  assert.equal(material.primaryImage?.url, "/api/material-images/workspace:workspace-image");
  assert.equal(material.imageCount, 1);
});
