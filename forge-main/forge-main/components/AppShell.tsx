"use client";


import { usePathname } from "next/navigation";


import BottomNavigation from "@/components/BottomNavigation";
import DesktopSidebar from "@/components/DesktopSidebar";
import StatusAutoRefresh from "@/components/StatusAutoRefresh";


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
    pathname.startsWith("/quote/view") ||
    pathname.startsWith("/subscription") ||
    pathname.startsWith("/conditions-generales-utilisation") ||
    pathname.startsWith("/politique-confidentialite");




  return (
    <>
      {!hideNavigation ? <StatusAutoRefresh /> : null}
      {!hideNavigation ? <DesktopSidebar /> : null}
      <div
        className={
          hideNavigation
            ? "forge-public-shell min-h-screen text-slate-950 dark:text-white"
            : "forge-app-shell min-h-dvh pb-[calc(8.75rem+env(safe-area-inset-bottom))] lg:pb-16 lg:pl-60"
        }
      >
        {children}
      </div>




      {!hideNavigation && (
        <div className="fixed inset-x-0 bottom-0 z-50 isolate px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">


          <div className="forge-navbar mx-auto w-full max-w-md rounded-[1.75rem] border px-1.5 py-1.5 sm:px-2 sm:py-2">

            <BottomNavigation />

          </div>

        </div>
      )}


    </>
  );
}
