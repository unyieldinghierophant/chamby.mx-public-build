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
    const h = i + 7;
    return { value: String(h), label: `${h}:00` };
  });

  const handleSubmit = async () => {
    if (!selectedDate || !selectedHour || !user) return;

    const newDatetime = setMinutes(setHours(selectedDate, parseInt(selectedHour)), 0);
    const isClient = user.id === clientId;
    const requestedBy = isClient ? "client" : "provider";
    const receiverId = isClient ? providerId : clientId;

    setSubmitting(true);
    try {
      // Fetch requester's name for the notification
      const { data: requesterUser } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      const requesterName = requesterUser?.full_name || (isClient ? "El cliente" : "El proveedor");

      // Write reschedule request fields onto the job
      const { error: jobError } = await supabase
        .from("jobs")
        .update({
          reschedule_requested_by: requestedBy,
          reschedule_requested_at: new Date().toISOString(),
          reschedule_proposed_datetime: newDatetime.toISOString(),
          reschedule_agreed: false,
          // Keep legacy columns in sync
          reschedule_requested_date: newDatetime.toISOString(),
          original_scheduled_date: currentScheduledAt,
        })
        .eq("id", jobId);

      if (jobError) throw jobError;

      // In-app notification to other party
      if (receiverId) {
        await supabase.from("notifications").insert({
          user_id: receiverId,
          type: "reschedule_request",
          title: "Solicitud de reagendamiento",
          message: `${requesterName} ha solicitado reagendar tu trabajo para el ${format(newDatetime, "PPP 'a las' p", { locale: es })}. ¿Aceptas el nuevo horario?`,
          link: isClient ? `/provider-portal/jobs/${jobId}` : `/active-jobs`,
          data: { job_id: jobId, proposed_datetime: newDatetime.toISOString() },
        });
      }

      // System message in chat
      if (receiverId) {
        await supabase.from("messages").insert({
          job_id: jobId,
          sender_id: user.id,
          receiver_id: receiverId,
          message_text: `📅 Solicitud de reagendamiento: nueva fecha propuesta para el ${format(newDatetime, "PPP 'a las' p", { locale: es })}`,
          is_system_message: true,
          system_event_type: "reschedule_requested",
          read: false,
        });
      }

      // Admin notification (cast: table added via direct migration, types not regenerated yet)
      await (supabase as any).from("admin_notifications").insert({
        type: "reschedule_request",
        booking_id: jobId,
        triggered_by_user_id: user.id,
        message: `${requesterName} (${requestedBy}) solicitó reagendar el trabajo ${jobId} para el ${format(newDatetime, "PPP 'a las' p", { locale: es })}.`,
        is_read: false,
      });

      toast.success("Solicitud de reagendamiento enviada");
      onOpenChange(false);
      setSelectedDate(undefined);
      setSelectedHour("");
      onRescheduleComplete?.();
    } catch (error) {
      console.error("Error requesting reschedule:", error);
      toast.error("No se pudo enviar la solicitud de reagendamiento");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar reagendamiento</DialogTitle>
          <DialogDescription>
            Propón una nueva fecha y hora. El otro lado deberá aceptar antes de que cambie.
            {currentScheduledAt && (
              <span className="block mt-1 font-medium text-foreground">
                Fecha actual: {format(new Date(currentScheduledAt), "PPP 'a las' p", { locale: es })}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nueva fecha propuesta</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
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
                  <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
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
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
            ) : (
              "Enviar solicitud"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
