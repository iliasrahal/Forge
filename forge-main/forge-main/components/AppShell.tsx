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
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/activate-account");




  return (
    <>
      <div
        className={
          hideNavigation
            ? "min-h-screen bg-white text-slate-950 dark:bg-slate-950 dark:text-white"
            : "min-h-screen pb-32 bg-white text-slate-950 dark:bg-slate-950 dark:text-white"
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
              border-slate-200
              bg-white
              px-5
              py-3
              shadow-lg
              dark:border-slate-700
              dark:bg-slate-900
            "
          >

            <BottomNavigation />

          </div>

        </div>
      )}


    </>
  );
}