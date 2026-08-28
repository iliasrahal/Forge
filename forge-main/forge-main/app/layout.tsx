import type { Metadata } from "next";


import {
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



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >

      <body className="min-h-full bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">


        <ThemeProvider>


          <AppShell>
            {children}
          </AppShell>


        </ThemeProvider>


      </body>
    </html>
  );
}
