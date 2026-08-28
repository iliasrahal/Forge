export function isImage(file: File) {
  return file.type.startsWith("image/");
}

export async function fileToDataUrl(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return `data:${file.type};base64,${base64}`;
}

