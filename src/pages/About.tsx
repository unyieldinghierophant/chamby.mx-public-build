import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSeo } from "@/lib/seo";

const About = () => {
  useSeo({
    title: "Sobre Chamby — Construyendo confianza en servicios a domicilio en México",
    description: "Conoce la historia de Chamby: un marketplace que verifica a cada proveedor, protege cada pago por escrow y respalda cada servicio con garantía de satisfacción.",
    path: "/about",
  });

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20 md:pt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            Sobre nosotros
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Chamby nació en Guadalajara con una misión clara: conectar a las familias con profesionales del hogar verificados, confiables y rápidos. Estamos construyendo la plataforma que transforma la manera en que solicitas y recibes servicios — desde fontanería hasta limpieza a domicilio.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Próximamente publicaremos la historia completa de nuestro equipo y cómo empezamos. ¡Mantente al tanto!
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default About;
