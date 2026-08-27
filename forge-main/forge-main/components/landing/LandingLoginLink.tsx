"use client";

import {
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import ForgeLogo from "@/components/ForgeLogo";

type LandingLoginLinkProps = {
  children: ReactNode;
  className?: string;
};

export default function LandingLoginLink({
  children,
  className,
}: LandingLoginLinkProps) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] =
    useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      document
        .querySelector("main")
        ?.classList.remove(
          "forge-landing-is-leaving",
        );
    };
  }, []);

  function handleClick(
    event: MouseEvent<HTMLAnchorElement>,
  ) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    if (isLeaving) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      router.push("/login");
      return;
    }

    setIsLeaving(true);
    document
      .querySelector("main")
      ?.classList.add(
        "forge-landing-is-leaving",
      );

    timerRef.current = window.setTimeout(() => {
      router.push("/login");
    }, 440);
  }

  return (
    <>
      <style>{`
        @keyframes forge-landing-page-exit {
          from { opacity: 1; transform: scale(1); filter: blur(0); }
          to { opacity: .32; transform: scale(1.018); filter: blur(2px); }
        }
        @keyframes forge-landing-veil-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes forge-landing-mark-in {
          from { opacity: 0; transform: scale(.92) translateY(5px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .forge-landing-is-leaving {
          animation: forge-landing-page-exit 440ms cubic-bezier(.4, 0, .2, 1) both;
          transform-origin: center 22%;
          pointer-events: none;
        }
        .forge-landing-transition-veil {
          animation: forge-landing-veil-in 440ms cubic-bezier(.4, 0, .2, 1) both;
        }
        .forge-landing-transition-mark {
          animation: forge-landing-mark-in 360ms 70ms cubic-bezier(.22, 1, .36, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .forge-landing-is-leaving,
          .forge-landing-transition-veil,
          .forge-landing-transition-mark { animation: none; }
        }
      `}</style>

      <a
        href="/login"
        onClick={handleClick}
        aria-disabled={isLeaving}
        className={className}
      >
        {children}
      </a>

      {isLeaving &&
        createPortal(
          <div
            aria-hidden="true"
            className="forge-landing-transition-veil fixed inset-0 z-[100] grid place-items-center bg-white/75 backdrop-blur-md dark:bg-slate-950/80"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,.16),transparent_42%)] dark:bg-[radial-gradient(circle_at_center,rgba(37,99,235,.2),transparent_45%)]" />
            <div className="forge-landing-transition-mark relative rounded-[1.75rem] bg-white/80 p-2 shadow-2xl shadow-blue-600/15 ring-1 ring-slate-200/80 backdrop-blur dark:bg-slate-900/80 dark:ring-slate-700/80">
              <ForgeLogo size={62} />
            </div>
          </div>
          ,
          document.body,
        )}
    </>
  );
}
