"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();

  const [isLoading, setIsLoading] =
    useState(false);

  async function handleLogout() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      localStorage.removeItem(
        "forgeUserFirstName",
      );

      localStorage.removeItem(
        "forgeUserProfile",
      );

      localStorage.removeItem(
        "forgeOnboardingCompleted",
      );

      localStorage.removeItem(
        "forgeLastGreetingDate",
      );

      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading
        ? "Déconnexion..."
        : "Se déconnecter"}
    </button>
  );
}
