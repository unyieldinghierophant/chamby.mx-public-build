import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface PendingReschedule {
  id: string;
  title: string;
  scheduled_at: string | null;
  reschedule_requested_by: string | null;
  reschedule_requested_at: string | null;
  reschedule_proposed_datetime: string | null;
  client_id: string;
  provider_id: string | null;
  clientName?: string;
  providerName?: string;
}

export function ReagendamientosTab() {
  const [jobs, setJobs] = useState<PendingReschedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("jobs")
      .select("id, title, scheduled_at, reschedule_requested_by, reschedule_requested_at, reschedule_proposed_datetime, client_id, provider_id")
      .not("reschedule_requested_at", "is", null)
      .eq("reschedule_agreed", false)
      .order("reschedule_requested_at", { ascending: false });

    if (!data?.length) { setJobs([]); setLoading(false); return; }

    const userIds = [...new Set([
      ...data.map((j: any) => j.client_id),
      ...data.filter((j: any) => j.provider_id).map((j: any) => j.provider_id),
    ])];
    const { data: users } = await supabase.from("users").select("id, full_name").in("id", userIds);
    const nameMap: Record<string, string> = {};
    users?.forEach((u: any) => { nameMap[u.id] = u.full_name || "—"; });

    setJobs(data.map((j: any) => ({
      ...j,
      clientName: nameMap[j.client_id] || "—",
      providerName: j.provider_id ? nameMap[j.provider_id] || "—" : "—",
    })));
    setLoading(false);
  };

  const approve = async (job: PendingReschedule) => {
    setActing(job.id);
    try {
      await supabase.from("jobs").update({
        scheduled_at: job.reschedule_proposed_datetime,
        reschedule_agreed: true,
        reschedule_requested_by: null,
        reschedule_requested_at: null,
        reschedule_proposed_datetime: null,
      }).eq("id", job.id);

      const notifs = [
        { user_id: job.client_id, message: "El administrador aprobó el reagendamiento." },
        ...(job.provider_id ? [{ user_id: job.provider_id, message: "El administrador aprobó el reagendamiento." }] : []),
      ].map(n => ({ ...n, type: "reschedule_accepted", title: "Reagendamiento aprobado por admin", link: "/active-jobs", data: { job_id: job.id } }));
      await supabase.from("notifications").insert(notifs);

      toast.success("Reagendamiento aprobado");
      fetchData();
    } catch { toast.error("Error al aprobar"); }
    finally { setActing(null); }
  };

  const reject = async (job: PendingReschedule) => {
    setActing(job.id + "_r");
    try {
      await supabase.from("jobs").update({
        reschedule_requested_by: null,
        reschedule_requested_at: null,
        reschedule_proposed_datetime: null,
        reschedule_agreed: false,
      }).eq("id", job.id);

      const requesterId = job.reschedule_requested_by === "client" ? job.client_id : job.provider_id;
      if (requesterId) {
        await supabase.from("notifications").insert({
          user_id: requesterId,
          type: "reschedule_rejected",
          title: "Reagendamiento rechazado",
          message: "El administrador rechazó la solicitud de reagendamiento. El trabajo continúa en su fecha original.",
          link: "/active-jobs",
          data: { job_id: job.id },
        });
      }

      toast.success("Reagendamiento rechazado");
      fetchData();
    } catch { toast.error("Error al rechazar"); }
    finally { setActing(null); }
  };

  const fmt = (d: string | null) => d ? format(new Date(d), "dd MMM yyyy HH:mm", { locale: es }) : "—";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchData}>Actualizar</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Trabajo", "Cliente", "Proveedor", "Solicitado por", "Fecha actual", "Fecha propuesta", "Solicitado el", "Acciones"].map(h => (
                  <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {jobs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Sin solicitudes pendientes</td></tr>
              ) : jobs.map(j => (
                <tr key={j.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 max-w-[140px] truncate">{j.title}</td>
                  <td className="px-3 py-2">{j.clientName}</td>
                  <td className="px-3 py-2">{j.providerName}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline">
                      {j.reschedule_requested_by === "client" ? "Cliente" : "Proveedor"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmt(j.scheduled_at)}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-medium">{fmt(j.reschedule_proposed_datetime)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmt(j.reschedule_requested_at)}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Button size="sm" variant="default" disabled={acting === j.id} onClick={() => approve(j)}>
                        {acting === j.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Aprobar"}
                      </Button>
                      <Button size="sm" variant="outline" disabled={acting === j.id + "_r"} onClick={() => reject(j)}>
                        {acting === j.id + "_r" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Rechazar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{jobs.length} solicitudes pendientes</p>
    </div>
  );
}
