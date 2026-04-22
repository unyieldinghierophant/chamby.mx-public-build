import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

const REASONS = [
  { value: "no_show",           label: "El proveedor no se presentó" },
  { value: "incomplete",        label: "El trabajo no fue completado" },
  { value: "bad_work",          label: "El trabajo fue mal realizado" },
  { value: "client_not_home",   label: "El cliente no estaba en casa" },
  { value: "payment_issue",     label: "Problema con el pago" },
  { value: "other",             label: "Otro" },
] as const;

const MAX_FILES = 5;
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime", "video/webm"];

interface DisputeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  onDisputeOpened: () => void;
}

export const DisputeModal = ({ open, onOpenChange, jobId, onDisputeOpened }: DisputeModalProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleFiles = (picked: FileList | null) => {
    if (!picked) return;
    const valid: File[] = [];
    const errors: string[] = [];
    Array.from(picked).forEach(f => {
      if (!ALLOWED_TYPES.includes(f.type)) { errors.push(`${f.name}: tipo no permitido`); return; }
      if (f.size > MAX_BYTES) { errors.push(`${f.name}: excede 20 MB`); return; }
      if (files.length + valid.length >= MAX_FILES) { errors.push(`Máximo ${MAX_FILES} archivos`); return; }
      valid.push(f);
    });
    if (errors.length) toast.error(errors[0]);
    setFiles(prev => [...prev, ...valid].slice(0, MAX_FILES));
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!reason) { toast.error("Selecciona un motivo"); return; }
    if (description.trim().length < 20) { toast.error("La descripción debe tener al menos 20 caracteres"); return; }
    if (!user) return;

    setSubmitting(true);
    try {
      // 1. Open the dispute via edge function
      const { data, error: fnErr } = await supabase.functions.invoke("open-dispute", {
        body: { job_id: jobId, reason_code: reason, description: description.trim() },
      });
      if (fnErr || data?.error) {
        toast.error(data?.error || fnErr?.message || "Error al abrir disputa");
        return;
      }
      const disputeId: string = data.dispute_id;

      // 2. Upload evidence files to storage + create dispute_evidence records
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `${disputeId}/${user.id}/${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("dispute-evidence")
          .upload(path, file, { contentType: file.type, upsert: false });

        if (uploadErr) { console.error("Upload failed:", uploadErr); continue; }

        const { data: urlData } = supabase.storage
          .from("dispute-evidence")
          .getPublicUrl(uploadData.path);

        // Use signed URL if bucket is private
        const { data: signedData } = await supabase.storage
          .from("dispute-evidence")
          .createSignedUrl(uploadData.path, 60 * 60 * 24 * 365); // 1 year

        const fileUrl = signedData?.signedUrl || urlData.publicUrl;
        const fileType = file.type.startsWith("video/") ? "video" : "image";

        await (supabase as any).from("dispute_evidence").insert({
          dispute_id: disputeId,
          uploaded_by_user_id: user.id,
          uploaded_by_role: data.role,
          file_url: fileUrl,
          file_type: fileType,
        });
      }

      setDone(true);
      onDisputeOpened();
    } catch (err) {
      toast.error("Error inesperado al enviar la disputa");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setReason(""); setDescription(""); setFiles([]); setDone(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Abrir disputa
          </DialogTitle>
          <DialogDescription>
            El pago quedará congelado hasta que un administrador resuelva el caso.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="py-6 text-center space-y-3">
            <div className="text-4xl">✅</div>
            <p className="font-semibold text-foreground">Tu disputa fue enviada.</p>
            <p className="text-sm text-muted-foreground">
              Te contactaremos pronto por WhatsApp para resolver el caso.
            </p>
            <Button className="mt-2" onClick={handleClose}>Cerrar</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Reason */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Motivo <span className="text-destructive">*</span></label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un motivo" />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Descripción <span className="text-destructive">*</span>
                <span className="text-muted-foreground font-normal ml-1">(mín. 20 caracteres)</span>
              </label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe el problema con detalle..."
                rows={4}
                className={description.length > 0 && description.trim().length < 20 ? "border-destructive" : ""}
              />
              <p className="text-xs text-muted-foreground mt-1">{description.trim().length}/20 caracteres mínimos</p>
            </div>

            {/* File upload */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Evidencia <span className="text-muted-foreground font-normal">(opcional, máx. {MAX_FILES} archivos · 20 MB c/u)</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />
              {files.length < MAX_FILES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Subir imágenes o videos
                </button>
              )}
              {files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-1.5">
                      <span className="truncate max-w-[280px]">{f.name}</span>
                      <button onClick={() => removeFile(i)} className="ml-2 text-muted-foreground hover:text-destructive flex-shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={handleClose} disabled={submitting}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleSubmit}
                disabled={submitting || !reason || description.trim().length < 20}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                {submitting ? "Enviando…" : "Enviar disputa"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
