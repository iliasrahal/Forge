import { revalidatePath } from "next/cache";

export type StatusEntity = "quote" | "invoice" | "intervention";

/**
 * Invalide les vues de consultation susceptibles d'afficher un statut métier.
 * Le rafraîchissement client reste centralisé dans StatusAutoRefresh.
 */
export function revalidateStatusViews(
  entity: StatusEntity,
  entityId?: string,
  clientId?: string | null,
) {
  revalidatePath("/app");
  revalidatePath("/clients", "layout");
  revalidatePath("/history");

  if (entity === "quote") {
    revalidatePath("/quotes", "layout");
    if (entityId) {
      revalidatePath(
        `/clients/${clientId ?? "sans-client"}/quotes/${entityId}`,
      );
    }
    return;
  }

  if (entity === "invoice") {
    revalidatePath("/invoices", "layout");
    if (entityId) revalidatePath(`/invoices/${entityId}`);
    return;
  }

  revalidatePath("/interventions", "layout");
  if (entityId) revalidatePath(`/interventions/${entityId}`);
}
