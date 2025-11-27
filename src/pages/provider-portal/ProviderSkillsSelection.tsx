import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, Plus } from "lucide-react";
import { ROUTES } from "@/constants/routes";

const SUGGESTED_SKILLS = [
  "Plomería",
  "Electricidad",
  "Pintura",
  "Limpieza",
  "Jardinería",
  "Lavado de autos",
  "Carpintería",
  "Albañilería",
  "Aire acondicionado",
  "Reparaciones generales",
  "Instalaciones",
  "Mantenimiento",
];

const ProviderSkillsSelection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const trimmedSkill = customSkill.trim();
    if (trimmedSkill && !selectedSkills.includes(trimmedSkill)) {
      setSelectedSkills((prev) => [...prev, trimmedSkill]);
      setCustomSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleSave = async () => {
    if (selectedSkills.length === 0) {
      toast({
        title: "Selecciona al menos una habilidad",
        description: "Debes seleccionar al menos una habilidad para continuar",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("providers")
        .update({ skills: selectedSkills })
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "¡Habilidades guardadas!",
        description: "Ahora puedes comenzar a recibir trabajos",
      });

      // Redirect to provider portal (onboarding can be done from settings)
      navigate("/provider-portal");
    } catch (error: any) {
      console.error("Error saving skills:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las habilidades",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    // Skip for now, go directly to provider portal
    navigate("/provider-portal");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">¿Qué servicios puedes ofrecer?</CardTitle>
          <CardDescription>
            Selecciona las habilidades que tienes. Puedes agregar más después.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Suggested Skills */}
          <div>
            <h3 className="text-sm font-medium mb-3">Habilidades sugeridas</h3>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_SKILLS.map((skill) => (
                <Badge
                  key={skill}
                  variant={selectedSkills.includes(skill) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80 transition-colors px-4 py-2"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Custom Skill Input */}
          <div>
            <h3 className="text-sm font-medium mb-3">Agregar habilidad personalizada</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Ej: Reparación de electrodomésticos"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomSkill();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addCustomSkill}
                disabled={!customSkill.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Selected Skills */}
          {selectedSkills.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">
                Habilidades seleccionadas ({selectedSkills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="px-3 py-2 flex items-center gap-2"
                  >
                    {skill}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeSkill(skill)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving || selectedSkills.length === 0}
              className="flex-1"
            >
              {saving ? "Guardando..." : "Guardar y continuar"}
            </Button>
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={saving}
            >
              Omitir por ahora
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderSkillsSelection;
