import { redirect } from "next/navigation";

import CTA from "@/components/landing/CTA";
import ClientCreation from "@/components/landing/ClientCreation";
import CustomerReply from "@/components/landing/CustomerReply";
import Features from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import Pricing from "@/components/landing/Pricing";
import ProductDemo from "@/components/landing/ProductDemo";
import Workflow from "@/components/landing/Workflow";
import WorkModes from "@/components/landing/WorkModes";
import { getCurrentUser } from "@/src/lib/auth";

export default async function LandingPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(user.onboardingCompleted ? "/app" : "/onboarding");
  }

  return (
    <main className="landing-cyclorama min-h-svh overflow-x-clip text-slate-950 dark:text-white">
      <Hero />
      <ProductDemo />
      <Problem />
      <Workflow />
      <Features group="operations" />
      <Features group="documents" showHeading={false} />
      <ClientCreation />
      <CustomerReply />
      <WorkModes />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
