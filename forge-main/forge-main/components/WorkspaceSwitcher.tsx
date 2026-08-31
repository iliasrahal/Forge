"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Workspace = {
  id: string;
  name: string;
  type: "PERSONAL" | "TEAM";
};

type WorkspacesResponse = {
  activeWorkspaceId?: string;
  workspaces?: Workspace[];
};

function getWorkspaceLabel(workspace?: Workspace) {
  if (!workspace || workspace.type === "PERSONAL") {
    return "Personnel";
  }

  return workspace.name;
}

export default function WorkspaceSwitcher() {
  const router = useRouter();
  const switcherRef = useRef<HTMLDivElement>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/workspaces", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as WorkspacesResponse;

        if (!cancelled) {
          setWorkspaces(data.workspaces ?? []);
          setActiveId(data.activeWorkspaceId ?? "");
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        switcherRef.current &&
        !switcherRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const activeWorkspace = workspaces.find(
    (workspace) => workspace.id === activeId,
  );
  const hasTeam = workspaces.some(
    (workspace) => workspace.type === "TEAM",
  );

  async function switchWorkspace(workspaceId: string) {
    if (workspaceId === activeId || isSwitching) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    setError("");

    try {
      const response = await fetch("/api/workspaces/active", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });

      if (!response.ok) {
        throw new Error("Impossible de changer d’espace.");
      }

      setActiveId(workspaceId);
      setIsOpen(false);
      router.push("/app");
      router.refresh();
    } catch (switchError) {
      setError(
        switchError instanceof Error
          ? switchError.message
          : "Impossible de changer d’espace.",
      );
    } finally {
      setIsSwitching(false);
    }
  }

  return (
    <div ref={switcherRef} className="relative z-[65] min-w-0 text-right">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="inline-flex max-w-[min(18rem,calc(100vw-1.5rem))] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-blue-500 dark:hover:text-blue-400"
      >
        <span className="truncate">
          {getWorkspaceLabel(activeWorkspace)}
        </span>
        <span aria-hidden="true">▼</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-[80] mt-2 w-[min(17rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="px-3 pb-1.5 pt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
            Changer d’espace
          </p>

          <div className="space-y-1">
            {workspaces.map((workspace) => {
              const isActive = workspace.id === activeId;

              return (
                <button
                  key={workspace.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  disabled={isSwitching}
                  onClick={() => void switchWorkspace(workspace.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition disabled:cursor-wait disabled:opacity-60 ${
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="truncate">
                    {getWorkspaceLabel(workspace)}
                  </span>
                  {isActive && (
                    <span className="shrink-0 text-xs" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <p className="px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
            <Link
              href="/settings/team"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="block w-full rounded-xl px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
            >
              {hasTeam ? "Gérer les équipes" : "Créer une équipe"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
