import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CURATED_SKILL_CATEGORIES, ALL_CURATED_SKILLS, MAX_SKILLS, MIN_SKILLS } from "@/data/curatedSkills";

const ProviderSkillsSelection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return CURATED_SKILL_CATEGORIES;
    return CURATED_SKILL_CATEGORIES
      .map(cat => ({ ...cat, skills: cat.skills.filter(s => s.toLowerCase().includes(q)) }))
      .filter(cat => cat.skills.length > 0);
  }, [search]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => {
      if (prev.includes(skill)) return prev.filter(s => s !== skill);
      if (prev.length >= MAX_SKILLS) return prev;
      return [...prev, skill];
    });
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skill));
  };

  const handleSave = async () => {
    if (selectedSkills.length < MIN_SKILLS) {
      toast({ title: "Selecciona al menos una habilidad", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("providers")
        .update({ skills: selectedSkills })
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({ title: "¡Habilidades guardadas!", description: "Ahora puedes comenzar a recibir trabajos" });
      navigate("/provider-portal");
    } catch (error: any) {
      console.error("Error saving skills:", error);
      toast({ title: "Error", description: "No se pudieron guardar las habilidades", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">¿Qué servicios puedes ofrecer?</CardTitle>
          <CardDescription>Elige tus habilidades (1–{MAX_SKILLS})</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Search */}
          <Input
            placeholder="Buscar habilidad…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 text-base border-2 rounded-xl"
          />

          {/* Counter */}
          <p className={cn(
            "text-sm font-medium text-center",
            selectedSkills.length === 0 ? "text-destructive/70"
              : selectedSkills.length >= MAX_SKILLS ? "text-amber-600"
              : "text-muted-foreground"
          )}>
            {selectedSkills.length}/{MAX_SKILLS} seleccionadas
          </p>

          {/* Categorized chips */}
          <div className="space-y-5">
            {filteredCategories.map((cat) => (
              <div key={cat.name}>
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  {cat.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cat.skills.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    const isDisabled = !isSelected && selectedSkills.length >= MAX_SKILLS;
                    return (
                      <button
                        key={skill}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => toggleSkill(skill)}
                        className={cn(
                          "px-3 py-2 rounded-full text-sm font-medium border transition-all",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : isDisabled
                              ? "bg-muted text-muted-foreground/50 border-muted cursor-not-allowed"
                              : "bg-background text-foreground border-border hover:border-primary/50"
                        )}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {filteredCategories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No se encontraron habilidades con "{search}"
              </p>
            )}
          </div>

          {/* Legacy non-curated skills */}
          {selectedSkills.filter(s => !ALL_CURATED_SKILLS.includes(s)).length > 0 && (
            <div className="pt-4 border-t">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Otras seleccionadas
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedSkills.filter(s => !ALL_CURATED_SKILLS.includes(s)).map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1 px-3 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="hover:text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving || selectedSkills.length < MIN_SKILLS}
              className="flex-1"
            >
              {saving ? "Guardando..." : "Guardar y continuar"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/provider-portal")} disabled={saving}>
              Omitir por ahora
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderSkillsSelection;
