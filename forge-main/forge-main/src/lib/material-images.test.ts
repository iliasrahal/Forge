import assert from "node:assert/strict";
import test from "node:test";

import { validateMaterialImage } from "@/src/lib/material-image-storage.server";
import { pickPrimaryMaterialImage } from "@/src/lib/material-images";

function pngFile(width = 120, height = 80, type = "image/png") {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47], 0);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return new File([bytes], "product.png", { type });
}

test("sélectionne l'image principale puis respecte sa position", () => {
  const selected = pickPrimaryMaterialImage([
    { id: "secondary", isPrimary: false, position: 0 },
    { id: "primary-later", isPrimary: true, position: 2 },
    { id: "primary-first", isPrimary: true, position: 1 },
  ]);
  assert.equal(selected?.id, "primary-first");
});

test("valide la signature, les dimensions et le checksum d'une image produit", async () => {
  const result = await validateMaterialImage(pngFile());
  assert.equal(result.mimeType, "image/png");
  assert.equal(result.width, 120);
  assert.equal(result.height, 80);
  assert.match(result.checksum, /^[a-f0-9]{64}$/);
});

test("refuse un MIME non autorisé et des dimensions déraisonnables", async () => {
  await assert.rejects(validateMaterialImage(pngFile(120, 80, "image/gif")), /INVALID_IMAGE_TYPE/);
  await assert.rejects(validateMaterialImage(pngFile(20, 20)), /INVALID_IMAGE_DIMENSIONS/);
});
