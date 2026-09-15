import { readFile } from "node:fs/promises";
import { extname } from "node:path";

import { prisma } from "@/src/lib/prisma";
import {
  catalogMaterialObjectKey,
  deleteMaterialImage,
  MATERIAL_CATALOG_IMAGE_BUCKET,
  uploadMaterialImage,
  validateMaterialImage,
} from "@/src/lib/material-image-storage.server";

const SOURCE_TYPES = ["MANUFACTURER", "AUTHORIZED_SUPPLIER", "AUTHORIZED_IMPORT"] as const;
const IMAGE_KINDS = ["PRODUCT", "DETAIL", "NAMEPLATE", "TECHNICAL"] as const;

function argumentsMap(values: string[]) {
  const result = new Map<string, string>();
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    if (!key.startsWith("--")) continue;
    const following = values[index + 1];
    if (!following || following.startsWith("--")) result.set(key.slice(2), "true");
    else { result.set(key.slice(2), following); index += 1; }
  }
  return result;
}

function required(args: Map<string, string>, name: string) {
  const value = args.get(name)?.trim();
  if (!value) throw new Error(`Argument obligatoire manquant : --${name}`);
  return value;
}

function mimeTypeFor(path: string) {
  const extension = extname(path).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  throw new Error("Le fichier doit être au format JPEG, PNG ou WebP.");
}

async function main() {
  const args = argumentsMap(process.argv.slice(2));
  if (args.get("confirm-authorized-image") !== "true") {
    throw new Error("Ajoute --confirm-authorized-image pour confirmer que Forge est autorisé à utiliser cette image.");
  }

  const catalogItemId = required(args, "catalog-item-id");
  const filePath = required(args, "file");
  const sourceType = required(args, "source-type");
  const sourceName = required(args, "source-name");
  const sourceUrl = required(args, "source-url");
  const license = required(args, "license");
  const kind = (args.get("kind")?.trim() || "PRODUCT").toUpperCase();
  const position = Number.parseInt(args.get("position") || "0", 10);
  const isPrimary = args.get("primary") === "true";

  if (!SOURCE_TYPES.includes(sourceType as typeof SOURCE_TYPES[number])) throw new Error(`--source-type doit valoir ${SOURCE_TYPES.join(", ")}.`);
  if (!IMAGE_KINDS.includes(kind as typeof IMAGE_KINDS[number])) throw new Error(`--kind doit valoir ${IMAGE_KINDS.join(", ")}.`);
  if (!Number.isInteger(position) || position < 0) throw new Error("--position doit être un entier positif.");
  const parsedSourceUrl = new URL(sourceUrl);
  if (parsedSourceUrl.protocol !== "https:" && parsedSourceUrl.protocol !== "http:") throw new Error("--source-url doit être une URL HTTP(S) de provenance.");

  const item = await prisma.materialCatalogItem.findUnique({
    where: { id: catalogItemId },
    select: { id: true, name: true, brand: true, reference: true, isFixture: true },
  });
  if (!item) throw new Error("Référence catalogue introuvable.");
  if (item.isFixture) throw new Error("L’import d’une image sur une fixture Forge Test est interdit.");
  if (!item.brand || !item.reference) throw new Error("La référence doit posséder une marque et une référence fabricant avant l’import.");

  const bytes = await readFile(filePath);
  const mimeType = mimeTypeFor(filePath);
  const validated = await validateMaterialImage(new File([bytes], "catalog-image", { type: mimeType }));
  const duplicate = await prisma.materialCatalogImage.findUnique({
    where: { materialCatalogItemId_checksum: { materialCatalogItemId: item.id, checksum: validated.checksum } },
    select: { id: true },
  });
  if (duplicate) throw new Error(`Cette image est déjà associée à la référence (image ${duplicate.id}).`);

  const objectKey = catalogMaterialObjectKey(item.brand, item.reference, kind, validated.checksum, validated.mimeType);
  let uploaded = false;
  try {
    await uploadMaterialImage(MATERIAL_CATALOG_IMAGE_BUCKET, objectKey, validated.buffer, validated.mimeType);
    uploaded = true;
    const image = await prisma.$transaction(async (tx) => {
      const count = await tx.materialCatalogImage.count({ where: { materialCatalogItemId: item.id } });
      const makePrimary = isPrimary || count === 0;
      if (makePrimary) await tx.materialCatalogImage.updateMany({ where: { materialCatalogItemId: item.id }, data: { isPrimary: false } });
      return tx.materialCatalogImage.create({ data: {
        materialCatalogItemId: item.id,
        objectKey,
        kind: kind as typeof IMAGE_KINDS[number],
        isPrimary: makePrimary,
        position,
        sourceType: sourceType as typeof SOURCE_TYPES[number],
        sourceName,
        sourceUrl: parsedSourceUrl.toString(),
        license,
        mimeType: validated.mimeType,
        width: validated.width,
        height: validated.height,
        checksum: validated.checksum,
      } });
    });
    console.log(`Image catalogue importée : ${image.id} · ${item.name} · ${objectKey}`);
  } catch (error) {
    if (uploaded) await deleteMaterialImage(MATERIAL_CATALOG_IMAGE_BUCKET, objectKey);
    throw error;
  }
}

main()
  .catch((error) => { console.error(error instanceof Error ? error.message : "Import impossible."); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
