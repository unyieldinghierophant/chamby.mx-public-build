import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Loader2,
  AlertCircle,
  BarChart3,
  Hourglass,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProviderEarnings } from "@/hooks/useProviderEarnings";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getMonthName = (monthKey: string) => {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return format(date, "MMM yyyy", { locale: es });
};

interface HoldingPayout {
  id: string;
  amount: number;
  release_after: string | null;
  status: string;
  created_at: string;
  job_id: string | null;
  jobTitle?: string;
}

const countdown = (iso: string | null) => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "disponible ahora";
  const hrs = Math.floor(ms / 3_600_000);
  if (hrs < 24) return `en ${hrs} h`;
  return `en ${Math.floor(hrs / 24)} d`;
};

const ProviderEarningsPage = () => {
  const { user } = useAuth();
  const { totals, monthly, recentPaid, outstanding, loading, error, refetch } = useProviderEarnings();
  const [holding, setHolding] = useState<HoldingPayout[]>([]);
  const [recentReleased, setRecentReleased] = useState<HoldingPayout[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setPayoutsLoading(true);
      const [{ data: hold }, { data: rel }] = await Promise.all([
        (supabase as any)
          .from("payouts")
          .select("id,amount,release_after,status,created_at,job_id")
          .eq("provider_id", user.id)
          .in("status", ["holding", "awaiting_provider_onboarding"])
          .order("release_after", { ascending: true, nullsFirst: false }),
        (supabase as any)
          .from("payouts")
          .select("id,amount,release_after,status,created_at,job_id,released_at,paid_at")
          .eq("provider_id", user.id)
          .in("status", ["released", "paid"])
          .order("released_at", { ascending: false, nullsFirst: false })
          .limit(5),
      ]);

      const allRows = [...(hold ?? []), ...(rel ?? [])];
      const jobIds = [...new Set(allRows.map((p: any) => p.job_id).filter(Boolean))] as string[];
      const jobTitleMap: Record<string, string> = {};
      if (jobIds.length) {
        const { data: jobs } = await supabase.from("jobs").select("id,title").in("id", jobIds);
        jobs?.forEach((j: any) => { jobTitleMap[j.id] = j.title || "Trabajo"; });
      }
      if (cancelled) return;
      setHolding((hold ?? []).map((p: any) => ({ ...p, jobTitle: p.job_id ? jobTitleMap[p.job_id] : undefined })));
      setRecentReleased((rel ?? []).map((p: any) => ({ ...p, jobTitle: p.job_id ? jobTitleMap[p.job_id] : undefined })));
      setPayoutsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const pendingBalance = holding.reduce((s, p) => s + (p.amount ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando ganancias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-center text-muted-foreground">{error}</p>
            <Button onClick={refetch}>Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxMonthlyAmount = Math.max(...monthly.map((m) => m.amount), 1);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Ganancias</h1>
          <p className="text-muted-foreground mt-1">
            Resumen de tus ingresos y pagos pendientes
          </p>
        </div>
        <Link to="/provider/payouts">
          <Button variant="outline" size="sm">
            <DollarSign className="h-4 w-4 mr-1" />
            Ver Mis Pagos
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Ganado</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(totals?.lifetimeEarnings || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Este Año</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(totals?.ytdEarnings || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Por Cobrar</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(totals?.outstandingAmount || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Hourglass className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">En retención</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(pendingBalance)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {holding.length} pago{holding.length === 1 ? "" : "s"} en espera
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hold explainer / bank message */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
        <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Los pagos se retienen 5 días después de que el cliente confirma el trabajo. Al liberarse, se depositan automáticamente en tu cuenta bancaria registrada — no necesitas hacer nada.
        </p>
      </div>

      {/* Pending (holding) payouts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Hourglass className="h-5 w-5 text-blue-600" />
            Pagos en retención
          </CardTitle>
          <CardDescription>
            Cada pago se libera automáticamente 5 días después de que completes el trabajo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payoutsLoading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : holding.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Hourglass className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No tienes pagos en retención</p>
            </div>
          ) : (
            <div className="space-y-3">
              {holding.map(p => {
                const blocked = p.status === "awaiting_provider_onboarding";
                const ms = p.release_after ? new Date(p.release_after).getTime() - Date.now() : null;
                const urgent = ms !== null && ms > 0 && ms < 24 * 60 * 60 * 1000;
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {p.jobTitle ?? "Trabajo"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {blocked ? (
                          <span className="text-amber-700">Completa la verificación de Stripe para recibir este pago</span>
                        ) : p.release_after ? (
                          <>Se libera {countdown(p.release_after)} · {format(new Date(p.release_after), "dd MMM yyyy", { locale: es })}</>
                        ) : (
                          "Pendiente"
                        )}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={blocked ? "bg-amber-500/20 text-amber-700" : urgent ? "bg-green-500/20 text-green-700" : "bg-blue-500/20 text-blue-700"}
                      >
                        {formatCurrency(p.amount)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Earnings Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Ganancias Mensuales</CardTitle>
          </div>
          <CardDescription>Tu historial de ingresos por mes</CardDescription>
        </CardHeader>
        <CardContent>
          {monthly.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aún no hay datos de ganancias</p>
            </div>
          ) : (
            <div className="space-y-3">
              {monthly.slice(-6).map((item) => (
                <div key={item.month} className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-20 shrink-0">
                    {getMonthName(item.month)}
                  </span>
                  <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                      style={{ width: `${Math.max((item.amount / maxMonthlyAmount) * 100, 10)}%` }}
                    >
                      <span className="text-xs font-medium text-primary-foreground">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Pagos Recientes
            </CardTitle>
            <CardDescription>Últimas facturas pagadas</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPaid.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay pagos recientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPaid.map((invoice) => (
                  <div
                    key={invoice.invoiceId}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {invoice.jobTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.paidDate
                          ? format(new Date(invoice.paidDate), "dd MMM yyyy", { locale: es })
                          : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        +{formatCurrency(invoice.amountReceived)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outstanding Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Facturas Pendientes
            </CardTitle>
            <CardDescription>Facturas esperando pago del cliente</CardDescription>
          </CardHeader>
          <CardContent>
            {outstanding.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay facturas pendientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {outstanding.map((invoice) => (
                  <div
                    key={invoice.invoiceId}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {invoice.jobTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        INV-{invoice.invoiceId.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge variant="secondary" className="bg-amber-500/20 text-amber-700">
                          {formatCurrency(invoice.amountOwed)}
                        </Badge>
                      </div>
                      <Link to={`/provider/invoices/preview/${invoice.invoiceId}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProviderEarningsPage;
