"use client";


import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";



export default function AppearancePage() {


  const { setTheme, theme } = useTheme();


  const [mounted, setMounted] = useState(false);



  useEffect(() => {
    setMounted(true);
  }, []);

  function selectTheme(nextTheme: "light" | "dark") {
    setTheme(nextTheme);

    void fetch("/api/settings/theme", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: nextTheme }),
    });
  }




  if (!mounted) {
    return null;
  }




  return (
    <main className="min-h-dvh bg-white px-6 py-8 text-slate-950 dark:bg-slate-950 dark:text-white">


      <section className="mx-auto max-w-xl">



        <Link
          href="/settings"
          className="forge-back-link text-sm font-semibold text-blue-700 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Retour
        </Link>




        <h1 className="mt-6 text-3xl font-bold text-blue-700 dark:text-blue-400">
          Apparence
        </h1>




        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Choisis l'apparence de Forge.
        </p>




        <div className="mt-8 space-y-3">



          <button
            type="button"
            onClick={() => selectTheme("light")}
            className={`w-full rounded-2xl border px-5 py-4 text-left font-semibold transition ${
              theme === "light"
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                : "border-slate-200 bg-white text-slate-900 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-blue-500"
            }`}
          >
            Clair
          </button>




          <button
            type="button"
            onClick={() => selectTheme("dark")}
            className={`w-full rounded-2xl border px-5 py-4 text-left font-semibold transition ${
              theme === "dark"
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                : "border-slate-200 bg-white text-slate-900 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-blue-500"
            }`}
          >
            Sombre
          </button>



        </div>



      </section>


    </main>
  );
}
