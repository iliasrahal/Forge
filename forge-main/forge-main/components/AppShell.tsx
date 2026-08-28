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
    pathname.startsWith("/register") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/activate-account") ||
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
        <div className="fixed inset-x-0 bottom-0 z-50 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">


          <div
            className="
              mx-auto
              w-full
              max-w-md
              rounded-3xl
              border
              border-white/80
              bg-white/80
              px-1.5
              py-1.5
              shadow-[0_22px_60px_-28px_rgba(15,23,42,0.45)]
              backdrop-blur-xl
              dark:border-slate-700/80
              dark:bg-slate-900/80
              dark:shadow-black/40
              sm:px-5
              sm:py-3
            "
          >

            <BottomNavigation />

          </div>

        </div>
      )}


    </>
  );
}
