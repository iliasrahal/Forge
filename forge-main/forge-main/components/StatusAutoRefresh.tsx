"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  shouldAutoRefreshStatuses,
  STATUS_AUTO_REFRESH_INTERVAL_MS,
} from "@/src/lib/status-auto-refresh";

function userIsEditing() {
  const active = document.activeElement;
  return (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    active instanceof HTMLSelectElement ||
    active?.getAttribute("contenteditable") === "true"
  );
}

/**
 * Revalide le payload des Server Components sans recharger le navigateur.
 * Next fusionne les nouvelles données serveur et conserve l'état React local.
 */
export default function StatusAutoRefresh() {
  const pathname = usePathname();
  const router = useRouter();
  const enabled = shouldAutoRefreshStatuses(pathname);

  useEffect(() => {
    if (!enabled) return;

    const refresh = () => {
      if (document.visibilityState !== "visible" || userIsEditing()) return;
      router.refresh();
    };

    const timer = window.setInterval(refresh, STATUS_AUTO_REFRESH_INTERVAL_MS);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refresh);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refresh);
    };
  }, [enabled, router]);

  return null;
}
