import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Loader2,
  DollarSign,
  Ban,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface Dispute {
  id: string;
  job_id: string;
  invoice_id: string | null;
  opened_by_user_id: string;
  opened_by_role: string;
  reason_code: string;
  reason_text: string | null;
  status: string;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  // Joined data
  job_title?: string;
  job_category?: string;
  client_name?: string;
  provider_name?: string;
  invoice_total?: number;
}

const REASON_LABELS: Record<string, string> = {
  no_show: "No se presentó",
  bad_service: "Mal servicio",
  pricing_dispute: "Desacuerdo en precio",
  damage: "Daño a propiedad",
  other: "Otro",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: "Abierta", color: "bg-destructive/10 text-destructive border-destructive/20" },
  resolved_release: { label: "Pago liberado", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  resolved_refund: { label: "Reembolsado", color: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  resolved_cancelled: { label: "Cancelada", color: "bg-muted text-muted-foreground border-border" },
};

const AdminDisputesPage = () => {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const { data: disputesData, error } = await supabase
        .from("disputes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrich with job/user data
      const enriched = await Promise.all(
        (disputesData || []).map(async (d) => {
          const { data: job } = await supabase
            .from("jobs")
            .select("title, category, client_id, provider_id")
            .eq("id", d.job_id)
            .single();

          let clientName = "—";
          let providerName = "—";
          let invoiceTotal: number | undefined;

          if (job) {
            const { data: client } = await supabase
              .from("users")
              .select("full_name")
              .eq("id", job.client_id)
              .maybeSingle();
            clientName = client?.full_name || "—";

            if (job.provider_id) {
              const { data: provider } = await supabase
                .from("providers")
                .select("display_name")
                .eq("user_id", job.provider_id)
                .maybeSingle();
              providerName = provider?.display_name || "—";
            }
          }

          if (d.invoice_id) {
            const { data: inv } = await supabase
              .from("invoices")
              .select("total_customer_amount")
              .eq("id", d.invoice_id)
              .maybeSingle();
            invoiceTotal = inv?.total_customer_amount;
          }

          return {
            ...d,
            job_title: job?.title,
            job_category: job?.category,
            client_name: clientName,
            provider_name: providerName,
            invoice_total: invoiceTotal,
          } as Dispute;
        })
      );

      setDisputes(enriched);
    } catch (err) {
      console.error("Error fetching disputes:", err);
      toast.error("Error al cargar disputas");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (action: "release" | "refund" | "cancel") => {
    if (!selectedDispute) return;

    setResolving(true);
    try {
      const { data, error } = await supabase.functions.invoke("resolve-dispute", {
        body: {
          dispute_id: selectedDispute.id,
          resolution_action: action,
          resolution_notes: resolutionNotes,
        },
      });

      if (error || data?.error) {
        toast.error(data?.error || error?.message || "Error al resolver");
        return;
      }

      const labels = { release: "Pago liberado", refund: "Reembolso procesado", cancel: "Disputa cancelada" };
      toast.success(labels[action]);
      setSelectedDispute(null);
      setResolutionNotes("");
      fetchDisputes();
    } catch (err) {
      toast.error("Error inesperado");
    } finally {
      setResolving(false);
    }
  };

  const openDisputes = disputes.filter((d) => d.status === "open");
  const resolvedDisputes = disputes.filter((d) => d.status !== "open");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Disputas</h1>
            <p className="text-xs text-muted-foreground">
              {openDisputes.length} abierta{openDisputes.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={fetchDisputes}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : disputes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            <p>No hay disputas</p>
          </div>
        ) : (
          <>
            {/* Open disputes */}
            {openDisputes.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Disputas abiertas ({openDisputes.length})
                </h2>
                {openDisputes.map((d) => (
                  <DisputeCard key={d.id} dispute={d} onSelect={() => setSelectedDispute(d)} />
                ))}
              </div>
            )}

            {/* Resolved disputes */}
            {resolvedDisputes.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  Resueltas ({resolvedDisputes.length})
                </h2>
                {resolvedDisputes.map((d) => (
                  <DisputeCard key={d.id} dispute={d} onSelect={() => setSelectedDispute(d)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Resolution dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={(o) => !o && setSelectedDispute(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de disputa</DialogTitle>
            <DialogDescription>
              {selectedDispute?.job_title} — {selectedDispute?.job_category}
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>{" "}
                  <span className="font-medium">{selectedDispute.client_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Proveedor:</span>{" "}
                  <span className="font-medium">{selectedDispute.provider_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Razón:</span>{" "}
                  <span className="font-medium">{REASON_LABELS[selectedDispute.reason_code] || selectedDispute.reason_code}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Monto:</span>{" "}
                  <span className="font-medium">
                    {selectedDispute.invoice_total != null ? `$${selectedDispute.invoice_total} MXN` : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Abierta por:</span>{" "}
                  <span className="font-medium">{selectedDispute.opened_by_role === "client" ? "Cliente" : "Proveedor"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha:</span>{" "}
                  <span className="font-medium">
                    {format(new Date(selectedDispute.created_at), "d MMM yyyy HH:mm", { locale: es })}
                  </span>
                </div>
              </div>

              {selectedDispute.reason_text && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground text-xs mb-1">Descripción:</p>
                  <p>{selectedDispute.reason_text}</p>
                </div>
              )}

              {selectedDispute.status === "open" ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Notas de resolución</label>
                    <Textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Notas del admin sobre la resolución..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={() => handleResolve("release")}
                      disabled={resolving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4 mr-1" />}
                      Liberar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleResolve("refund")}
                      disabled={resolving}
                    >
                      {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                      Reembolsar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleResolve("cancel")}
                      disabled={resolving}
                    >
                      {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <Badge variant="outline" className={STATUS_LABELS[selectedDispute.status]?.color}>
                    {STATUS_LABELS[selectedDispute.status]?.label}
                  </Badge>
                  {selectedDispute.resolution_notes && (
                    <p className="mt-2 text-muted-foreground">{selectedDispute.resolution_notes}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const DisputeCard = ({ dispute, onSelect }: { dispute: Dispute; onSelect: () => void }) => {
  const statusInfo = STATUS_LABELS[dispute.status] || STATUS_LABELS.open;

  return (
    <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{dispute.job_title || dispute.job_id.slice(0, 8)}</p>
            <p className="text-xs text-muted-foreground">{dispute.job_category}</p>
          </div>
          <Badge variant="outline" className={statusInfo.color}>
            {statusInfo.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{REASON_LABELS[dispute.reason_code] || dispute.reason_code}</span>
          <span>•</span>
          <span>{dispute.opened_by_role === "client" ? "Cliente" : "Proveedor"}</span>
          <span>•</span>
          <span>{format(new Date(dispute.created_at), "d MMM", { locale: es })}</span>
          {dispute.invoice_total != null && (
            <>
              <span>•</span>
              <span>${dispute.invoice_total} MXN</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDisputesPage;
