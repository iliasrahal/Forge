"use client";


import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  House,
  UsersRound,
  ReceiptText,
} from "lucide-react";



export default function BottomNavigation() {

  const pathname = usePathname();




  const isHomeActive =
    pathname === "/app";




  const isQuotesActive =
    pathname.startsWith("/quotes") ||
    pathname.includes("/quotes/");




  const isInvoicesActive =
    pathname.startsWith("/invoices") ||
    pathname.includes("/invoices/");




  const isClientsActive =
    (
      pathname.startsWith("/clients") ||
      pathname.startsWith("/interventions") ||
      pathname.startsWith("/intervention") ||
      pathname.includes("/historique") ||
      pathname.includes("/history")
    )
    &&
    !isQuotesActive
    &&
    !isInvoicesActive;




  const getLinkClassName = (
    isActive: boolean,
  ) =>
    `relative flex min-h-14 min-w-0 flex-col items-center justify-center rounded-xl px-1 transition duration-300 sm:min-h-16 sm:rounded-2xl sm:px-3 ${
      isActive
        ? "bg-blue-50/90 font-semibold text-blue-600 shadow-sm ring-1 ring-blue-100 dark:bg-blue-950/80 dark:text-blue-400 dark:ring-blue-900"
        : "text-slate-500 hover:-translate-y-0.5 hover:bg-white/80 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-blue-400"
    }`;





  return (

    <nav className="grid grid-cols-4 gap-0.5 text-center sm:gap-2">





      {/* ACCUEIL */}


      <Link
        href="/app"
        className={getLinkClassName(
          isHomeActive,
        )}
      >

        <House
          size={25}
          strokeWidth={
            isHomeActive ? 2.3 : 2
          }
        />


        <span className="mt-1 text-[0.68rem] leading-tight sm:text-sm">
          Accueil
        </span>



        {isHomeActive && (
          <span className="absolute bottom-1 h-1 w-8 rounded-full bg-blue-600" />
        )}


      </Link>







      {/* CLIENTS */}


      <Link
        href="/clients"
        className={getLinkClassName(
          isClientsActive,
        )}
      >

        <UsersRound
          size={25}
          strokeWidth={
            isClientsActive ? 2.3 : 2
          }
        />


        <span className="mt-1 text-[0.68rem] leading-tight sm:text-sm">
          Clients
        </span>



        {isClientsActive && (
          <span className="absolute bottom-1 h-1 w-8 rounded-full bg-blue-600" />
        )}


      </Link>







      {/* DEVIS */}


      <Link
        href="/quotes"
        className={getLinkClassName(
          isQuotesActive,
        )}
      >

        <FileText
          size={25}
          strokeWidth={
            isQuotesActive ? 2.3 : 2
          }
        />


        <span className="mt-1 text-[0.68rem] leading-tight sm:text-sm">
          Devis
        </span>



        {isQuotesActive && (
          <span className="absolute bottom-1 h-1 w-8 rounded-full bg-blue-600" />
        )}


      </Link>







      {/* FACTURES */}


      <Link
        href="/invoices"
        className={getLinkClassName(
          isInvoicesActive,
        )}
      >

        <ReceiptText
          size={25}
          strokeWidth={
            isInvoicesActive ? 2.3 : 2
          }
        />


        <span className="mt-1 text-[0.68rem] leading-tight sm:text-sm">
          Factures
        </span>



        {isInvoicesActive && (
          <span className="absolute bottom-1 h-1 w-8 rounded-full bg-blue-600" />
        )}


      </Link>





    </nav>

  );

}
