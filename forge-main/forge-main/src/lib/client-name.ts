export function cleanPersonalClientName(value: string) {
  return value
    .replace(/\b(mme|monsieur|madame|mr|m)\b\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitPersonalClientName(value: string) {
  const parts = cleanPersonalClientName(value).split(" ").filter(Boolean);

  if (parts.length === 0) {
    return { firstName: null, lastName: null };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? null,
  };
}
