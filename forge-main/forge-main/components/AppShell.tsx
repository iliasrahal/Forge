"use client";


import { usePathname } from "next/navigation";


import BottomNavigation from "@/components/BottomNavigation";


type AppShellProps = {
  children: React.ReactNode;
};


export default function AppShell({
  children,
}: AppShellProps) {


  const pathname = usePathname();



  const hideNavigation =
    pathname === "/" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/activate-account") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/subscription") ||
    pathname.startsWith("/conditions-generales-utilisation") ||
    pathname.startsWith("/politique-confidentialite");




  return (
    <>
      <div
        className={
          hideNavigation
            ? "forge-public-shell min-h-screen bg-white text-slate-950 dark:bg-slate-950 dark:text-white"
            : "forge-app-shell min-h-dvh pb-[calc(7.5rem+env(safe-area-inset-bottom))] text-slate-950 dark:text-white"
        }
      >
        {children}
      </div>




      {!hideNavigation && (
        <div className="fixed inset-x-0 bottom-0 z-50 isolate px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">


          <div
            className="
              mx-auto
              w-full
              max-w-md
              rounded-3xl
              border
              border-slate-200/80
              bg-white/90
              px-1.5
              py-1.5
              shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_44px_-26px_rgba(15,23,42,0.3)]
              backdrop-blur-md
              dark:border-slate-700/70
              dark:bg-slate-900/85
              dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_18px_44px_-26px_rgba(0,0,0,0.7)]
              sm:px-4
              sm:py-2.5
            "
          >

            <BottomNavigation />

          </div>

        </div>
      )}


    </>
  );
}
