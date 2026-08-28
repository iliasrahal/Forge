"use client";

import {
  Check,
  Clock3,
  MessageCircle,
  Mic,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import ForgeBarPreview from "@/components/landing/ForgeBarPreview";
import ForgeSymbol from "@/components/ForgeSymbol";

const benefits = [
  {
    icon: ForgeSymbol,
    label: "Réponse professionnelle automatique",
  },
  {
    icon: Clock3,
    label: "Gain de temps",
  },
  {
    icon: Mic,
    label: "Disponible par écrit ou à la voix",
  },
  {
    icon: MessageCircle,
    label: "Toujours avec le ton adapté pour un client",
  },
];

const customerMessage =
  "« Bonjour, est-ce que vous pouvez passer demain pour regarder ma fuite d’eau ? »";
const forgeReply =
  "Bonjour, merci pour votre message. Je peux passer demain afin de regarder votre fuite d’eau. Je vous confirme mon passage dans la journée.";
const messageDuration = 2700;
const analysisDuration = 850;
const replyDuration = 3600;
const replyStart = messageDuration + analysisDuration;
const replyEnd = replyStart + replyDuration;
const replyAnimationDuration = replyEnd + 2800;

function getProgressiveText(
  text: string,
  progress: number,
) {
  const length = Math.floor(
    text.length * Math.min(1, Math.max(0, progress)),
  );

  return {
    visible: text.slice(0, length),
    remaining: text.slice(length),
    complete: length >= text.length,
  };
}

export default function CustomerReply() {
  const sectionRef = useRef<HTMLElement | null>(
    null,
  );
  const [isVisible, setIsVisible] =
    useState(false);
  const [hasRevealed, setHasRevealed] =
    useState(false);
  const [animationElapsed, setAnimationElapsed] =
    useState(0);
  const [reduceMotion, setReduceMotion] =
    useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return;
    }

    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const frame = window.requestAnimationFrame(() => {
      setReduceMotion(mediaQuery.matches);
    });
    const updateMotionPreference = () =>
      setReduceMotion(mediaQuery.matches);

    mediaQuery.addEventListener(
      "change",
      updateMotionPreference,
    );

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasRevealed(true);
        }
      },
      {
        threshold: 0.08,
        rootMargin: "100px 0px",
      },
    );

    observer.observe(section);
    return () => {
      window.cancelAnimationFrame(frame);
      mediaQuery.removeEventListener(
        "change",
        updateMotionPreference,
      );
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isVisible || reduceMotion) return;

    const timer = window.setInterval(() => {
      setAnimationElapsed((current) => {
        const next = Math.min(
          current + 40,
          replyAnimationDuration,
        );

        if (next >= replyAnimationDuration) {
          window.clearInterval(timer);
        }

        return next;
      });
    }, 40);

    return () => window.clearInterval(timer);
  }, [isVisible, reduceMotion]);

  const effectiveElapsed = reduceMotion
    ? replyEnd
    : animationElapsed;
  const animatedMessage = getProgressiveText(
    customerMessage,
    effectiveElapsed / messageDuration,
  );
  const animatedReply = getProgressiveText(
    forgeReply,
    (effectiveElapsed - replyStart) / replyDuration,
  );
  const isAnalyzing =
    effectiveElapsed >= messageDuration &&
    effectiveElapsed < replyStart;
  const responseStarted =
    effectiveElapsed >= messageDuration;

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-white px-6 py-24 text-slate-950 dark:bg-slate-950 dark:text-white sm:py-32 lg:px-8"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[100px] dark:bg-blue-600/15" />

      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
        <div
          className={`transition-all duration-1000 motion-reduce:transition-none ${
            hasRevealed
              ? "translate-x-0 opacity-100"
              : "-translate-x-8 opacity-0"
          }`}
        >
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            06 · Relation client
          </p>
          <h2 className="mt-5 text-balance text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Répondez facilement à vos clients
          </h2>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-slate-600 dark:text-slate-300">
            Un client vous envoie un message ou un email ? Copiez simplement sa demande dans Forge et laissez l’assistant préparer une réponse professionnelle.
          </p>

          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {benefits.map(({ icon: Icon, label }, index) => (
              <div
                key={label}
                className={`flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)] backdrop-blur transition-all duration-700 dark:border-slate-800 dark:bg-slate-900/65 ${
                  hasRevealed
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
                style={{
                  transitionDelay: `${250 + index * 90}ms`,
                }}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <Icon size={17} />
                </span>
                <p className="text-sm font-semibold leading-6">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`relative transition-all delay-150 duration-1000 motion-reduce:transition-none ${
            hasRevealed
              ? "translate-y-0 opacity-100"
              : "translate-y-10 opacity-0"
          }`}
        >
          <div className="pointer-events-none absolute inset-x-12 top-4 -z-10 h-64 rounded-full bg-blue-500/15 blur-3xl dark:bg-blue-600/15" />

          <div className="overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white/85 p-4 shadow-[0_30px_100px_-38px_rgba(15,23,42,0.38)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/85 dark:shadow-black/40 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <MessageCircle size={19} />
                </span>
                <div>
                  <p className="font-semibold">Message client</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Demande reçue
                  </p>
                </div>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>

            <div className="mt-5 rounded-3xl rounded-tl-lg bg-slate-100/90 p-5 text-sm leading-7 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200 sm:text-base">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Client
              </p>
              <p aria-label={customerMessage} className="mt-2">
                <span>{animatedMessage.visible}</span>
                {!animatedMessage.complete && !reduceMotion && (
                  <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-slate-500 motion-reduce:hidden" />
                )}
                <span aria-hidden="true" className="invisible">
                  {animatedMessage.remaining}
                </span>
              </p>
            </div>

            <div className="mt-4">
              <ForgeBarPreview text="Réponds à ce message" />
            </div>

            <div
              className={`mt-4 rounded-3xl rounded-tr-lg border border-blue-100 bg-blue-50/75 p-5 transition-all duration-700 dark:border-blue-900 dark:bg-blue-950/40 ${
                responseStarted
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <Check size={14} />
                </span>
                {isAnalyzing
                  ? "Forge analyse le message…"
                  : animatedReply.complete
                    ? "Réponse prête"
                    : "Forge rédige la réponse…"}
              </div>
              <p
                aria-label={forgeReply}
                className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200 sm:text-base"
              >
                <span>{animatedReply.visible}</span>
                <span aria-hidden="true" className="invisible">
                  {animatedReply.remaining}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
