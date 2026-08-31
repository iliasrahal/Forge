import { redirect } from "next/navigation";

import { getCurrentUser } from "@/src/lib/auth";

export default async function GuestOnly({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (user) {
    redirect(user.onboardingCompleted ? "/app" : "/onboarding");
  }

  return children;
}
