import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, MapPin, Calendar, Briefcase } from "lucide-react";

const PLACEHOLDER_JOBS = [
  { title: "Reparación de tubería", category: "Fontanería", location: "Col. Providencia", time: "Hoy, 3:00 PM", rate: "$450" },
  { title: "Instalación de contactos", category: "Electricidad", location: "Col. Americana", time: "Mañana, 10:00 AM", rate: "$600" },
  { title: "Pintura de sala", category: "Pintura", location: "Zapopan Centro", time: "Vie 14 Feb", rate: "$1,200" },
  { title: "Poda de jardín", category: "Jardinería", location: "Col. Chapalita", time: "Sáb 15 Feb", rate: "$350" },
];

export const UnverifiedJobsPlaceholder = () => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Blurred placeholder cards */}
      <div
        className="space-y-2.5 md:grid md:grid-cols-2 md:gap-4 md:space-y-0"
        style={{ filter: "blur(6px)", opacity: 0.45, pointerEvents: "none" }}
        aria-hidden="true"
      >
        {PLACEHOLDER_JOBS.map((job, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-foreground">{job.title}</span>
              <span className="text-xs font-medium text-primary">{job.rate}</span>
            </div>
            <span className="inline-block text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              {job.category}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>{job.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Centered CTA overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-background/95 backdrop-blur-sm border-2 border-foreground/10 rounded-2xl p-6 mx-4 max-w-sm w-full text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">
            Verifica tu cuenta para recibir trabajos
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Completa tu verificación para acceder a las oportunidades disponibles
          </p>
          <Button
            onClick={() => navigate("/provider-portal/verification")}
            className="w-full font-semibold"
          >
            Verificar ahora para recibir trabajos
          </Button>
        </div>
      </div>
    </div>
  );
};
