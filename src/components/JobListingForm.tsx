import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ModernButton } from "@/components/ui/modern-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface JobListingFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

const JobListingForm = ({ onClose, onSuccess }: JobListingFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    rate: ""
  });

  const categories = [
    "Limpieza",
    "Plomería", 
    "Electricidad",
    "Carpintería",
    "Pintura",
    "Jardinería",
    "Mudanzas",
    "Reparaciones",
    "Otros"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      // First get the client ID from the clients table
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', user.email)
        .single();

      if (clientError) {
        throw new Error('Error finding user profile');
      }

      const { error } = await supabase
        .from('jobs')
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          rate: parseFloat(formData.rate),
          provider_id: clientData.id
        });

      if (error) throw error;

      toast({
        title: "¡Servicio listado!",
        description: "Tu servicio ha sido agregado exitosamente.",
      });

      setFormData({ title: "", description: "", category: "", rate: "" });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el servicio",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Agregar Nuevo Servicio</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título del Servicio</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="ej. Plomería residencial y comercial"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe tu servicio, experiencia y lo que incluye..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate">Tarifa por Hora (MXN)</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              min="0"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              placeholder="250.00"
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            {onClose && (
              <ModernButton 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </ModernButton>
            )}
            <ModernButton 
              type="submit" 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Guardando..." : "Crear Servicio"}
            </ModernButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default JobListingForm;