"use client";

export default function ForgeProcessingCard() {
  return (
    <div className="forge-surface flex w-full max-w-md flex-col items-center rounded-3xl bg-white p-8 shadow-lg dark:bg-slate-900 dark:shadow-black/20">
      
      {/* Spinner de chargement */}
      <div
        className="
          mb-6
          h-16
          w-16
          animate-spin
          rounded-full
          border-4
          border-blue-200
          border-t-blue-600
          border-r-transparent
          dark:border-blue-950
          dark:border-t-blue-400
          dark:border-r-transparent
        "
        role="status"
        aria-label="Préparation du compte rendu"
      />

      <h2 className="text-center text-3xl font-bold leading-tight text-blue-600 dark:text-blue-400">
        Je te prépare ton compte rendu...
      </h2>

      <p className="mt-3 text-center text-gray-500 dark:text-slate-400">
        Ça ne prendra que quelques secondes.
      </p>
    </div>
  );
}