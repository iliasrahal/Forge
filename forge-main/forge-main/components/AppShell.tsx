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
    pathname.startsWith("/activate-account");




  return (
    <>
      <div
        className={
          hideNavigation
            ? "forge-public-shell min-h-screen bg-white text-slate-950 dark:bg-slate-950 dark:text-white"
            : "forge-app-shell min-h-screen pb-32 text-slate-950 dark:text-white"
        }
      >
        {children}
      </div>




      {!hideNavigation && (
        <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">


          <div
            className="
              mx-auto
              w-full
              max-w-md
              rounded-3xl
              border
              border-white/80
              bg-white/80
              px-5
              py-3
              shadow-[0_22px_60px_-28px_rgba(15,23,42,0.45)]
              backdrop-blur-xl
              dark:border-slate-700/80
              dark:bg-slate-900/80
              dark:shadow-black/40
            "
          >

            <BottomNavigation />

          </div>

        </div>
      )}


    </>
  );
}
