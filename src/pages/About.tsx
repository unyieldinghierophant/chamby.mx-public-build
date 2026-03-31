import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const About = () => {
  return (
    <>
      <Helmet>
        <title>Sobre nosotros — Chamby.mx | Servicios del hogar en Guadalajara</title>
        <meta name="description" content="Conoce al equipo detrás de Chamby, la plataforma líder de servicios del hogar en Guadalajara, Jalisco. Nuestra historia, misión y visión." />
        <link rel="canonical" href="https://chamby.mx/about" />
      </Helmet>
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
