import { formatPdfAmount, renderBusinessDocumentPdf } from "@/src/lib/document-pdf";
import { computeInvoicePaymentState, formatPaymentMethod } from "@/src/lib/payments";
import { prisma } from "@/src/lib/prisma";
import { getQuoteIssuerLines, quoteIssuerOrganizationSelect } from "@/src/lib/quote-issuer";
import { computeDocumentTotals, formatVatRateBp, VAT_EXEMPTION_MENTION } from "@/src/lib/vat";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";
import { formatInvoiceDocumentType } from "@/src/lib/invoice-types";

type PdfRouteProps = { params: Promise<{ id: string }> };
const formatDate = (date: Date) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(date);

export async function GET(_request: Request, { params }: PdfRouteProps) {
  try {
    const workspaceContext = await requireWorkspaceContext("read");
    const { id } = await params;
    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId: workspaceContext.workspace.id },
      include: {
        client: true, quote: true, organization: { select: quoteIssuerOrganizationSelect },
        lines: { include: { details: { orderBy: { position: "asc" } } } },
        payments: { select: { status: true, amountCents: true, feeCents: true, refundedCents: true, paidAt: true } },
      },
    });
    if (!invoice) return new Response("Facture introuvable", { status: 404 });

    const netDueCents = Math.max(0, invoice.amountCents - Math.max(0, invoice.retentionCents));
    const payment = computeInvoicePaymentState(netDueCents, invoice.payments);
    const totals = computeDocumentTotals(invoice.lines, invoice.vatApplicable, invoice.discountBp);
    const clientName = invoice.client.type === "PARTICULIER"
      ? [invoice.client.firstName, invoice.client.lastName].filter(Boolean).join(" ")
      : invoice.client.companyName ?? "";
    const clientLines = [clientName, invoice.client.street, [invoice.client.postalCode, invoice.client.city].filter(Boolean).join(" "), invoice.client.phone, invoice.client.email].filter((value): value is string => Boolean(value?.trim()));
    const kindLabel = formatInvoiceDocumentType(invoice.type);
    const summaryRows = invoice.vatApplicable
      ? [
          { label: "Total HT", value: formatPdfAmount(totals.totalHtCents || invoice.totalHtCents) },
          ...(invoice.discountBp > 0 ? [{ label: "Remise globale", value: `${(invoice.discountBp / 100).toLocaleString("fr-FR")} %` }] : []),
          ...totals.byRate.map((entry) => ({ label: `TVA ${formatVatRateBp(entry.rateBp)}`, value: formatPdfAmount(entry.vatCents) })),
          { label: "TOTAL TTC", value: formatPdfAmount(invoice.amountCents), emphasized: true },
        ]
      : [
          ...(invoice.discountBp > 0 ? [{ label: "Remise globale", value: `${(invoice.discountBp / 100).toLocaleString("fr-FR")} %` }] : []),
          { label: "TOTAL", value: formatPdfAmount(invoice.amountCents), emphasized: true },
        ];
    if (invoice.retentionCents > 0) {
      summaryRows.push({ label: "Retenue de garantie", value: `- ${formatPdfAmount(invoice.retentionCents)}` });
      summaryRows.push({ label: "NET À PAYER", value: formatPdfAmount(netDueCents), emphasized: true });
    }
    if (payment.collectedCents > 0) {
      summaryRows.push({ label: "Déjà réglé", value: formatPdfAmount(payment.collectedCents) });
      summaryRows.push({ label: "RESTE À PAYER", value: formatPdfAmount(payment.remainingCents), emphasized: true });
    }
    const paymentLines = [
      invoice.type === "DEPOSIT" && invoice.quote ? `Acompte relatif au devis ${invoice.quote.reference}` : "",
      invoice.paymentMethod ? `Mode de paiement : ${formatPaymentMethod(invoice.paymentMethod)}` : "",
      payment.isFullyPaid ? "Statut de paiement : Payée" : "",
    ].filter(Boolean);
    const bytes = await renderBusinessDocumentPdf({
      kindLabel, reference: invoice.reference, logoDataUrl: invoice.organization?.logoDataUrl,
      issuerLines: getQuoteIssuerLines(invoice.organization), clientLines,
      metadata: [
        { label: "Date", value: formatDate(invoice.createdAt) },
        { label: "Échéance", value: invoice.dueDate ? formatDate(invoice.dueDate) : null },
        { label: "Statut", value: invoice.status.replaceAll("_", " ") },
      ],
      title: invoice.title, lines: invoice.lines, summaryRows, paymentLines,
      legalLines: invoice.vatApplicable ? [] : [VAT_EXEMPTION_MENTION],
    });
    const safeReference = invoice.reference.replace(/[^a-zA-Z0-9-_]/g, "-");
    return new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="facture-${safeReference}.pdf"`, "Cache-Control": "no-store" } });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return Response.json(accessError.body, { status: accessError.status });
    console.error("ERREUR PDF FACTURE :", error);
    return new Response("Erreur génération PDF facture", { status: 500 });
  }
}
