import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { getSubscriptionAccessForUser } from "@/src/lib/subscription-access";

const PUBLIC_PAGE_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/activate-account",
  "/conditions-generales-utilisation",
  "/politique-confidentialite",
];

const ACCESS_RECOVERY_PREFIXES = [
  "/subscription",
  "/api/subscription",
  "/api/auth/logout",
  "/api/auth/delete-account",
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
    isPublicPath(pathname) ||
    ACCESS_RECOVERY_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get("forgeSession")?.value;
  if (!sessionToken) return NextResponse.next();

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    select: {
      userId: true,
      expiresAt: true,
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    return NextResponse.next();
  }

  const access = await getSubscriptionAccessForUser(session.userId);
  if (access.hasAccess) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error: "Votre période d’essai gratuite est terminée.",
        code: "SUBSCRIPTION_REQUIRED",
      },
      { status: 402 },
    );
  }

  const subscriptionUrl = request.nextUrl.clone();
  subscriptionUrl.pathname = "/subscription";
  subscriptionUrl.search = "?reason=trial-ended";
  return NextResponse.redirect(subscriptionUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
