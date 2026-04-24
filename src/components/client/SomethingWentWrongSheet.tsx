import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { DisputeModal } from "@/components/DisputeModal";

interface SomethingWentWrongSheetProps {
  jobId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved?: () => void;
}

const REASONS = [
  { key: "no_finish", label: "El proveedor no terminó el trabajo" },
  { key: "no_show",   label: "El proveedor no se presentó" },
  { key: "bad_work",  label: "El trabajo quedó mal hecho" },
  { key: "other",     label: "Otro problema" },
] as const;

type ReasonKey = typeof REASONS[number]["key"];

export const SomethingWentWrongSheet = ({
  jobId,
  open,
  onOpenChange,
  onResolved,
}: SomethingWentWrongSheetProps) => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<ReasonKey | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);

  const reset = () => { setSelected(null); setDetails(""); };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSendReport = async () => {
    if (!user || !selected) return;
    const reasonLabel = REASONS.find(r => r.key === selected)?.label ?? selected;
    setSubmitting(true);
    const { error } = await supabase.from("admin_notifications").insert({
      type: "support_report",
      booking_id: jobId,
      triggered_by_user_id: user.id,
      message: `[${reasonLabel}] ${details.trim() || "(sin detalles)"}`,
      is_read: false,
    });
    setSubmitting(false);
    if (error) {
      toast.error("No pudimos enviar tu reporte. Intenta de nuevo.");
      return;
    }
    toast.success("Reporte enviado. Nuestro equipo te contactará pronto.");
    reset();
    onOpenChange(false);
    onResolved?.();
  };

  const handleOpenDispute = () => {
    onOpenChange(false);
    setDisputeOpen(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle className="text-lg">¿Algo salió mal?</SheetTitle>
            <SheetDescription className="text-sm">
              Cuéntanos qué pasó y lo resolveremos.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 mt-4">
            {REASONS.map(r => (
              <button
                key={r.key}
                type="button"
                onClick={() => setSelected(r.key)}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
                  selected === r.key
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {r.label}
              </button>
            ))}

            {selected && (
              <div className="pt-1">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Detalles (opcional)
                </label>
                <Textarea
                  value={details}
                  onChange={e => setDetails(e.target.value.slice(0, 600))}
                  rows={4}
                  placeholder="Describe brevemente lo que pasó..."
                  className="resize-none"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-5">
            <Button
              onClick={handleSendReport}
              disabled={!selected || submitting}
              className="w-full"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enviar reporte
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenDispute}
              disabled={submitting}
              className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
            >
              <AlertTriangle className="w-4 h-4" />
              Abrir disputa formal
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <DisputeModal
        open={disputeOpen}
        onOpenChange={setDisputeOpen}
        jobId={jobId}
        onDisputeOpened={() => { setDisputeOpen(false); onResolved?.(); }}
      />
    </>
  );
};
