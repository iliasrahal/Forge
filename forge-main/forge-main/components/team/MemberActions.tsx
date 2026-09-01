"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MemberActions({ memberId, role }: { memberId: string; role: string }) {
  const router = useRouter();
  const [notice, setNotice] = useState("");
  if (role === "OWNER") return null;

  async function updateRole(nextRole: "ADMIN" | "READ_ONLY") {
    setNotice("");
    const response = await fetch(`/api/team/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      router.refresh();
      return;
    }
    setNotice(data.error ?? "Impossible de modifier ce rôle.");
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={() => void updateRole(role === "ADMIN" ? "READ_ONLY" : "ADMIN")} className="rounded-xl border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-800 dark:text-blue-300">
        Passer {role === "ADMIN" ? "en lecture seule" : "Admin"}
      </button>
      <button type="button" onClick={async () => {
        if (!window.confirm("Retirer ce membre de l’équipe ?")) return;
        const response = await fetch(`/api/team/members/${memberId}`, { method: "DELETE" });
        if (response.ok) router.refresh();
      }} className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 dark:border-red-900 dark:text-red-400">
        Retirer
      </button>
      {notice && (
        <p className="w-full text-xs font-medium text-red-600 dark:text-red-400">
          {notice}
        </p>
      )}
    </div>
  );
}
