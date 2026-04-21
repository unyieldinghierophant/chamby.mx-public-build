import { Link } from "react-router-dom";
import { ArrowLeft, Search, MessageCircle, Shield, CreditCard, Users, Home, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const helpCategories = [
  {
    icon: Home,
    title: "Cómo funciona",
    description: "Aprende a usar Chamby paso a paso",
    color: "text-blue-500"
  },
  {
    icon: Users,
    title: "Para clientes",
    description: "Guías para solicitar servicios",
    color: "text-green-500"
  },
  {
    icon: Shield,
    title: "Seguridad y confianza",
    description: "Tu seguridad es nuestra prioridad",
    color: "text-purple-500"
  },
  {
    icon: CreditCard,
    title: "Pagos y facturación",
    description: "Información sobre pagos",
    color: "text-orange-500"
  }
];

const faqs = [
  {
    question: "¿Cómo reservo un servicio?",
    answer: "Reservar un servicio es muy sencillo. Solo necesitas hacer clic en 'Reservar servicio', seleccionar el tipo de servicio que necesitas, proporcionar los detalles, elegir fecha y hora, y confirmar tu reserva. Un profesional verificado se pondrá en contacto contigo."
  },
  {
    question: "¿Los profesionales están verificados?",
    answer: "Sí, todos nuestros profesionales pasan por un proceso de verificación riguroso que incluye validación de identidad, revisión de antecedentes, y evaluación de habilidades. Solo aceptamos a los mejores profesionales en cada categoría."
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer: "Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express), transferencias bancarias, y pagos en efectivo directamente con el profesional. Todos los pagos en línea son procesados de forma segura."
  },
  {
    question: "¿Puedo cancelar o reprogramar mi servicio?",
    answer: "Sí, puedes cancelar o reprogramar tu servicio hasta 24 horas antes de la cita programada sin ningún cargo. Para cancelaciones con menos de 24 horas de anticipación, se aplicará una tarifa de cancelación."
  },
  {
    question: "¿Qué pasa si no estoy satisfecho con el servicio?",
    answer: "Tu satisfacción es nuestra prioridad. Si no estás satisfecho con el servicio, contáctanos dentro de las 48 horas y trabajaremos para resolver el problema. Ofrecemos garantía de satisfacción en todos nuestros servicios."
  },
  {
    question: "¿Cómo me convierto en profesional de Chamby?",
    answer: "Para convertirte en profesional, haz clic en 'Ser profesional' en el menú principal. Deberás completar tu perfil, verificar tu identidad, proporcionar referencias, y pasar una evaluación de habilidades. Una vez aprobado, podrás empezar a recibir solicitudes de servicio."
  },
  {
    question: "¿Cuánto tiempo tarda en confirmarse mi reserva?",
    answer: "La mayoría de las reservas se confirman en menos de 2 horas. Recibirás una notificación por WhatsApp cuando un profesional acepte tu solicitud. Para servicios urgentes, puedes usar la opción de 'Servicio urgente' para una respuesta más rápida."
  },
  {
    question: "¿Chamby opera en toda la República Mexicana?",
    answer: "Actualmente operamos en las principales ciudades de México, incluyendo CDMX, Guadalajara, Monterrey, Puebla, Querétaro, y más. Estamos expandiéndonos constantemente. Ingresa tu código postal al reservar para verificar si operamos en tu área."
  }
];

const HelpCenter = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al inicio</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            ¿Cómo podemos ayudarte?
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Encuentra respuestas rápidas a tus preguntas
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar en el centro de ayuda..." 
              className="pl-12 h-14 text-lg"
            />
          </div>
        </div>

        {/* Help Categories */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
          {helpCategories.map((category, index) => (
            <Card key={index} className="hover:shadow-lg transition-all cursor-pointer group">
              <CardHeader className="text-center">
                <div className={`mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${category.color}`}>
                  <category.icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">{category.title}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Preguntas Frecuentes</h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact Support */}
        <div className="max-w-2xl mx-auto">
          <Card className="text-center border-primary/20">
            <CardHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl mb-2">¿No encontraste lo que buscabas?</CardTitle>
              <CardDescription className="text-base">
                Nuestro equipo de soporte está disponible para ayudarte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Chat en vivo
                </Button>
                <Button size="lg" variant="outline" className="gap-2" asChild>
                  <a href="mailto:armando@chamby.mx">
                    Enviar email
                  </a>
                </Button>
              </div>
              <div className="mt-6 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>💬 WhatsApp:</span>
                  <a href="https://wa.me/523325520551" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    +52 33 2552 0551
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span>o al</span>
                  <a href="https://wa.me/523319878496" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    +52 33 1987 8496
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HelpCenter;
