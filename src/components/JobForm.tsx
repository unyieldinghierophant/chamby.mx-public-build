import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useProviderJobs } from "@/hooks/useJobs";
import { Plus, Loader2 } from "lucide-react";

const JOB_CATEGORIES = [
  "Limpieza",
  "Plomería",
  "Electricidad",
  "Carpintería",
  "Jardinería",
  "Pintura",
  "Mudanzas",
  "Reparaciones",
  "Montaje",
  "Otros"
];

interface JobFormProps {
  onSuccess?: () => void;
}

const JobForm = ({ onSuccess }: JobFormProps) => {
  const { createJob } = useProviderJobs();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    rate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.rate) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    const rate = parseFloat(formData.rate);
    if (isNaN(rate) || rate <= 0) {
      toast({
        title: "Error",
        description: "El precio por hora debe ser un número válido mayor a 0",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createJob({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        rate
      });

      if (result.error) {
        toast({
          title: "Error",
          description: "No se pudo crear el trabajo",
          variant: "destructive",
        });
      } else {
        toast({
          title: "¡Trabajo creado!",
          description: "Tu trabajo ha sido publicado exitosamente",
        });
        setFormData({ title: '', description: '', category: '', rate: '' });
        onSuccess?.();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-background/60 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Crear Nuevo Trabajo
        </CardTitle>
        <CardDescription>
          Publica un nuevo servicio que ofreces
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título del Trabajo *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="ej. Plomería residencial y comercial"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Categoría *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {JOB_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rate">Precio por Hora (MXN) *</Label>
            <Input
              id="rate"
              type="number"
              min="1"
              step="0.01"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              placeholder="ej. 250.00"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe el servicio que ofreces, tu experiencia y lo que incluye..."
              rows={4}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando trabajo...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Crear Trabajo
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default JobForm;