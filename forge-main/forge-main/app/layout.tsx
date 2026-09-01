import type { Metadata } from "next";
import { cookies } from "next/headers";


import {
  Anton,
  Geist,
  Geist_Mono,
} from "next/font/google";


import AppShell from "@/components/AppShell";
import ThemeProvider from "@/components/ThemeProvider";


import "./globals.css";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});



const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



// Anton — condensée, très grasse, capitales serrées : la lettre du logo Forge,
// portée en voix d'affichage de l'app.
const anton = Anton({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});



export const metadata: Metadata = {
  title: "Forge",
  description:
    "L’assistant administratif des artisans",
  icons: {
    icon: [
      {
        url: "/favicon.ico?v=myforge-2",
        sizes: "64x64",
      },
      {
        url: "/icon.png?v=myforge-2",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: [
      {
        url: "/apple-icon.png?v=myforge-2",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
};



// Règle l'heure du ciel avant le premier rendu : nuit / aube / jour / crépuscule.
// Progressive enhancement — sans JS, l'app tient la lumière de crépuscule.
const DAYPART_SCRIPT = `(function(){try{var h=new Date().getHours();document.documentElement.setAttribute("data-daypart",h<6?"nuit":h<10?"aube":h<17?"jour":h<21?"crepuscule":"nuit");}catch(e){}})();`;



export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeCookie = (await cookies()).get("forgeTheme")?.value;
  const initialTheme = themeCookie === "light" ? "light" : "dark";

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} h-full antialiased`}
    >

      <body className="min-h-full bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">

        {/*
          Contrat de direction — Impeccable · seed d344fe32 (bolder, relance 2)
          Forme retenue : challenger « Cyclorama dawn » (stagecraft-theater-lighting-cyclorama-dawn),
          choisi par l'utilisateur contre la carte de tête du tirage audacieux.
        */}
        <div
          style={{ display: "contents" }}
          dangerouslySetInnerHTML={{
            __html:
              "<!--\n" +
              "  IMPECCABLE DIRECTION CONTRACT — surface: app connectée (coque + tableau de bord /app) — mode: Operate — seed d344fe32\n" +
              "  THESIS: L'app Forge est un horizon. La journee de travail est un passage de lumiere, nuit vers jour, et le travail se pose sur la ligne. Refuse le tableau de bord SaaS : grille de cartes teintees, rail lateral, tuiles de stats, halo bleu d'accent.\n" +
              "  OWN-WORLD: Cyclorama mat. Fond = degrade vertical nuit -> cobalt -> aube qui suit l'heure ; une seule regle d'horizon cobalt 1px assure chaque division. Surfaces = panneaux bleu-nuit profond, files fins, pas de cartes flottantes. Affichage en Anton capitales (la lettre du logo), chaque titre coupe d'un tiret cobalt ; corps Geist ; chiffres en Geist Mono tabulaire. Cobalt #4C6EF5 = structure et ligne active ; rose d'aube #FF6FA5 = arrivee/attention ; jade = fait. Action primaire = barre degrade cobalt->rose en capitales. Mouvement : l'horizon se leve une fois a l'entree.\n" +
              "  STORY: L'artisan ouvre Forge entre deux chantiers et lit sa journee comme une ligne d'horizon — derriere lui le fait (eteint), sur la ligne l'en-cours (allume), devant vers la lumiere l'a-venir. Il croit l'administratif deja tenu. Il dit une phrase dans la barre Forge posee sur l'horizon et l'enregistrement suivant vient se placer sur la ligne.\n" +
              "  FIRST VIEWPORT: En haut, salut selon l'heure en Anton capitales + la date, sur un tiret cobalt. La regle d'horizon traverse toute la largeur vers 30% de hauteur. Dessous, les interventions du jour en rail de lumiere horizontal, gauche->droite par heure, l'en-cours allumee cobalt et agrandie, le passe eteint derriere. Sous le rail, l'intervention courante sur un panneau bleu-nuit. La barre Forge est ancree bas (« dites ce que vous avez fait… »), curseur cobalt, envoi degrade. La nav flotte en barre sombre a file fin.\n" +
              "  SIGNATURE INTERACTION: « le lever » — a chaque entree de contenu, la couture d'aube de l'horizon balaie ~12px vers le haut et s'eclaire, le contenu monte 8px en ease-out exponentiel ; prefers-reduced-motion : opacite seule, pas de balayage.\n" +
              "  FORM: challenger « Cyclorama dawn » (stagecraft-theater-lighting-cyclorama-dawn), tirage audacieux relance 2, retenu par l'utilisateur contre la carte de tete ; seed key d344fe32.\n" +
              "  FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.\n" +
              "-->",
          }}
        />

        <script dangerouslySetInnerHTML={{ __html: DAYPART_SCRIPT }} />


        <ThemeProvider initialTheme={initialTheme}>


          <AppShell>
            {children}
          </AppShell>


        </ThemeProvider>


      </body>
    </html>
  );
}
