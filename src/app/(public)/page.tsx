import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Organizacion } from "@/components/landing/Organizacion";
import { Actuaciones } from "@/components/landing/Actuaciones";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Organizacion />
      <Actuaciones />
      <Footer />
    </div>
  );
}
