import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface Dispute {
  id: string;
  job_id: string;
  opened_by_user_id: string;
  opened_by_role: string;
  opened_by: string | null;
  reason_code: string;
  reason: string | null;
  reason_text: string | null;
  description: string | null;
  status: string;
  admin_ruling: string | null;
  split_percentage_client: number | null;
  admin_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  openerName?: string;
  jobTitle?: string;
  geoMismatch?: boolean;
}

interface Evidence {
  id: string;
  dispute_id: string;
  file_url: string;
  file_type: string;
  description: string | null;
  uploaded_by_role: string;
}

const STATUS_LABEL: Record<string, string> = {
  open: "Abierta",
  under_review: "En revisión",
  resolved: "Resuelta",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "destructive",
  under_review: "default",
  resolved: "secondary",
};

export function DisputasTab() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [job, setJob] = useState<any>(null);
  const [ruling, setRuling] = useState<string>("");
  const [splitPct, setSplitPct] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [flagging, setFlagging] = useState(false);

  useEffect(() => { fetchDisputes(); }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("disputes").select("*").order("created_at", { ascending: false });
    if (!data?.length) { setDisputes([]); setLoading(false); return; }

    const userIds = [...new Set(data.map((d: Dispute) => d.opened_by_user_id))];
    const jobIds = [...new Set(data.map((d: Dispute) => d.job_id))];

    const [{ data: users }, { data: jobs }] = await Promise.all([
      supabase.from("users").select("id, full_name").in("id", userIds),
      supabase.from("jobs").select("id, title, geolocation_mismatch").in("id", jobIds),
    ]);

    const userMap: Record<string, string> = {};
    users?.forEach((u: any) => { userMap[u.id] = u.full_name || "—"; });
    const jobMap: Record<string, string> = {};
    const geoMap: Record<string, boolean> = {};
    jobs?.forEach((j: any) => {
      jobMap[j.id] = j.title || j.id.slice(0, 8);
      geoMap[j.id] = !!j.geolocation_mismatch;
    });

    setDisputes(data.map((d: Dispute) => ({
      ...d,
      openerName: userMap[d.opened_by_user_id] || "—",
      jobTitle: jobMap[d.job_id] || d.job_id.slice(0, 8) + "…",
      geoMismatch: geoMap[d.job_id] ?? false,
    })));
    setLoading(false);
  };

  const openDetail = async (dispute: Dispute) => {
    setSelected(dispute);
    setRuling(dispute.admin_ruling || "");
    setSplitPct(dispute.split_percentage_client?.toString() || "");
    setNotes(dispute.admin_notes || "");

    const [{ data: ev }, { data: jobData }] = await Promise.all([
      (supabase as any).from("dispute_evidence").select("*").eq("dispute_id", dispute.id),
      supabase.from("jobs").select("*, client:users!jobs_client_id_fkey(full_name, email), provider:users!jobs_provider_id_fkey(full_name, email)").eq("id", dispute.job_id).maybeSingle().catch(() => ({ data: null })),
    ]);
    setEvidence(ev || []);
    // Fallback if foreign key join not available
    if (!jobData) {
      const { data: j } = await supabase.from("jobs").select("*").eq("id", dispute.job_id).maybeSingle();
      setJob(j);
    } else {
      setJob(jobData);
    }
  };

  const saveRuling = async () => {
    if (!selected || !ruling) return;
    setSaving(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("resolve-dispute", {
        body: {
          dispute_id: selected.id,
          admin_ruling: ruling,
          split_percentage_client: ruling === "split" ? parseInt(splitPct) || 50 : null,
          admin_notes: notes || null,
        },
      });

      if (fnErr || data?.error) {
        toast.error(data?.error || fnErr?.message || "Error al resolver");
        return;
      }

      if (data?.stripe_errors?.length) {
        toast.warning(`Disputa resuelta. Nota Stripe: ${data.stripe_errors[0]}`);
      } else {
        toast.success("Disputa resuelta — ambas partes notificadas");
      }

      setSelected(null);
      fetchDisputes();
    } catch {
      toast.error("Error inesperado al resolver la disputa");
    } finally {
      setSaving(false);
    }
  };

  const addFlag = async (userId: string, role: "client" | "provider") => {
    setFlagging(true);
    try {
      const { data: u } = await supabase.from("users").select("flag_count, account_status").eq("id", userId).single();
      const newCount = (u?.flag_count ?? 0) + 1;
      const newStatus = newCount >= 6 ? "suspended" : newCount >= 3 ? "frozen" : (u?.account_status ?? "active");
      await supabase.from("users").update({ flag_count: newCount, account_status: newStatus }).eq("id", userId);
      await (supabase as any).from("account_flags").insert({
        user_id: userId,
        reason: `Advertencia admin — disputa ${selected?.id?.slice(0, 8)}`,
        flagged_by: "admin",
        booking_id: selected?.job_id ?? null,
      });
      toast.success(`Advertencia agregada al ${role === "client" ? "cliente" : "proveedor"} (flag ${newCount})`);
    } catch {
      toast.error("Error al agregar advertencia");
    } finally {
      setFlagging(false);
    }
  };

  const fmt = (d: string) => format(new Date(d), "dd MMM yyyy HH:mm", { locale: es });

  if (selected) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Booking info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Trabajo</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">ID:</span> <span className="font-mono">{selected.job_id}</span></p>
              {job && <>
                <p><span className="text-muted-foreground">Título:</span> {job.title}</p>
                <p><span className="text-muted-foreground">Estado:</span> {job.status}</p>
                <p><span className="text-muted-foreground">Programado:</span> {job.scheduled_at ? fmt(job.scheduled_at) : "—"}</p>
                <p><span className="text-muted-foreground">Cliente:</span> {job.client?.full_name || job.client_id?.slice(0, 8)}</p>
                <p><span className="text-muted-foreground">Proveedor:</span> {job.provider?.full_name || job.provider_id?.slice(0, 8) || "—"}</p>
              </>}
            </CardContent>
          </Card>

          {/* Dispute info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Disputa</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Abierta por:</span> {selected.openerName} ({selected.opened_by_role})</p>
              <p><span className="text-muted-foreground">Motivo:</span> {selected.reason || selected.reason_code}</p>
              {(selected.description || selected.reason_text) && (
                <p className="text-muted-foreground">{selected.description || selected.reason_text}</p>
              )}
              <p><span className="text-muted-foreground">Estado:</span>{" "}
                <Badge variant={STATUS_VARIANT[selected.status] ?? "secondary"}>{STATUS_LABEL[selected.status] ?? selected.status}</Badge>
              </p>
              <p><span className="text-muted-foreground">Creada:</span> {fmt(selected.created_at)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Evidence */}
        {evidence.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Evidencia ({evidence.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {evidence.map(ev => (
                  <div key={ev.id} className="space-y-1">
                    {ev.file_type === "image" ? (
                      <img src={ev.file_url} alt={ev.description || "evidence"} className="w-full h-32 object-cover rounded-lg border" />
                    ) : (
                      <video src={ev.file_url} controls className="w-full h-32 rounded-lg border" />
                    )}
                    {ev.description && <p className="text-xs text-muted-foreground">{ev.description}</p>}
                    <Badge variant="outline" className="text-xs">{ev.uploaded_by_role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin ruling */}
        <Card>
          <CardHeader><CardTitle className="text-base">Fallo del administrador</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Fallo</label>
              <Select value={ruling} onValueChange={setRuling}>
                <SelectTrigger><SelectValue placeholder="Selecciona un fallo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_wins">Cliente gana</SelectItem>
                  <SelectItem value="provider_wins">Proveedor gana</SelectItem>
                  <SelectItem value="split">División</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {ruling === "split" && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">% reembolso al cliente (0–100)</label>
                <Input type="number" min={0} max={100} value={splitPct} onChange={e => setSplitPct(e.target.value)} className="w-32" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Notas del administrador</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Observaciones internas…" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={saveRuling} disabled={!ruling || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Resolver disputa
              </Button>
              {job?.client_id && (
                <Button variant="outline" size="sm" disabled={flagging} onClick={() => addFlag(job.client_id, "client")}>
                  + Advertencia al cliente
                </Button>
              )}
              {job?.provider_id && (
                <Button variant="outline" size="sm" disabled={flagging} onClick={() => addFlag(job.provider_id, "provider")}>
                  + Advertencia al proveedor
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchDisputes}>Actualizar</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["ID disputa", "Trabajo", "Abierta por", "Motivo", "Estado", "Creada"].map(h => (
                  <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {disputes.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Sin disputas</td></tr>
              ) : disputes.map(d => (
                <tr key={d.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => openDetail(d)}>
                  <td className="px-3 py-2 font-mono text-xs">{d.id.slice(0, 8)}…</td>
                  <td className="px-3 py-2 text-xs">
                    <span className="inline-flex items-center gap-1">
                      {d.geoMismatch && <span title="Check-in GPS sospechoso">⚠️</span>}
                      {d.jobTitle}
                    </span>
                  </td>
                  <td className="px-3 py-2">{d.openerName}</td>
                  <td className="px-3 py-2 max-w-[180px] truncate">{d.reason || d.reason_code}</td>
                  <td className="px-3 py-2">
                    <Badge variant={STATUS_VARIANT[d.status] ?? "secondary"}>{STATUS_LABEL[d.status] ?? d.status}</Badge>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmt(d.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{disputes.length} disputas</p>
    </div>
  );
}
