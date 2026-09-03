export function normalizeClientEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidClientEmail(value: unknown) {
  const email = normalizeClientEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function resolveClientEmail(input: {
  explicitEmail?: unknown;
  clientEmail?: unknown;
}) {
  if (isValidClientEmail(input.explicitEmail)) {
    return normalizeClientEmail(input.explicitEmail);
  }

  if (isValidClientEmail(input.clientEmail)) {
    return normalizeClientEmail(input.clientEmail);
  }

  return null;
}
