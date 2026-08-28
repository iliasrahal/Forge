"use client";


import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";




type UserMenuProps = {
  showLogout?: boolean;
};



export default function UserMenu({
  showLogout = false,
}: UserMenuProps) {
  const router = useRouter();




  const [firstName, setFirstName] = useState("");
  const [isOpen, setIsOpen] = useState(false);




  const menuRef = useRef<HTMLDivElement>(null);




  useEffect(() => {
    const profile = localStorage.getItem("forgeUserProfile");



    if (profile) {
      const user = JSON.parse(profile);
      setFirstName(user.firstName || "");
    }


  }, []);





  useEffect(() => {


    function handleClick(event: MouseEvent) {


      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }


    }




    document.addEventListener(
      "mousedown",
      handleClick,
    );




    return () =>
      document.removeEventListener(
        "mousedown",
        handleClick,
      );


  }, []);







  async function logout() {


    await fetch("/api/auth/logout", {
      method: "POST",
    });




    localStorage.clear();




    router.push("/login");
    router.refresh();


  }







  return (
    <div
      ref={menuRef}
      className="relative"
    >




      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          rounded-xl
          border
          border-slate-200
          bg-white
          px-4
          py-2
          text-sm
          font-semibold
          text-slate-700
          transition
          hover:border-blue-400
          hover:text-blue-700
          dark:border-slate-700
          dark:bg-slate-900
          dark:text-white
          dark:hover:border-blue-500
          dark:hover:text-blue-400
        "
      >
        {firstName} ▼
      </button>






      {isOpen && (


        <div
          className="
            absolute
            right-0
            mt-2
            w-52
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-2
            shadow-xl
            dark:border-slate-700
            dark:bg-slate-900
          "
        >





          <Link
            href="/settings"
            className="
              block
              w-full
              rounded-xl
              px-3
              py-2
              text-left
              font-medium
              text-slate-700
              transition
              hover:bg-slate-50
              dark:text-slate-200
              dark:hover:bg-slate-800
            "
          >
            Options
          </Link>






          <Link
            href="/subscription"
            className="
              mt-1
              block
              w-full
              rounded-xl
              px-3
              py-2
              text-left
              font-medium
              text-slate-700
              transition
              hover:bg-slate-50
              dark:text-slate-200
              dark:hover:bg-slate-800
            "
          >
            Abonnement
          </Link>







          <Link
            href="/about"
            className="
              mt-1
              block
              w-full
              rounded-xl
              px-3
              py-2
              text-left
              font-medium
              text-slate-700
              transition
              hover:bg-slate-50
              dark:text-slate-200
              dark:hover:bg-slate-800
            "
          >
            À propos de Forge
          </Link>







          {showLogout && (
            <button
              onClick={logout}
              className="
                mt-1
                w-full
                rounded-xl
                px-3
                py-2
                text-left
                font-medium
                text-red-600
                transition
                hover:bg-red-50
                dark:text-red-400
                dark:hover:bg-red-950
              "
            >
              Déconnexion
            </button>
          )}






        </div>


      )}






    </div>
  );
}
