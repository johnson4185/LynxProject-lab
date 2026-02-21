import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import Numbers from "@/components/Numbers";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import Integrations from "@/components/Integrations";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div style={{ background: "var(--background)", overflowX: "hidden" }}>
      <Navbar />
      <Hero />
      <Ticker />
      <Numbers />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <Integrations />
      <FinalCTA />
      <Footer />
    </div>
  );
}

