import { redirect } from "next/navigation";

import CTA from "@/components/landing/CTA";
import ClientCreation from "@/components/landing/ClientCreation";
import CustomerReply from "@/components/landing/CustomerReply";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import JobProfitability from "@/components/landing/JobProfitability";
import Problem from "@/components/landing/Problem";
import Pricing from "@/components/landing/Pricing";
import SmartReminders from "@/components/landing/SmartReminders";
import WorkModes from "@/components/landing/WorkModes";
import JourneyStory from "@/components/landing/JourneyStory";
import EcosystemOverview from "@/components/landing/EcosystemOverview";
import { getCurrentUser } from "@/src/lib/auth";

export default async function LandingPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(user.onboardingCompleted ? "/app" : "/onboarding");
  }

  return (
    <main className="landing-cyclorama min-h-svh overflow-x-clip text-slate-950 dark:text-white">
      <Hero />
      <Problem />
      <JourneyStory />
      <EcosystemOverview />
      <JobProfitability />
      <SmartReminders />
      <ClientCreation />
      <CustomerReply />
      <WorkModes />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
