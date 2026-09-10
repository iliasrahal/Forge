export type InterventionReturnContext =
  | "home"
  | "planning"
  | "history"
  | "client";

export function buildInterventionHref(
  interventionId: string,
  context: InterventionReturnContext,
  clientId?: string,
) {
  const params = new URLSearchParams({ from: context });
  if (context === "client" && clientId) params.set("clientId", clientId);
  return `/interventions/${interventionId}?${params.toString()}`;
}

export function getInterventionReturnHref({
  context,
  requestedClientId,
  interventionClientId,
}: {
  context?: string;
  requestedClientId?: string;
  interventionClientId?: string | null;
}) {
  if (
    context === "client" &&
    requestedClientId &&
    requestedClientId === interventionClientId
  ) {
    return `/clients/${requestedClientId}`;
  }
  if (context === "planning") return "/app?planning=1";
  if (context === "history") return "/history";
  return "/app";
}
