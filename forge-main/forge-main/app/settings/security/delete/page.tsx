"use client";


import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";




export default function DeleteAccountPage() {

  const router = useRouter();



  const [confirmed, setConfirmed] =
    useState(false);



  const [message, setMessage] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  async function handleDelete() {
    if (!confirmed || isLoading) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/auth/delete-account",
        { method: "DELETE" },
      );
      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Impossible de supprimer le compte.",
        );
      }

      localStorage.clear();
      router.push("/login");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant la suppression.",
      );
      setIsLoading(false);
    }
  }





  return (
    <main className="min-dvh bg-white px-6 py-8 text-slate-950 dark:bg-slate-950 dark:text-white">



      <section className="mx-auto max-w-xl">



        <Link
          href="/settings/security"
          className="forge-back-link text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Retour
        </Link>






        <h1 className="mt-6 text-3xl font-bold text-red-600">
          Supprimer mon compte
        </h1>






        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Cette action est définitive. Toutes tes données Forge seront supprimées.
        </p>








        <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">



          <h2 className="font-semibold text-red-700 dark:text-red-300">
            Attention
          </h2>




          <p className="mt-3 text-sm text-red-600 dark:text-red-300">
            Tu perdras tes clients, interventions, devis et informations personnelles.
          </p>






          <label className="mt-6 flex items-center gap-3 text-sm text-red-700 dark:text-red-300">



            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) =>
                setConfirmed(
                  event.target.checked,
                )
              }
              className="h-5 w-5"
            />




            <span>
              Je confirme vouloir supprimer définitivement mon compte Forge.
            </span>



          </label>







          <button
            type="button"
            disabled={!confirmed}
            onClick={handleDelete}
            className="
              mt-6
              w-full
              rounded-2xl
              bg-red-600
              px-5
              py-4
              font-semibold
              text-white
              transition
              hover:bg-red-700
              disabled:cursor-not-allowed
              disabled:bg-red-300
            "
          >
            {isLoading
              ? "Suppression..."
              : "Supprimer définitivement"}
          </button>




          {message && (
            <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-center text-sm font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              {message}
            </p>
          )}





        </div>






      </section>



    </main>
  );
}
