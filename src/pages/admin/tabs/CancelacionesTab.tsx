import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2 } from "lucide-react";

interface CancelledJob {
  id: string;
  scheduled_at: string | null;
  updated_at: string;
  client_id: string;
  provider_id: string | null;
  cancellation_requested_by: string | null;
  late_cancellation_penalty_applied: boolean | null;
  geolocation_mismatch: boolean | null;
  clientName?: string;
  providerName?: string;
}

export function CancelacionesTab() {
  const [jobs, setJobs] = useState<CancelledJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBy, setFilterBy] = useState<"all" | "client" | "provider">("all");
  const [lateOnly, setLateOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: jobsData } = await supabase
      .from("jobs")
      .select("id, scheduled_at, updated_at, client_id, provider_id, cancellation_requested_by, late_cancellation_penalty_applied, geolocation_mismatch")
      .eq("status", "cancelled")
      .order("updated_at", { ascending: false });

    if (!jobsData?.length) { setJobs([]); setLoading(false); return; }

    const userIds = [...new Set([
      ...jobsData.map(j => j.client_id),
      ...jobsData.filter(j => j.provider_id).map(j => j.provider_id!),
    ])];

    const { data: usersData } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", userIds);

    const nameMap: Record<string, string> = {};
    usersData?.forEach(u => { nameMap[u.id] = u.full_name || "—"; });

    setJobs(jobsData.map(j => ({
      ...j,
      clientName: nameMap[j.client_id] || "—",
      providerName: j.provider_id ? nameMap[j.provider_id] || "—" : "—",
    })));
    setLoading(false);
  };

  const filtered = jobs.filter(j => {
    if (filterBy === "client" && j.cancellation_requested_by !== "client") return false;
    if (filterBy === "provider" && j.cancellation_requested_by !== "provider") return false;
    if (lateOnly && !j.late_cancellation_penalty_applied) return false;
    if (dateFrom && j.updated_at < dateFrom) return false;
    if (dateTo && j.updated_at > dateTo + "T23:59:59") return false;
    return true;
  });

  const fmt = (d: string | null) =>
    d ? format(new Date(d), "dd MMM yyyy HH:mm", { locale: es }) : "—";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filterBy} onValueChange={(v: any) => setFilterBy(v)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="client">Cancelados por cliente</SelectItem>
            <SelectItem value="provider">Cancelados por proveedor</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={lateOnly} onChange={e => setLateOnly(e.target.checked)} className="rounded" />
          Solo tardías
        </label>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Desde</span>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36 h-8 text-sm" />
          <span className="text-muted-foreground">Hasta</span>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36 h-8 text-sm" />
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>Actualizar</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["ID trabajo", "Cliente", "Proveedor", "Fecha programada", "Cancelado el", "Cancelado por", "Penalización", "Tardía"].map(h => (
                  <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Sin resultados</td></tr>
              ) : filtered.map(j => (
                <tr key={j.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-xs">
                    <span className="inline-flex items-center gap-1">
                      {j.geolocation_mismatch && <span title="Check-in GPS sospechoso">⚠️</span>}
                      {j.id.slice(0, 8)}…
                    </span>
                  </td>
                  <td className="px-3 py-2">{j.clientName}</td>
                  <td className="px-3 py-2">{j.providerName}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmt(j.scheduled_at)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmt(j.updated_at)}</td>
                  <td className="px-3 py-2">
                    {j.cancellation_requested_by ? (
                      <Badge variant={j.cancellation_requested_by === "client" ? "secondary" : "outline"}>
                        {j.cancellation_requested_by === "client" ? "Cliente" : "Proveedor"}
                      </Badge>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={j.late_cancellation_penalty_applied ? "destructive" : "secondary"}>
                      {j.late_cancellation_penalty_applied ? "Sí" : "No"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={j.late_cancellation_penalty_applied ? "destructive" : "outline"}>
                      {j.late_cancellation_penalty_applied ? "Sí" : "No"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{filtered.length} registros</p>
    </div>
  );
}
