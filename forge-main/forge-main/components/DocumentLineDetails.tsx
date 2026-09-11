import { formatQuantity, formatUnit } from "@/src/lib/document-lines";

type DocumentLineDetail = {
  id?: string;
  label: string;
  description?: string | null;
  quantityMilli?: number | null;
  unit?: string | null;
  unitPriceCents?: number | null;
  amountCents?: number | null;
};

type Props = {
  details: DocumentLineDetail[];
  formatAmount: (amountCents: number) => string;
};

export default function DocumentLineDetails({ details, formatAmount }: Props) {
  if (details.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5 border-l-2 border-blue-300/50 pl-3 dark:border-blue-700/50">
      {details.map((detail, index) => (
        <div key={detail.id ?? index} className="flex min-w-0 items-start justify-between gap-3 text-xs">
          <span className="min-w-0 text-slate-600 dark:text-slate-300">
            <span className="block break-words font-medium">{detail.label}</span>
            {detail.description ? (
              <span className="mt-0.5 block break-words text-slate-500 dark:text-slate-400">
                {detail.description}
              </span>
            ) : null}
            {detail.unitPriceCents != null && detail.quantityMilli != null && detail.unit ? (
              <span className="mt-0.5 block tabular-nums text-slate-500 dark:text-slate-400">
                {formatQuantity(detail.quantityMilli)} {formatUnit(detail.unit)} ×{" "}
                {formatAmount(detail.unitPriceCents)}
              </span>
            ) : null}
          </span>
          {detail.amountCents != null ? (
            <span className="shrink-0 font-medium text-slate-700 dark:text-slate-200">
              {formatAmount(detail.amountCents)}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
