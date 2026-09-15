export type MaterialImageView = {
  id: string;
  url: string;
  kind: "PRODUCT" | "DETAIL" | "NAMEPLATE" | "TECHNICAL";
  width: number;
  height: number;
  alt: string;
};

export function materialImageUrl(scope: "catalog" | "workspace", id: string) {
  return `/api/material-images/${scope}:${id}`;
}

export function pickPrimaryMaterialImage<T extends { isPrimary: boolean; position: number }>(images: T[]) {
  return [...images].sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary) || left.position - right.position)[0] ?? null;
}
