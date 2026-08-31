import Link from "next/link";

export default function SubViewShell({
  userId,
  title,
  count,
  children,
}: {
  userId: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <Link
        href={`/admin/users/${userId}`}
        className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
      >
        ← Retour à la fiche
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{title}</h1>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {count} au total
        </span>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">{children}</table>
      </div>
      <p className="text-xs text-slate-400">
        Lecture seule · 100 lignes les plus récentes.
      </p>
    </div>
  );
}
