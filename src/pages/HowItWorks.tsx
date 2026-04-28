import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HowItWorks from "@/components/HowItWorks";
import { useSeo } from "@/lib/seo";

const HowItWorksPage = () => {
  useSeo({
    title: "Cómo funciona Chamby — Servicios a domicilio seguros y verificados",
    description: "Aprende cómo funciona Chamby paso a paso: solicita un servicio, recibe a un proveedor verificado y paga con confianza. Pago protegido por escrow.",
    path: "/how-it-works",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "Cómo contratar un servicio del hogar en Chamby",
      "description": "Cuatro pasos para contratar un proveedor verificado en Guadalajara y pagar de forma segura.",
      "inLanguage": "es-MX",
      "totalTime": "PT5M",
      "step": [
        {
          "@type": "HowToStep",
          "position": 1,
          "name": "Describe tu servicio",
          "text": "Cuéntanos qué necesitas — fontanería, electricidad, limpieza, jardinería o cualquier otro servicio del hogar.",
        },
        {
          "@type": "HowToStep",
          "position": 2,
          "name": "Recibe a un proveedor verificado",
          "text": "Chamby asigna a un profesional con identidad, antecedentes y experiencia verificados que llega a tu domicilio.",
        },
        {
          "@type": "HowToStep",
          "position": 3,
          "name": "Paga de forma segura",
          "text": "Tu pago queda retenido por escrow hasta que el servicio esté completado y a tu satisfacción.",
        },
        {
          "@type": "HowToStep",
          "position": 4,
          "name": "Califica al proveedor",
          "text": "Comparte tu experiencia para ayudar a otros clientes y reconocer el trabajo bien hecho.",
        },
      ],
    },
  });

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
