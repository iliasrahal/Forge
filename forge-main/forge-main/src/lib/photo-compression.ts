const MAX_EDGE = 1800;
const JPEG_QUALITY = 0.82;

export async function compressPhoto(file: File): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) return file;
  let source: CanvasImageSource;
  let width: number;
  let height: number;
  let closeSource: () => void = () => {};
  try {
    const bitmap = await createImageBitmap(file);
    source = bitmap;
    width = bitmap.width;
    height = bitmap.height;
    closeSource = () => bitmap.close();
  } catch {
    // Safari sait afficher HEIC depuis Safari 17 même si createImageBitmap ne
    // le décode pas toujours. L'élément image fournit alors un repli canvas.
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    try {
      await image.decode();
    } catch {
      URL.revokeObjectURL(objectUrl);
      throw new Error("PHOTO_FORMAT_UNSUPPORTED");
    }
    source = image;
    width = image.naturalWidth;
    height = image.naturalHeight;
    closeSource = () => URL.revokeObjectURL(objectUrl);
  }
  const ratio = Math.min(1, MAX_EDGE / Math.max(width, height));
  if (ratio === 1 && file.size < 2_000_000 && (file.type === "image/jpeg" || file.type === "image/webp")) {
    closeSource();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.max(1, Math.round(height * ratio));
  const context = canvas.getContext("2d");
  if (!context) { closeSource(); throw new Error("PHOTO_CONVERSION_FAILED"); }
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  closeSource();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  if (!blob) throw new Error("PHOTO_CONVERSION_FAILED");
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg", lastModified: file.lastModified });
}
