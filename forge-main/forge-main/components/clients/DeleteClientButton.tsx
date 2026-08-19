"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";


type DeleteClientButtonProps = {
  clientId: string;
};


export default function DeleteClientButton({
  clientId,
}: DeleteClientButtonProps) {

  const router = useRouter();

  const [loading, setLoading] = useState(false);



  async function handleDelete() {

    const confirmed = window.confirm(
      "Es-tu sûr de vouloir supprimer ce client ?",
    );


    if (!confirmed) {
      return;
    }


    setLoading(true);


    try {

      const response = await fetch(
        `/api/clients/${clientId}`,
        {
          method: "DELETE",
        },
      );


      const data = await response.json();


      if (!response.ok) {

        alert(
          data.error ??
          "Impossible de supprimer ce client.",
        );

        return;
      }


      router.push("/clients");

      router.refresh();


    } catch (error) {

      console.error(
        "Erreur suppression client :",
        error,
      );


      alert(
        "Une erreur est survenue pendant la suppression.",
      );


    } finally {

      setLoading(false);

    }

  }



  return (

    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="
        mt-3
        block
        w-full
        rounded-2xl
        border
        border-red-200
        px-5
        py-3
        text-center
        font-medium
        text-red-600
        transition
        hover:bg-red-50
        disabled:opacity-50
        dark:border-red-900
        dark:hover:bg-red-950
      "
    >

      {loading
        ? "Suppression..."
        : "Supprimer le client"}

    </button>

  );

}