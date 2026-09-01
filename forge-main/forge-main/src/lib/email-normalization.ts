export function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}
