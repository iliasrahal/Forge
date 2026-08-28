export function normalizePhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (/^0[1-9]\d{8}$/.test(digits)) {
    return `+33${digits.slice(1)}`;
  }

  if (/^33[1-9]\d{8}$/.test(digits)) {
    return `+${digits}`;
  }

  if (/^0033[1-9]\d{8}$/.test(digits)) {
    return `+33${digits.slice(4)}`;
  }

  return trimmed.startsWith("+")
    ? `+${digits}`
    : digits;
}

export function getPhoneSearchVariants(value: string) {
  const normalized = normalizePhone(value);
  const variants = new Set([normalized, value.trim(), value.replace(/\s+/g, "")]);

  if (/^\+33[1-9]\d{8}$/.test(normalized)) {
    const national = `0${normalized.slice(3)}`;
    variants.add(national);
    variants.add(`33${normalized.slice(3)}`);
    variants.add(`0033${normalized.slice(3)}`);
  }

  return [...variants].filter(Boolean);
}
