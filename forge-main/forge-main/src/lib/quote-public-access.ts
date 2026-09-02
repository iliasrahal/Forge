import { createHash, randomBytes } from "node:crypto";

export type PublicQuoteStatus = "BROUILLON" | "ENVOYE" | "ACCEPTE" | "REFUSE";

export function createQuotePublicToken() {
  return randomBytes(32).toString("base64url");
}

export function hashQuotePublicToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function cleanQuotePublicToken(value: unknown) {
  if (typeof value !== "string") return null;
  const token = value.trim();
  return /^[A-Za-z0-9_-]{40,100}$/.test(token) ? token : null;
}

export function getQuoteAcceptanceState(status: PublicQuoteStatus) {
  if (status === "ACCEPTE") {
    return { canAccept: false, alreadyAccepted: true, reason: null };
  }
  if (status === "ENVOYE") {
    return { canAccept: true, alreadyAccepted: false, reason: null };
  }
  return {
    canAccept: false,
    alreadyAccepted: false,
    reason:
      status === "REFUSE"
        ? "Ce devis a été refusé et ne peut plus être accepté."
        : "Ce devis n’est pas disponible à l’acceptation.",
  };
}
