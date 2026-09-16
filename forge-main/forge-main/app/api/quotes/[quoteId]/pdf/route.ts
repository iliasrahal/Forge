import { formatPdfAmount, renderBusinessDocumentPdf } from "@/src/lib/document-pdf";
import { prisma } from "@/src/lib/prisma";
import { getQuoteIssuerLines, quoteIssuerOrganizationSelect } from "@/src/lib/quote-issuer";
import { parseQuoteSignatureSnapshot, shortIntegrityReference, validateDrawnSignature } from "@/src/lib/quote-signature";
import { computeDocumentTotals, formatVatRateBp, VAT_EXEMPTION_MENTION } from "@/src/lib/vat";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

type PdfRouteProps = { params: Promise<{ quoteId: string }> };
const formatDate = (date: Date) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
const formatDateTime = (date: Date) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
function useful(value?: string | null) {
  const text = value?.trim() ?? "";
  return /^(non (précisé|renseigné)|aucune? description renseignée)\.?$/i.test(text) ? "" : text;
}
function getClientLines(client: { type: string; firstName: string | null; lastName: string | null; companyName: string | null; street: string | null; postalCode: string | null; city: string | null; phone: string | null; email: string | null } | null) {
  if (!client) return [];
  const name = client.type === "PARTICULIER" ? [client.firstName, client.lastName].filter(Boolean).join(" ") : client.companyName;
  return [name, client.street, [client.postalCode, client.city].filter(Boolean).join(" "), client.phone, client.email].map(useful).filter(Boolean);
}

export async function GET(_request: Request, { params }: PdfRouteProps) {
  try {
    const workspaceContext = await requireWorkspaceContext("read");
    const { quoteId } = await params;
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, organizationId: workspaceContext.workspace.id },
      include: { client: true, organization: { select: quoteIssuerOrganizationSelect }, lines: { include: { details: { orderBy: { position: "asc" } } } }, signature: true },
    });
    if (!quote) return new Response("Devis introuvable.", { status: 404 });

    const signed = quote.signature ? parseQuoteSignatureSnapshot(quote.signature.quoteSnapshot) : null;
    const reference = signed?.reference ?? quote.reference;
    const title = signed?.title ?? quote.title;
    const lines = signed?.lines ?? quote.lines;
    const amountCents = signed?.amountCents ?? quote.amountCents;
    const totals = computeDocumentTotals(lines.map((line) => ({ amountCents: line.amountCents, vatRateBp: "vatRateBp" in line && typeof line.vatRateBp === "number" ? line.vatRateBp : 0 })), quote.vatApplicable, quote.discountBp);
    const summaryRows = quote.vatApplicable
      ? [
          { label: "Total HT", value: formatPdfAmount(totals.totalHtCents || quote.totalHtCents) },
          ...(quote.discountBp > 0 ? [{ label: "Remise globale", value: `${(quote.discountBp / 100).toLocaleString("fr-FR")} %` }] : []),
          ...totals.byRate.map((entry) => ({ label: `TVA ${formatVatRateBp(entry.rateBp)}`, value: formatPdfAmount(entry.vatCents) })),
          { label: "TOTAL TTC", value: formatPdfAmount(amountCents), emphasized: true },
        ]
      : [...(quote.discountBp > 0 ? [{ label: "Remise globale", value: `${(quote.discountBp / 100).toLocaleString("fr-FR")} %` }] : []), { label: "TOTAL", value: formatPdfAmount(amountCents), emphasized: true }];
    const parsedSignature = quote.signature ? validateDrawnSignature(quote.signature.signatureData) : null;
    const signature = quote.signature
      ? { title: "Devis accepté et signé", lines: [`Signataire : ${quote.signature.signerFirstName} ${quote.signature.signerLastName}`.trim(), `Signé le : ${formatDateTime(quote.signature.signedAt)}`, `Référence de preuve : ${shortIntegrityReference(quote.signature.integrityHash)}`], drawing: parsedSignature?.signature ?? null }
      : { title: "Bon pour accord", lines: ["Date :", "Signature du client précédée de la mention « Bon pour accord » :"] };
    const bytes = await renderBusinessDocumentPdf({
      kindLabel: "DEVIS", reference, logoDataUrl: quote.organization?.logoDataUrl,
      issuerLines: getQuoteIssuerLines(quote.organization), clientLines: getClientLines(signed?.client ?? quote.client),
      metadata: [{ label: "Date", value: formatDate(quote.createdAt) }, { label: "Statut", value: quote.status.replaceAll("_", " ") }],
      title: useful(title), lines, summaryRows, legalLines: quote.vatApplicable ? [] : [VAT_EXEMPTION_MENTION], signature,
    });
    const safeReference = reference.replace(/[^a-zA-Z0-9-_]/g, "-");
    return new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="devis-${safeReference}.pdf"`, "Cache-Control": "no-store" } });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return Response.json(accessError.body, { status: accessError.status });
    console.error("ERREUR GENERATION PDF :", error);
    return Response.json({ error: error instanceof Error ? error.message : "Erreur inconnue" }, { status: 500 });
  }
}
