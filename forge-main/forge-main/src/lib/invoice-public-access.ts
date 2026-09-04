import { createHash, randomBytes } from "node:crypto";

export function createInvoicePublicToken() {
  return randomBytes(32).toString("base64url");
}

export function hashInvoicePublicToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function cleanInvoicePublicToken(value: unknown) {
  if (typeof value !== "string") return null;
  const token = value.trim();
  return /^[A-Za-z0-9_-]{40,100}$/.test(token) ? token : null;
}
