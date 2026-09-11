export const UNASSIGNED_QUOTE_CLIENT_ID = "sans-client";

export function getQuotePath(quote: {
  id: string;
  clientId?: string | null;
}) {
  return `/clients/${quote.clientId ?? UNASSIGNED_QUOTE_CLIENT_ID}/quotes/${quote.id}`;
}

export function getQuoteEditPath(quote: {
  id: string;
  clientId?: string | null;
}) {
  return `${getQuotePath(quote)}/edit`;
}

export function getQuoteInterventionPath(quote: {
  id: string;
  clientId?: string | null;
  title: string;
  description?: string | null;
}) {
  const params = new URLSearchParams({ title: quote.title, quoteId: quote.id });
  if (quote.description) params.set("description", quote.description);
  return `/clients/${quote.clientId ?? UNASSIGNED_QUOTE_CLIENT_ID}/interventions/new?${params.toString()}`;
}

export function getQuoteClientName(
  client: {
    type: string;
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string | null;
  } | null,
) {
  if (!client) return "Aucun client associé";

  if (client.type === "PROFESSIONNEL") {
    return client.companyName?.trim() || "Client professionnel";
  }

  return (
    `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() ||
    "Client sans nom"
  );
}
