import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProviderJobs } from '@/hooks/useJobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const JOB_CATEGORIES = [
  'Limpieza',
  'Jardinería',
  'Reparaciones',
  'Cuidado Personal',
  'Transporte',
  'Cocina',
  'Otros'
];

interface JobCreationFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const JobCreationForm = ({ onSuccess, onClose }: JobCreationFormProps) => {
  const { user } = useAuth();
  const { createJob } = useProviderJobs();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    rate: '',
    skills: [] as string[],
    availableHours: '',
    serviceArea: ''
  });
  
  const [newSkill, setNewSkill] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.rate) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    if (parseFloat(formData.rate) <= 0) {
      toast.error('La tarifa debe ser mayor a 0');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await createJob({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        rate: parseFloat(formData.rate)
      });

      if (error) {
        throw new Error(error.message || 'Error al crear el servicio');
      }

      toast.success('¡Servicio creado exitosamente!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        rate: '',
        skills: [],
        availableHours: '',
        serviceArea: ''
      });
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating job:', error);
      toast.error(error.message || 'Error al crear el servicio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  return (
    <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Crear Nuevo Servicio</CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título del Servicio *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ej: Limpieza profunda de hogar"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoría *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
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

          {/* Rate */}
          <div className="space-y-2">
            <Label htmlFor="rate">Tarifa por Hora *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                value={formData.rate}
                onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
                className="pl-10"
                placeholder="0.00"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Esta será tu tarifa base por hora de trabajo
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe tu servicio, qué incluye, experiencia, etc..."
            />
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label htmlFor="skills">Habilidades/Especialidades</Label>
            <div className="flex space-x-2">
              <Input
                id="skills"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Agregar habilidad"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <Button type="button" variant="outline" size="sm" onClick={addSkill}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Service Area */}
          <div className="space-y-2">
            <Label htmlFor="serviceArea">Área de Servicio</Label>
            <Input
              id="serviceArea"
              value={formData.serviceArea}
              onChange={(e) => setFormData(prev => ({ ...prev, serviceArea: e.target.value }))}
              placeholder="Ej: Ciudad de México, Zona Norte"
            />
          </div>

          {/* Available Hours */}
          <div className="space-y-2">
            <Label htmlFor="availableHours">Horarios Disponibles</Label>
            <Input
              id="availableHours"
              value={formData.availableHours}
              onChange={(e) => setFormData(prev => ({ ...prev, availableHours: e.target.value }))}
              placeholder="Ej: Lunes a Viernes 8:00 AM - 6:00 PM"
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            )}
            <Button 
              type="submit" 
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creando...' : 'Crear Servicio'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default JobCreationForm;