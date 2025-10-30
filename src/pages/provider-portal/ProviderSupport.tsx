import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageCircle, Mail, Phone } from "lucide-react";

const faqs = [
  {
    question: "¿Cómo acepto un trabajo?",
    answer:
      "Ve a la sección de Trabajos > Disponibles y haz clic en 'Aceptar trabajo' en la oferta que te interese.",
  },
  {
    question: "¿Cuándo recibiré mi pago?",
    answer:
      "Los pagos se liberan automáticamente 24-48 horas después de completar un trabajo. Los proveedores verificados reciben pagos express.",
  },
  {
    question: "¿Cómo me verifico?",
    answer:
      "Ve a la sección de Verificación y completa los 4 pasos: subir foto, documentos, entrevista y completar 5 trabajos con buena calificación.",
  },
  {
    question: "¿Puedo cancelar un trabajo aceptado?",
    answer:
      "Sí, pero las cancelaciones frecuentes pueden afectar tu calificación. Intenta reprogramar en lugar de cancelar.",
  },
];

const ProviderSupport = () => {
  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Soporte</h1>
        <p className="text-muted-foreground">
          Estamos aquí para ayudarte
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardContent className="pt-6 text-center space-y-2">
            <MessageCircle className="h-8 w-8 mx-auto text-primary" />
            <h3 className="font-medium">Chat en Vivo</h3>
            <p className="text-sm text-muted-foreground">
              Respuesta inmediata
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardContent className="pt-6 text-center space-y-2">
            <Mail className="h-8 w-8 mx-auto text-primary" />
            <h3 className="font-medium">Email</h3>
            <p className="text-sm text-muted-foreground">
              soporte@chamby.mx
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardContent className="pt-6 text-center space-y-2">
            <Phone className="h-8 w-8 mx-auto text-primary" />
            <h3 className="font-medium">Teléfono</h3>
            <p className="text-sm text-muted-foreground">
              +52 33 1234 5678
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reportar un Problema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Describe tu problema o pregunta..."
            rows={5}
          />
          <Button>Enviar Reporte</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preguntas Frecuentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderSupport;
