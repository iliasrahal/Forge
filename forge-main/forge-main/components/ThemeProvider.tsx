"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

type ForgeTheme = "light" | "dark";

function isForgeTheme(value: unknown): value is ForgeTheme {
  return value === "light" || value === "dark";
}

function AuthenticatedThemeSync() {
  const { setTheme } = useTheme();
  const userSelectedTheme = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const handleThemeSelection = () => {
      userSelectedTheme.current = true;
      controller.abort();
    };

    window.addEventListener("forge-theme-selected", handleThemeSelection);

    async function synchronizeTheme() {
      try {
        const response = await fetch("/api/settings/theme", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          themePreference?: unknown;
        };

        if (
          !userSelectedTheme.current &&
          isForgeTheme(data.themePreference)
        ) {
          setTheme(data.themePreference);
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Impossible de synchroniser le thème.");
        }
      }
    }

    void synchronizeTheme();

    return () => {
      controller.abort();
      window.removeEventListener("forge-theme-selected", handleThemeSelection);
    };
  }, [setTheme]);

  return null;
}


export default function ThemeProvider({
  children,
  initialTheme = "dark",
}: {
  children: React.ReactNode;
  initialTheme?: ForgeTheme;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={initialTheme}
      enableSystem={false}
      enableColorScheme
      disableTransitionOnChange
    >
      <AuthenticatedThemeSync />
      {children}
    </NextThemesProvider>
  );
}
