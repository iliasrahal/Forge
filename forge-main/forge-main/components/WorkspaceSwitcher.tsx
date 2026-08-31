"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Workspace = { id: string; name: string; type: "PERSONAL" | "TEAM" };

export default function WorkspaceSwitcher() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/workspaces", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setWorkspaces(data.workspaces ?? []);
          setActiveId(data.activeWorkspaceId ?? "");
        }
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  if (workspaces.length < 2) return null;

  return (
    <label className="mb-2 block border-b border-slate-200 pb-2 dark:border-slate-700">
      <span className="sr-only">Espace de travail actif</span>
      <select
        value={activeId}
        onChange={async (event) => {
          const workspaceId = event.target.value;
          const response = await fetch("/api/workspaces/active", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceId }),
          });
          if (response.ok) {
            setActiveId(workspaceId);
            router.push("/app");
            router.refresh();
          }
        }}
        className="w-full rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none dark:bg-slate-800 dark:text-slate-100"
      >
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.type === "PERSONAL" ? "Personnel" : workspace.name}
          </option>
        ))}
      </select>
    </label>
  );
}
