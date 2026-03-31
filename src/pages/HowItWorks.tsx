import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HowItWorks from "@/components/HowItWorks";

const HowItWorksPage = () => {
  useEffect(() => {
    document.title = "Cómo funciona — Chamby.mx | Solicita servicios del hogar fácilmente";
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20 md:pt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-10 text-center">
            Cómo funciona Chamby
          </h1>
          <HowItWorks />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default HowItWorksPage;
