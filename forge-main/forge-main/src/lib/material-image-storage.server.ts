import { createHash, randomUUID } from "node:crypto";

import { hasValidImageSignature } from "@/src/lib/photoFiles.server";

export const MAX_MATERIAL_IMAGE_SIZE = 5 * 1024 * 1024;
export const MATERIAL_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MATERIAL_CATALOG_IMAGE_BUCKET = process.env.MATERIAL_CATALOG_IMAGE_BUCKET?.trim() || "forge-material-catalog";
export const WORKSPACE_MATERIAL_IMAGE_BUCKET = process.env.WORKSPACE_MATERIAL_IMAGE_BUCKET?.trim() || "forge-workspace-materials";

function storageConfig() {
  const baseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!baseUrl || !serviceKey) throw new Error("MATERIAL_STORAGE_NOT_CONFIGURED");
  return { baseUrl, serviceKey };
}

function imageDimensions(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/png" && buffer.length >= 24) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (mimeType === "image/webp" && buffer.length >= 30) {
    const format = buffer.toString("ascii", 12, 16);
    if (format === "VP8X") return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
    if (format === "VP8 " && buffer.length >= 30) return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    if (format === "VP8L" && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21);
      return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
    }
  }
  if (mimeType === "image/jpeg") {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      if (length < 2) break;
      offset += 2 + length;
    }
  }
  return null;
}

export async function validateMaterialImage(file: File) {
  if (!MATERIAL_IMAGE_MIME_TYPES.includes(file.type as typeof MATERIAL_IMAGE_MIME_TYPES[number])) throw new Error("INVALID_IMAGE_TYPE");
  if (!file.size || file.size > MAX_MATERIAL_IMAGE_SIZE) throw new Error("INVALID_IMAGE_SIZE");
  if (!(await hasValidImageSignature(file))) throw new Error("INVALID_IMAGE_SIGNATURE");
  const buffer = Buffer.from(await file.arrayBuffer());
  const dimensions = imageDimensions(buffer, file.type);
  if (!dimensions || dimensions.width < 64 || dimensions.height < 64 || dimensions.width > 8000 || dimensions.height > 8000) throw new Error("INVALID_IMAGE_DIMENSIONS");
  return { buffer, mimeType: file.type, ...dimensions, checksum: createHash("sha256").update(buffer).digest("hex") };
}

export function workspaceMaterialObjectKey(organizationId: string, workspaceMaterialId: string, mimeType: string) {
  const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  return `${organizationId}/${workspaceMaterialId}/${randomUUID()}.${extension}`;
}

function storageSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "inconnu";
}

export function catalogMaterialObjectKey(brand: string, reference: string, kind: string, checksum: string, mimeType: string) {
  const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  return `${storageSlug(brand)}/${storageSlug(reference)}/${storageSlug(kind)}-${checksum.slice(0, 16)}.${extension}`;
}

async function storageRequest(bucket: string, objectKey: string, init: RequestInit) {
  const { baseUrl, serviceKey } = storageConfig();
  return fetch(`${baseUrl}/storage/v1/object/${bucket}/${objectKey.split("/").map(encodeURIComponent).join("/")}`, {
    ...init,
    headers: { authorization: `Bearer ${serviceKey}`, apikey: serviceKey, ...(init.headers || {}) },
  });
}

export async function uploadMaterialImage(bucket: string, objectKey: string, buffer: Buffer, mimeType: string) {
  const response = await storageRequest(bucket, objectKey, { method: "POST", headers: { "content-type": mimeType, "x-upsert": "false" }, body: new Uint8Array(buffer) });
  if (!response.ok) throw new Error("MATERIAL_STORAGE_UPLOAD_FAILED");
}

export async function deleteMaterialImage(bucket: string, objectKey: string) {
  await storageRequest(bucket, objectKey, { method: "DELETE" }).catch(() => undefined);
}

export async function createMaterialImageSignedUrl(bucket: string, objectKey: string) {
  const { baseUrl, serviceKey } = storageConfig();
  const response = await fetch(`${baseUrl}/storage/v1/object/sign/${bucket}/${objectKey.split("/").map(encodeURIComponent).join("/")}`, {
    method: "POST",
    headers: { authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "content-type": "application/json" },
    body: JSON.stringify({ expiresIn: 300 }),
  });
  if (!response.ok) throw new Error("MATERIAL_STORAGE_SIGN_FAILED");
  const payload = await response.json() as { signedURL?: string; signedUrl?: string };
  const signedPath = payload.signedURL || payload.signedUrl;
  if (!signedPath) throw new Error("MATERIAL_STORAGE_SIGN_FAILED");
  return signedPath.startsWith("http") ? signedPath : `${baseUrl}/storage/v1${signedPath.startsWith("/") ? signedPath : `/${signedPath}`}`;
}
