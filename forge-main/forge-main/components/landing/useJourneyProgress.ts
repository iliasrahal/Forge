"use client";

import { useEffect, useState, type RefObject } from "react";

export function useJourneyProgress(
  sectionRef: RefObject<HTMLElement | null>,
  sceneCount: number,
) {
  const [activeScene, setActiveScene] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 768px)");
    if (media.matches || !desktop.matches) return;

    let frame = 0;
    let currentScene = 0;

    const measure = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const distance = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / distance));
      section.style.setProperty("--journey-progress", String(progress));

      const nextScene = Math.min(
        sceneCount - 1,
        Math.floor(progress * sceneCount),
      );
      if (nextScene !== currentScene) {
        currentScene = nextScene;
        setActiveScene(nextScene);
      }
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [sceneCount, sectionRef]);

  return activeScene;
}
