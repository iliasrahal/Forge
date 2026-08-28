import Link from "next/link";

import ForgeLogo from "@/components/ForgeLogo";

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-dvh">
      <div className="pointer-events-none absolute inset-x-0 top-5 z-30 flex justify-center sm:top-7">
        <Link
          href="/"
          aria-label="Retour à l’accueil public de Forge"
          className="pointer-events-auto inline-flex rounded-2xl outline-none transition duration-300 hover:scale-[1.03] focus-visible:ring-4 focus-visible:ring-blue-500/20"
        >
          <span className="scale-90 sm:scale-100">
            <ForgeLogo size={80} />
          </span>
        </Link>
      </div>

      {children}
    </div>
  );
}
