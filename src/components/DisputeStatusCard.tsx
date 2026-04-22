import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Evidence {
  id: string;
  file_url: string;
  file_type: string;
  description: string | null;
  uploaded_by_user_id: string;
}

interface Dispute {
  id: string;
  status: string;
  opened_by_role: string;
  reason_code: string;
  admin_ruling: string | null;
  split_percentage_client: number | null;
  created_at: string;
}

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  open:         { label: "En revisión — tu caso está siendo evaluado", color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-700" },
  under_review: { label: "En revisión avanzada — el administrador está analizando la evidencia", color: "bg-blue-500/10 border-blue-500/30 text-blue-700" },
  resolved:     { label: "Resuelta", color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700" },
};

const RULING_LABELS: Record<string, string> = {
  client_wins: "El fallo fue a tu favor — recibirás un reembolso completo.",
  provider_wins: "El fallo fue a favor del proveedor.",
  split: "El fallo fue una división de fondos.",
};

const ALLOWED_TYPES = ["image/jpeg","image/jpg","image/png","image/webp","image/gif","video/mp4","video/quicktime","video/webm"];
const MAX_BYTES = 20 * 1024 * 1024;
const MAX_FILES = 5;

interface Props {
  jobId: string;
  role: "client" | "provider";
  onUpdate?: () => void;
}

export function DisputeStatusCard({ jobId, role, onUpdate }: Props) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [myEvidence, setMyEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const fetchDispute = async () => {
    const { data } = await (supabase as any)
      .from("disputes")
      .select("id, status, opened_by_role, reason_code, admin_ruling, split_percentage_client, created_at")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setDispute(data ?? null);

    if (data && user) {
      const { data: ev } = await (supabase as any)
        .from("dispute_evidence")
        .select("id, file_url, file_type, description, uploaded_by_user_id")
        .eq("dispute_id", data.id)
        .eq("uploaded_by_user_id", user.id);
      setMyEvidence(ev ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDispute(); }, [jobId, user]);

  const handlePickFiles = (list: FileList | null) => {
    if (!list) return;
    const valid: File[] = [];
    Array.from(list).forEach(f => {
      if (!ALLOWED_TYPES.includes(f.type)) { toast.error(`${f.name}: tipo no permitido`); return; }
      if (f.size > MAX_BYTES) { toast.error(`${f.name}: excede 20 MB`); return; }
      valid.push(f);
    });
    setNewFiles(prev => [...prev, ...valid].slice(0, MAX_FILES));
  };

  const uploadEvidence = async () => {
    if (!dispute || !user || newFiles.length === 0) return;
    setUploading(true);
    try {
      for (const file of newFiles) {
        const ext = file.name.split(".").pop();
        const path = `${dispute.id}/${user.id}/${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("dispute-evidence")
          .upload(path, file, { contentType: file.type, upsert: false });

        if (uploadErr) { console.error("Upload error:", uploadErr); continue; }

        const { data: signedData } = await supabase.storage
          .from("dispute-evidence")
          .createSignedUrl(uploadData.path, 60 * 60 * 24 * 365);

        await (supabase as any).from("dispute_evidence").insert({
          dispute_id: dispute.id,
          uploaded_by_user_id: user.id,
          uploaded_by_role: role,
          file_url: signedData?.signedUrl || "",
          file_type: file.type.startsWith("video/") ? "video" : "image",
        });
      }
      toast.success("Evidencia agregada");
      setNewFiles([]);
      fetchDispute();
      onUpdate?.();
    } catch { toast.error("Error al subir evidencia"); }
    finally { setUploading(false); }
  };

  if (loading) return null;
  if (!dispute) return null;

  const info = STATUS_INFO[dispute.status] ?? STATUS_INFO.open;
  const isOpen = ["open", "under_review"].includes(dispute.status);

  return (
    <Card className={`border ${info.color}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Disputa abierta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{info.label}</p>

        {dispute.status === "resolved" && dispute.admin_ruling && (
          <p className="text-sm font-medium">
            {RULING_LABELS[dispute.admin_ruling] ?? `Fallo: ${dispute.admin_ruling}`}
            {dispute.admin_ruling === "split" && dispute.split_percentage_client != null && (
              <span className="ml-1">({role === "client" ? dispute.split_percentage_client : 100 - dispute.split_percentage_client}%)</span>
            )}
          </p>
        )}

        {/* My evidence */}
        {myEvidence.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">Tu evidencia ({myEvidence.length})</p>
            <div className="grid grid-cols-3 gap-2">
              {myEvidence.map(ev => (
                <div key={ev.id} className="relative">
                  {ev.file_type === "image" ? (
                    <a href={ev.file_url} target="_blank" rel="noopener noreferrer">
                      <img src={ev.file_url} alt="evidence" className="w-full h-20 object-cover rounded border" />
                    </a>
                  ) : (
                    <video src={ev.file_url} className="w-full h-20 object-cover rounded border" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add evidence (only while open) */}
        {isOpen && (
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={e => handlePickFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-current/30 rounded p-2 text-xs hover:bg-current/5 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Agregar evidencia
            </button>
            {newFiles.length > 0 && (
              <div className="space-y-1">
                {newFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-background/60 rounded px-2 py-1">
                    <span className="truncate">{f.name}</span>
                    <button onClick={() => setNewFiles(prev => prev.filter((_, j) => j !== i))}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <Button size="sm" className="w-full h-7 text-xs" onClick={uploadEvidence} disabled={uploading}>
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  {uploading ? "Subiendo…" : `Subir ${newFiles.length} archivo${newFiles.length > 1 ? "s" : ""}`}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
