import CTA from "@/components/landing/CTA";
import CustomerReply from "@/components/landing/CustomerReply";
import Features from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import ProductDemo from "@/components/landing/ProductDemo";
import Workflow from "@/components/landing/Workflow";

export default function LandingPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
      <Hero />
      <ProductDemo />
      <Problem />
      <Features />
      <CustomerReply />
      <Workflow />
      <CTA />
      <Footer />
    </main>
  );
}
