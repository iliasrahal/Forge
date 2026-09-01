"use client";

import { useEffect, useState } from "react";

const GREETING: Record<string, string> = {
  nuit: "Bonsoir",
  aube: "Bonjour",
  jour: "Bonjour",
  crepuscule: "Bonsoir",
};

export default function Header() {
  const [greeting, setGreeting] = useState("Bonjour");
  const [firstName, setFirstName] = useState("");
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    const part =
      document.documentElement.getAttribute("data-daypart") ?? "jour";
    setGreeting(GREETING[part] ?? "Bonjour");

    const saved = localStorage.getItem("forgeUserFirstName");
    setFirstName(saved?.trim() || "");

    setDateLabel(
      new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Europe/Paris",
      }).format(new Date()),
    );
  }, []);

  return (
    <header>
      <span
        aria-hidden="true"
        className="block h-[3px] w-9 rounded-full bg-[#4c6ef5]"
      />
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl uppercase leading-[1.02] tracking-[0.005em]">
        {greeting}
        {firstName ? `, ${firstName}` : ""}.
      </h1>
      <p className="mt-1 text-sm capitalize text-[var(--ink-3)]">{dateLabel}</p>
    </header>
  );
}
