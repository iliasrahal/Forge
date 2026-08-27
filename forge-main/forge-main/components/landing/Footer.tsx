import Link from "next/link";

import ForgeLogo from "@/components/ForgeLogo";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-8 text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-white lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row">
        <Link href="/" className="flex items-center gap-3 font-bold">
          <ForgeLogo size={34} />
          FORGE
        </Link>
        <p className="text-sm text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} Forge. Tous droits réservés.</p>
      </div>
    </footer>
  );
}
