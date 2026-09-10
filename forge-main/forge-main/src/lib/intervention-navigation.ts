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
  interventionId,
}: {
  context?: string;
  requestedClientId?: string;
  interventionClientId?: string | null;
  interventionId?: string;
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
  if (context === "home" && interventionId) {
    return `/app?selectedIntervention=${encodeURIComponent(interventionId)}`;
  }
  return "/app";
}
