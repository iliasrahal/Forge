type InterventionReport = {
  intervention: string;
  diagnostic: string;
  travaux: string;
  recommandation: string;
};



type ForgeReportCardProps = {
  report: InterventionReport;
  onEdit?: () => void;
  onValidate?: () => void;
  isValidating?: boolean;
  error?: string;
};
export default function ForgeReportCard({
  report,
  onEdit,
  onValidate,
  isValidating = false,
  error = "",
}: ForgeReportCardProps) {
  return (
    <div className="w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-10 shadow-lg dark:bg-slate-900 dark:shadow-black/20">

      <div className="mb-6 sm:mb-8">
        <h2 className="text-center text-2xl font-bold text-blue-700 dark:text-blue-400">
          Ton compte rendu est prêt
        </h2>
      </div>

      {/* Contenu défilable afin que la zone des boutons reste visible */}
      <div className="max-h-[60vh] overflow-auto pr-4">
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-blue-700 dark:text-blue-400">
              Intervention réalisée
            </h3>

            <p className="mt-1 whitespace-pre-line text-gray-600 dark:text-slate-300">
              {report.intervention}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-blue-700 dark:text-blue-400">
              Diagnostic
            </h3>

            <p className="mt-1 whitespace-pre-line text-gray-600 dark:text-slate-300">
              {report.diagnostic}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-blue-700 dark:text-blue-400">
              Travaux effectués
            </h3>

            <p className="mt-1 whitespace-pre-line text-gray-600 dark:text-slate-300">
              {report.travaux}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-blue-700 dark:text-blue-400">
              Recommandation
            </h3>

            <p className="mt-1 whitespace-pre-line text-gray-600 dark:text-slate-300">
              {report.recommandation}
            </p>
          </div>
        </div>
      </div>

      {/* Barre d'actions collante pour rester visible */}
      <div className="mt-6 sticky bottom-0 bg-white dark:bg-slate-900 pt-4 sm:pt-6">
        {error && (
          <p
            role="alert"
            className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onEdit}
            disabled={isValidating}
            className="rounded-xl border border-blue-600 px-5 py-2 font-medium text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
          >
            Modifier
          </button>

          <button
            type="button"
            onClick={onValidate}
            disabled={isValidating}
            aria-busy={isValidating}
            className="min-h-12 touch-manipulation rounded-xl bg-blue-600 px-7 py-3 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
          >
            {isValidating
              ? "Validation…"
              : "Valider"}
          </button>
        </div>
      </div>
    </div>
  );
}
