import Stripe from "stripe";

let cached: Stripe | null = null;

/** Client Stripe (compte plateforme Forge). Lève si la clé n'est pas configurée. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY manquant : les paiements en ligne ne sont pas configurés.",
    );
  }
  if (!cached) {
    cached = new Stripe(key, { typescript: true });
  }
  return cached;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
