"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Check,
  Mic,
} from "lucide-react";

import ForgeSymbol from "@/components/ForgeSymbol";

const artisanRequest =
  "J’ai une intervention demain à 10h chez Charles";

const results = [
  "Client identifié",
  "Intervention créée",
  "Rendez-vous planifié",
];

const typingDuration =
  artisanRequest.length * 45;
const analysisDuration = 700;
const resultDelay = 650;
const animationDuration = 8000;

export default function ProductDemo() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const updateMotionPreference = () =>
      setReduceMotion(mediaQuery.matches);
    const frame = window.requestAnimationFrame(
      updateMotionPreference,
    );

    mediaQuery.addEventListener(
      "change",
      updateMotionPreference,
    );

    const section = sectionRef.current;
    const observer = section
      ? new IntersectionObserver(
          ([entry]) =>
            setIsVisible(entry.isIntersecting),
          {
            threshold: 0.08,
            rootMargin: "120px 0px",
          },
        )
      : null;

    if (section && observer) {
      observer.observe(section);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      mediaQuery.removeEventListener(
        "change",
        updateMotionPreference,
      );
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      const frame = window.requestAnimationFrame(() => {
        setElapsed(animationDuration);
      });

      return () => window.cancelAnimationFrame(frame);
    }

    if (!isVisible) return;

    const interval = window.setInterval(() => {
      setElapsed((current) => {
        const next = Math.min(
          current + 50,
          animationDuration,
        );

        if (next >= animationDuration) {
          window.clearInterval(interval);
        }

        return next;
      });
    }, 50);

    return () =>
      window.clearInterval(interval);
  }, [isVisible, reduceMotion]);

  const typedCharacters = Math.min(
    artisanRequest.length,
    Math.floor(elapsed / 45),
  );
  const displayedRequest =
    artisanRequest.slice(0, typedCharacters);
  const isTyping =
    typedCharacters < artisanRequest.length;
  const isAnalyzing =
    !isTyping &&
    elapsed <
      typingDuration + analysisDuration;
  const visibleResults = Math.max(
    0,
    Math.min(
      results.length,
      Math.floor(
        (elapsed -
          typingDuration -
          analysisDuration) /
          resultDelay,
      ) + 1,
    ),
  );

  return (
    <section
      ref={sectionRef}
      id="product-demo"
      className="bg-slate-50 px-6 py-20 text-slate-950 sm:py-24 lg:px-8 dark:bg-slate-900/40 dark:text-white"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            Naturellement simple
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Dites-le à Forge. C’est organisé.
          </h2>
        </div>

        <div className="relative mx-auto mt-12 max-w-4xl">
          <div className="pointer-events-none absolute inset-x-20 -top-8 h-56 rounded-full bg-blue-500/15 blur-3xl dark:bg-blue-600/15" />

          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
            <div className="flex h-12 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              </div>
              <span className="text-xs font-semibold tracking-wide text-slate-400">
                FORGE
              </span>
            </div>

            <div className="grid min-h-[430px] gap-8 p-6 sm:p-10 md:grid-cols-[1.2fr_0.8fr] md:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                    <Mic size={20} />
                  </span>
                  <div>
                    <p className="font-semibold">
                      L’artisan demande
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Par écrit ou à la voix
                    </p>
                  </div>
                </div>

                <div
                  aria-label={artisanRequest}
                  className="mt-6 flex min-h-32 items-start rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left text-lg font-medium leading-8 text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:text-xl"
                >
                  <span>{displayedRequest}</span>
                  {isTyping && (
                    <span className="ml-0.5 mt-1 inline-block h-6 w-0.5 animate-pulse bg-blue-600 motion-reduce:animate-none dark:bg-blue-400" />
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5 dark:border-blue-900 dark:bg-blue-950/40">
                <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-sm dark:bg-slate-100">
                    <ForgeSymbol size={22} />
                  </span>
                  <p className="font-semibold">
                    Forge comprend
                  </p>
                </div>

                <div
                  aria-live="polite"
                  className="mt-6 min-h-44 space-y-3"
                >
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 py-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600 motion-reduce:animate-none" />
                      Analyse de la demande…
                    </div>
                  )}

                  {results.map((result, index) => {
                    const isVisible =
                      index < visibleResults;

                    return (
                      <div
                        key={result}
                        className={`landing-reveal-motion flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold shadow-sm duration-500 dark:bg-slate-900 ${
                          isVisible
                            ? "translate-y-0 opacity-100"
                            : "translate-y-2 opacity-0"
                        }`}
                      >
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <Check size={15} />
                        </span>
                        {result}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
