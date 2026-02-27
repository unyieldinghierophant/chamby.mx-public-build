import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, setHours, setMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  currentScheduledAt: string | null;
  providerId: string | null;
  clientId: string;
  onRescheduleComplete?: () => void;
}

export function RescheduleDialog({
  open,
  onOpenChange,
  jobId,
  currentScheduledAt,
  providerId,
  clientId,
  onRescheduleComplete,
}: RescheduleDialogProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedHour, setSelectedHour] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const hours = Array.from({ length: 12 }, (_, i) => {
    const h = i + 7; // 7am to 6pm
    return { value: String(h), label: `${h}:00` };
  });

  const handleSubmit = async () => {
    if (!selectedDate || !selectedHour || !user) return;

    const newDate = setMinutes(setHours(selectedDate, parseInt(selectedHour)), 0);

    setSubmitting(true);
    try {
      // Set reschedule request fields and deadline (48h)
      const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      const { error: jobError } = await supabase
        .from("jobs")
        .update({
          reschedule_requested_date: newDate.toISOString(),
          original_scheduled_date: currentScheduledAt,
          reschedule_requested_at: new Date().toISOString(),
          reschedule_response_deadline: deadline,
        })
        .eq("id", jobId);

      if (jobError) throw jobError;

      // Send system message in chat
      if (providerId) {
        const isClient = user.id === clientId;
        const receiverId = isClient ? providerId : clientId;

        await supabase.from("messages").insert({
          job_id: jobId,
          sender_id: user.id,
          receiver_id: receiverId,
          message_text: `📅 Solicitud de reprogramación: nueva fecha propuesta ${format(newDate, "PPP 'a las' p", { locale: es })}`,
          is_system_message: true,
          system_event_type: "reschedule_requested",
        });

        // Notify the other party
        await supabase.from("notifications").insert({
          user_id: receiverId,
          type: "reschedule_request",
          title: "Solicitud de reprogramación",
          message: `Se ha solicitado cambiar la fecha del trabajo al ${format(newDate, "PPP", { locale: es })}`,
          link: isClient
            ? `/provider-portal/reschedule/${jobId}`
            : `/active-jobs`,
          data: { job_id: jobId },
        });
      }

      toast.success("Solicitud de reprogramación enviada");
      onOpenChange(false);
      onRescheduleComplete?.();
    } catch (error) {
      console.error("Error requesting reschedule:", error);
      toast.error("No se pudo enviar la solicitud de reprogramación");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reagendar trabajo</DialogTitle>
          <DialogDescription>
            Selecciona una nueva fecha y hora para este trabajo.
            {currentScheduledAt && (
              <span className="block mt-1 font-medium text-foreground">
                Fecha actual: {format(new Date(currentScheduledAt), "PPP 'a las' p", { locale: es })}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nueva fecha</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: es }) : "Selecciona una fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Hora</label>
            <Select value={selectedHour} onValueChange={setSelectedHour}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona hora" />
              </SelectTrigger>
              <SelectContent>
                {hours.map((h) => (
                  <SelectItem key={h.value} value={h.value}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedDate || !selectedHour || submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar solicitud"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
