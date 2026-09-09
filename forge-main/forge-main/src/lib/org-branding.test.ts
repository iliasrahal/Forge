import assert from "node:assert/strict";
import test from "node:test";

import {
  isValidLogoDataUrl,
  logoBytesFromDataUrl,
  logoFormatFromDataUrl,
} from "./org-branding";

const PNG_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgDTD2qgAAAAASUVORK5CYII=";

test("isValidLogoDataUrl : accepte un PNG data URL, refuse le reste", () => {
  assert.equal(isValidLogoDataUrl(PNG_1PX), true);
  assert.equal(isValidLogoDataUrl("data:image/gif;base64,AAAA"), false);
  assert.equal(isValidLogoDataUrl("https://exemple.fr/logo.png"), false);
  assert.equal(isValidLogoDataUrl(null), false);
  assert.equal(isValidLogoDataUrl("data:image/png;base64," + "A".repeat(800_000)), false);
});

test("logoFormatFromDataUrl", () => {
  assert.equal(logoFormatFromDataUrl(PNG_1PX), "png");
  assert.equal(
    logoFormatFromDataUrl("data:image/jpeg;base64,/9j/4AAQ"),
    "jpeg",
  );
  assert.equal(
    logoFormatFromDataUrl("data:image/jpg;base64,/9j/4AAQ"),
    "jpeg",
  );
  assert.equal(logoFormatFromDataUrl("nope"), null);
});

test("logoBytesFromDataUrl : renvoie un buffer non vide", () => {
  const bytes = logoBytesFromDataUrl(PNG_1PX);
  assert.ok(bytes && bytes.length > 0);
});
