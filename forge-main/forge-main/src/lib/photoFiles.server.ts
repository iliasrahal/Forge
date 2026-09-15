export function isImage(file: File) {
  return file.type.startsWith("image/");
}

export async function fileToDataUrl(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return `data:${file.type};base64,${base64}`;
}

const IMAGE_SIGNATURES = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
];

export async function hasValidImageSignature(file: File) {
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const signature = IMAGE_SIGNATURES.find((entry) => entry.mime === file.type);
  if (!signature || !signature.bytes.every((byte, index) => header[index] === byte)) return false;
  if (file.type === "image/webp") {
    return String.fromCharCode(...header.slice(8, 12)) === "WEBP";
  }
  return true;
}
