import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskerJobs } from '@/hooks/useTaskerJobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  Plus, 
  DollarSign, 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  Calendar as CalendarIcon,
  CheckCircle,
  MapPin,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const JOB_CATEGORIES = [
  'Limpieza',
  'Jardinería', 
  'Reparaciones',
  'Cuidado Personal',
  'Transporte',
  'Cocina',
  'Otros'
];

const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00'
];

const WEEKDAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
];

interface ServiceCreationWizardProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

interface ServiceData {
  // Step 1: Basic Info
  title: string;
  category: string;
  description: string;
  
  // Step 2: Pricing
  rate: string;
  minHours: number;
  maxHours: number;
  
  // Step 3: Location & Skills
  serviceArea: string;
  skills: string[];
  
  // Step 4: Availability
  availability: Record<string, {
    enabled: boolean;
    startTime: string;
    endTime: string;
  }>;
  
  // Step 5: Special Dates
  blockedDates: Date[];
  specialRates: Array<{
    date: Date;
    rate: number;
    reason: string;
  }>;
}

const ServiceCreationWizard = ({ onSuccess, onClose }: ServiceCreationWizardProps) => {
  const { user } = useAuth();
  const { createJob } = useTaskerJobs();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  
  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const [serviceData, setServiceData] = useState<ServiceData>({
    title: '',
    category: '',
    description: '',
    rate: '',
    minHours: 1,
    maxHours: 8,
    serviceArea: '',
    skills: [],
    availability: WEEKDAYS.reduce((acc, day) => ({
      ...acc,
      [day.key]: {
        enabled: false,
        startTime: '09:00',
        endTime: '17:00'
      }
    }), {}),
    blockedDates: [],
    specialRates: []
  });

  const updateServiceData = (updates: Partial<ServiceData>) => {
    setServiceData(prev => ({ ...prev, ...updates }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !serviceData.skills.includes(newSkill.trim())) {
      updateServiceData({
        skills: [...serviceData.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    updateServiceData({
      skills: serviceData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return serviceData.title && serviceData.category && serviceData.description;
      case 2:
        return serviceData.rate && parseFloat(serviceData.rate) > 0;
      case 3:
        return serviceData.serviceArea;
      case 4:
        return Object.values(serviceData.availability).some(day => day.enabled);
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await createJob({
        title: serviceData.title,
        description: serviceData.description,
        category: serviceData.category,
        rate: parseFloat(serviceData.rate)
      });

      if (error) {
        throw new Error(error.message || 'Error al crear el servicio');
      }

      toast.success('¡Servicio creado exitosamente!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating service:', error);
      toast.error(error.message || 'Error al crear el servicio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Briefcase className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Información Básica</h3>
              <p className="text-muted-foreground">Cuéntanos sobre tu servicio</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título del Servicio *</Label>
                <Input
                  id="title"
                  value={serviceData.title}
                  onChange={(e) => updateServiceData({ title: e.target.value })}
                  placeholder="Ej: Limpieza profunda de hogar"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Select 
                  value={serviceData.category} 
                  onValueChange={(value) => updateServiceData({ category: value })}
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

              <div className="space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={serviceData.description}
                  onChange={(e) => updateServiceData({ description: e.target.value })}
                  placeholder="Describe tu servicio, qué incluye, tu experiencia..."
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <DollarSign className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Precios y Duración</h3>
              <p className="text-muted-foreground">Define tus tarifas y tiempo de trabajo</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rate">Tarifa por Hora *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={serviceData.rate}
                    onChange={(e) => updateServiceData({ rate: e.target.value })}
                    className="pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minHours">Mínimo de Horas</Label>
                  <Input
                    id="minHours"
                    type="number"
                    min="1"
                    max="24"
                    value={serviceData.minHours}
                    onChange={(e) => updateServiceData({ minHours: parseInt(e.target.value) || 1 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxHours">Máximo de Horas</Label>
                  <Input
                    id="maxHours"
                    type="number"
                    min="1"
                    max="24"
                    value={serviceData.maxHours}
                    onChange={(e) => updateServiceData({ maxHours: parseInt(e.target.value) || 8 })}
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Vista previa:</strong> ${serviceData.rate || '0'}/hora • 
                  Mínimo {serviceData.minHours}h (${((parseFloat(serviceData.rate) || 0) * serviceData.minHours).toFixed(2)}) • 
                  Máximo {serviceData.maxHours}h (${((parseFloat(serviceData.rate) || 0) * serviceData.maxHours).toFixed(2)})
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Ubicación y Habilidades</h3>
              <p className="text-muted-foreground">Define dónde ofreces tu servicio</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceArea">Área de Servicio *</Label>
                <Input
                  id="serviceArea"
                  value={serviceData.serviceArea}
                  onChange={(e) => updateServiceData({ serviceArea: e.target.value })}
                  placeholder="Ej: Ciudad de México, Zona Norte, Radio 10km"
                />
              </div>

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
                {serviceData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {serviceData.skills.map((skill, index) => (
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
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Horarios Disponibles</h3>
              <p className="text-muted-foreground">Configura cuándo puedes trabajar</p>
            </div>
            
            <div className="space-y-4">
              {WEEKDAYS.map((day) => (
                <div key={day.key} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 min-w-[100px]">
                    <Switch
                      checked={serviceData.availability[day.key].enabled}
                      onCheckedChange={(checked) => 
                        updateServiceData({
                          availability: {
                            ...serviceData.availability,
                            [day.key]: {
                              ...serviceData.availability[day.key],
                              enabled: checked
                            }
                          }
                        })
                      }
                    />
                    <Label className="font-medium">{day.label}</Label>
                  </div>
                  
                  {serviceData.availability[day.key].enabled && (
                    <div className="flex items-center space-x-2 flex-1">
                      <Select
                        value={serviceData.availability[day.key].startTime}
                        onValueChange={(value) => 
                          updateServiceData({
                            availability: {
                              ...serviceData.availability,
                              [day.key]: {
                                ...serviceData.availability[day.key],
                                startTime: value
                              }
                            }
                          })
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <span>-</span>
                      
                      <Select
                        value={serviceData.availability[day.key].endTime}
                        onValueChange={(value) => 
                          updateServiceData({
                            availability: {
                              ...serviceData.availability,
                              [day.key]: {
                                ...serviceData.availability[day.key],
                                endTime: value
                              }
                            }
                          })
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  const allEnabled = Object.fromEntries(
                    WEEKDAYS.map(day => [
                      day.key, 
                      { enabled: true, startTime: '09:00', endTime: '17:00' }
                    ])
                  );
                  updateServiceData({ availability: allEnabled });
                }}
              >
                Habilitar Todos los Días (9:00 - 17:00)
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">¡Casi Terminamos!</h3>
              <p className="text-muted-foreground">Revisa tu servicio antes de publicarlo</p>
            </div>
            
            <div className="space-y-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-2">Resumen del Servicio</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Título:</strong> {serviceData.title}</p>
                  <p><strong>Categoría:</strong> {serviceData.category}</p>
                  <p><strong>Tarifa:</strong> ${serviceData.rate}/hora</p>
                  <p><strong>Área:</strong> {serviceData.serviceArea}</p>
                  <p><strong>Horarios:</strong> {
                    Object.entries(serviceData.availability)
                      .filter(([_, day]) => day.enabled)
                      .map(([key, day]) => {
                        const dayLabel = WEEKDAYS.find(d => d.key === key)?.label;
                        return `${dayLabel} ${day.startTime}-${day.endTime}`;
                      })
                      .join(', ')
                  }</p>
                  {serviceData.skills.length > 0 && (
                    <p><strong>Habilidades:</strong> {serviceData.skills.join(', ')}</p>
                  )}
                </div>
              </Card>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>¡Perfecto!</strong> Tu servicio estará disponible para que los usuarios lo reserven inmediatamente después de publicarlo.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="bg-card/95 backdrop-blur-sm shadow-raised max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Crear Nuevo Servicio</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Paso {currentStep} de {totalSteps}
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Básico</span>
            <span>Precios</span>
            <span>Ubicación</span>
            <span>Horarios</span>
            <span>Revisar</span>
          </div>
        </div>

        {/* Step Content */}
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-primary hover:bg-primary/90"
            >
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceed()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Publicando...' : 'Publicar Servicio'}
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCreationWizard;