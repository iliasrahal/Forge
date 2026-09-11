export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Chargement de la page"
      className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-6"
    >
      <div className="h-1 w-full overflow-hidden rounded-full bg-blue-500/10">
        <div className="forge-route-progress h-full w-1/3 rounded-full bg-gradient-to-r from-blue-500 to-pink-500" />
      </div>
      <div className="mt-5 space-y-3" aria-hidden="true">
        <div className="h-12 animate-pulse rounded-2xl bg-white/20 dark:bg-slate-900/20" />
        <div className="h-24 animate-pulse rounded-3xl bg-white/15 dark:bg-slate-900/15" />
        <div className="h-24 animate-pulse rounded-3xl bg-white/15 dark:bg-slate-900/15" />
      </div>
    </main>
  );
}
