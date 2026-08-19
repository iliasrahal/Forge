"use client";


export default function ForgeProcessingCard() {
  return (
    <div className="flex w-full max-w-md flex-col items-center rounded-3xl bg-white p-8 shadow-lg dark:bg-slate-900 dark:shadow-black/20">


      <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-500" />



      <h2 className="text-center text-3xl font-bold leading-tight text-blue-600 dark:text-blue-400">
        Je te prépare ton compte rendu...
      </h2>



      <p className="mt-3 text-center text-gray-500 dark:text-slate-400">
        Ça ne prendra que quelques secondes.
      </p>


    </div>
  );
}