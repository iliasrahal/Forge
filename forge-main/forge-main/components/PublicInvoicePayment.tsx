"use client";

import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { ArrowLeft, Building2, CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";

type Props = {
  token: string;
  remainingCents: number;
};

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function formatEur(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function PublicInvoicePayment({ token, remainingCents }: Props) {
  const [pending, setPending] = useState<"card" | "bank_transfer" | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function pay(method: "card" | "bank_transfer") {
    if (pending) return;
    setPending(method);
    setError("");
    try {
      const response = await fetch(
        `/api/public/invoices/${token}/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method }),
        },
      );
      const data = await response.json();
      if (!response.ok || !data.clientSecret) {
        throw new Error(data.error || "Le paiement n’a pas pu démarrer.");
      }
      setClientSecret(data.clientSecret);
    } catch (payError) {
      setError(
        payError instanceof Error
          ? payError.message
          : "Le paiement n’a pas pu démarrer.",
      );
      setPending(null);
    }
  }

  if (clientSecret && stripePromise) {
    return (
      <section className="mt-6 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)] p-5">
        <button
          type="button"
          onClick={() => {
            setClientSecret(null);
            setPending(null);
          }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)]"
        >
          <ArrowLeft size={15} />
          Changer de moyen de paiement
        </button>
        <div className="mt-4 overflow-hidden rounded-xl">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{
              clientSecret,
              onComplete: () => {
                window.location.href = `/facture/${token}?paid=1`;
              },
            }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)] p-5">
      <p className="text-sm font-semibold text-[var(--forge-text-primary)]">
        Payer {formatEur(remainingCents)}
      </p>
      <p className="mt-1 text-xs text-[var(--forge-text-muted)]">
        Paiement sécurisé par Stripe, directement ici. Le statut de la facture
        est mis à jour automatiquement.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => pay("card")}
          disabled={pending !== null}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-pink-500 px-4 font-bold text-white transition hover:opacity-95 disabled:opacity-60"
        >
          {pending === "card" ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <CreditCard size={17} />
          )}
          Carte bancaire
        </button>
        <button
          type="button"
          onClick={() => pay("bank_transfer")}
          disabled={pending !== null}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--forge-border)] px-4 font-semibold text-[var(--forge-text-primary)] transition hover:bg-[var(--forge-surface-hover)] disabled:opacity-60"
        >
          {pending === "bank_transfer" ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Building2 size={17} />
          )}
          Virement bancaire
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm font-medium text-red-500">{error}</p>
      ) : null}
    </section>
  );
}
