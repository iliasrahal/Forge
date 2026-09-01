"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

type ForgeTheme = "light" | "dark";

function isForgeTheme(value: unknown): value is ForgeTheme {
  return value === "light" || value === "dark";
}

function AuthenticatedThemeSync() {
  const pathname = usePathname();
  const { setTheme } = useTheme();

  useEffect(() => {
    const controller = new AbortController();

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

        if (isForgeTheme(data.themePreference)) {
          setTheme(data.themePreference);
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Impossible de synchroniser le thème.");
        }
      }
    }

    void synchronizeTheme();

    return () => controller.abort();
  }, [pathname, setTheme]);

  return null;
}


export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      enableColorScheme
      disableTransitionOnChange
    >
      <AuthenticatedThemeSync />
      {children}
    </NextThemesProvider>
  );
}
