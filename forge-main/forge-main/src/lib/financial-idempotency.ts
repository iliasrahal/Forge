export function getFinancialCreationKey(request: Request, scope: string) {
  const raw = request.headers.get("Idempotency-Key")?.trim();
  if (!raw || raw.length < 8 || raw.length > 120 || !/^[a-zA-Z0-9:_-]+$/.test(raw)) return null;
  return `${scope}:${raw}`;
}
