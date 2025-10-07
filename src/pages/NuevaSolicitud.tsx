import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Step1Photos from "@/components/solicitud/Step1Photos";
import Step2Description from "@/components/solicitud/Step2Description";
import Step3DateTime from "@/components/solicitud/Step3DateTime";
import Step4Location from "@/components/solicitud/Step4Location";
import Step5Review from "@/components/solicitud/Step5Review";

export interface SolicitudFormData {
  serviceType: string;
  problem: string;
  photos: string[];
  description: string;
  urgent: boolean;
  scheduledAt: string | null;
  location: string;
}

const NuevaSolicitud = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<SolicitudFormData>({
    serviceType: searchParams.get("serviceType") || "",
    problem: searchParams.get("problem") || "",
    photos: [],
    description: "",
    urgent: false,
    scheduledAt: null,
    location: "",
  });

  // Load saved state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("nueva-solicitud-draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed }));
        setCurrentStep(parsed.currentStep || 1);
      } catch (e) {
        console.error("Error loading draft:", e);
      }
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const dataToSave = { ...formData, currentStep };
    localStorage.setItem("nueva-solicitud-draft", JSON.stringify(dataToSave));
  }, [formData, currentStep]);

  const updateFormData = (updates: Partial<SolicitudFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para crear una solicitud");
      navigate("/auth/user");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: jobData, error } = await supabase.from("jobs").insert({
        client_id: user.id,
        service_type: formData.serviceType,
        problem: formData.problem,
        description: formData.description,
        photos: formData.photos,
        location: formData.location,
        urgent: formData.urgent,
        scheduled_at: formData.scheduledAt,
        status: "pending",
        visit_fee_paid: false,
        title: `${formData.serviceType} - ${formData.problem}`,
        // Required fields from existing schema
        provider_id: user.id, // Temporary, will be assigned later
        rate: 0,
        category: formData.serviceType,
      } as any).select().single();

      if (error) throw error;

      // Clear draft from localStorage
      localStorage.removeItem("nueva-solicitud-draft");

      toast.success("Solicitud creada exitosamente");
      navigate(`/pago-visita?job_id=${jobData.id}`);
    } catch (error) {
      console.error("Error creating job:", error);
      toast.error("Error al crear la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.photos.length > 0;
      case 2:
        return formData.description.trim().length > 0;
      case 3:
        return formData.urgent || formData.scheduledAt !== null;
      case 4:
        return formData.location.trim().length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-main py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header with back button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>

          {/* Service Summary */}
          {formData.serviceType && (
            <Card className="bg-gradient-card border-0 mb-6">
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold text-foreground capitalize">
                  {formData.serviceType}
                </h2>
                {formData.problem && (
                  <p className="text-muted-foreground capitalize">
                    {formData.problem}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-foreground">
              Paso {currentStep} de 5
            </span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`h-2 w-12 rounded-full transition-colors ${
                    step <= currentStep
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <Card className="bg-gradient-card border-0 shadow-raised">
          <CardContent className="p-6">
            {currentStep === 1 && (
              <Step1Photos
                photos={formData.photos}
                onPhotosChange={(photos) => updateFormData({ photos })}
              />
            )}
            {currentStep === 2 && (
              <Step2Description
                description={formData.description}
                onDescriptionChange={(description) =>
                  updateFormData({ description })
                }
              />
            )}
            {currentStep === 3 && (
              <Step3DateTime
                urgent={formData.urgent}
                scheduledAt={formData.scheduledAt}
                onUrgentChange={(urgent) => updateFormData({ urgent })}
                onScheduledAtChange={(scheduledAt) =>
                  updateFormData({ scheduledAt })
                }
              />
            )}
            {currentStep === 4 && (
              <Step4Location
                location={formData.location}
                onLocationChange={(location) => updateFormData({ location })}
              />
            )}
            {currentStep === 5 && (
              <Step5Review formData={formData} />
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {currentStep === 1 ? "Cancelar" : "Anterior"}
          </Button>

          {currentStep < 5 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
            >
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-button"
            >
              {isSubmitting ? "Guardando..." : "Continuar al pago"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NuevaSolicitud;
