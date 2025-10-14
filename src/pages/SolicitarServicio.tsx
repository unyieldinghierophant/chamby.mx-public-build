import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Upload, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const serviceRequestSchema = z.object({
  serviceType: z.string().trim().min(1, "Tipo de servicio es requerido").max(200),
  serviceDate: z.date(),
  description: z.string().trim().max(1000).optional(),
});

const SolicitarServicio = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const [serviceType, setServiceType] = useState('');
  const [serviceDate, setServiceDate] = useState<Date>();
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen no debe exceder 5MB",
          variant: "destructive"
        });
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!image || !user) return null;

    const fileExt = image.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('service-requests')
      .upload(fileName, image);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('service-requests')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para solicitar un servicio",
        variant: "destructive"
      });
      return;
    }

    setErrors({});
    
    // Validate inputs
    const validation = serviceRequestSchema.safeParse({
      serviceType,
      serviceDate,
      description
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      // Upload image if provided
      let imageUrl: string | null = null;
      if (image) {
        imageUrl = await uploadImage();
      }

      // Save to database
      const { error: dbError } = await supabase
        .from('service_requests')
        .insert({
          user_id: user.id,
          service_type: serviceType,
          service_date: serviceDate?.toISOString(),
          description: description || null,
          image_url: imageUrl
        });

      if (dbError) throw dbError;

      // Build WhatsApp message
      const userName = profile.full_name || user.email || 'Usuario';
      const formattedDate = serviceDate ? format(serviceDate, "PPP 'a las' p", { locale: es }) : '';
      
      let message = `*Nueva Solicitud de Servicio*\n\n`;
      message += `👤 *Cliente:* ${userName}\n`;
      message += `📧 *Email:* ${user.email}\n`;
      message += `🔧 *Servicio:* ${serviceType}\n`;
      message += `📅 *Fecha:* ${formattedDate}\n`;
      if (description) {
        message += `📝 *Descripción:* ${description}\n`;
      }
      if (imageUrl) {
        message += `🖼️ *Imagen adjunta:* ${imageUrl}`;
      }

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/523325438136?text=${encodedMessage}`;

      // Open WhatsApp
      window.open(whatsappUrl, '_blank');

      // Show success toast and redirect
      toast({
        title: "¡Solicitud enviada!",
        description: "Tu solicitud ha sido enviada a Chamby por WhatsApp"
      });

      setTimeout(() => {
        navigate('/user-landing');
      }, 1500);

    } catch (error) {
      console.error('Error submitting service request:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/user-landing')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <Card className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Solicitar Servicio
            </h1>
            <p className="text-muted-foreground">
              Completa el formulario y envía tu solicitud por WhatsApp
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Type */}
            <div className="space-y-2">
              <Label htmlFor="serviceType">
                Tipo de servicio <span className="text-destructive">*</span>
              </Label>
              <Input
                id="serviceType"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="Ej: Reparación de plomería"
                maxLength={200}
              />
              {errors.serviceType && (
                <p className="text-sm text-destructive">{errors.serviceType}</p>
              )}
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label>
                Fecha y hora del servicio <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !serviceDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {serviceDate ? format(serviceDate, "PPP 'a las' p", { locale: es }) : "Selecciona fecha y hora"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={serviceDate}
                    onSelect={setServiceDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {errors.serviceDate && (
                <p className="text-sm text-destructive">{errors.serviceDate}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe los detalles del servicio que necesitas..."
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/1000
              </p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">Imagen (opcional)</Label>
              <div className="flex flex-col gap-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                {imagePreview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              size="lg"
            >
              {loading ? (
                "Enviando..."
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Book via WhatsApp
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SolicitarServicio;
