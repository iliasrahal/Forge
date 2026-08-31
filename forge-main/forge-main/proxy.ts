import { NextRequest, NextResponse } from "next/server";


const PUBLIC_PAGE_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/activate-account",
  "/invite",
  "/conditions-generales-utilisation",
  "/politique-confidentialite",
];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;

  if (PUBLIC_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return pathname.startsWith("/api/auth/") &&
    !pathname.startsWith("/api/auth/onboarding");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    isPublicPath(pathname)
  ) {
    return NextResponse.next();
  }

  // L'expiration ne bloque plus l'application. Les permissions en lecture ou
  // écriture sont évaluées côté serveur par le contexte du workspace actif.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
