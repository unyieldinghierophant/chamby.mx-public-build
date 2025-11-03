import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Clock, CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProviderPayments } from "@/hooks/useProviderPayments";
import { PaymentMethodForm } from "@/components/provider-portal/PaymentMethodForm";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ProviderPayments = () => {
  const { profile } = useProfile();
  const { stats, paymentMethods, loading, addPaymentMethod, requestWithdrawal } =
    useProviderPayments();
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [paymentSchedule, setPaymentSchedule] = useState("every_3_days");

  const isVerified = profile?.verification_status === "verified";

  // Load payment schedule from profile
  useEffect(() => {
    if (profile?.user_id) {
      supabase
        .from("profiles")
        .select("payment_schedule")
        .eq("user_id", profile.user_id)
        .single()
        .then(({ data }) => {
          if (data && (data as any).payment_schedule) {
            setPaymentSchedule((data as any).payment_schedule);
          }
        });
    }
  }, [profile]);

  const handlePaymentScheduleChange = async (value: string) => {
    if (value === "daily" && !isVerified) {
      toast.error("Completa tu verificación para acceder a pagos diarios");
      return;
    }

    setPaymentSchedule(value);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ payment_schedule: value })
        .eq("user_id", profile?.user_id);

      if (error) throw error;
      toast.success("Preferencia de pago actualizada");
    } catch (error) {
      console.error("Error updating payment schedule:", error);
      toast.error("Error al actualizar preferencia");
    }
  };

  const handleWithdrawalRequest = async () => {
    if (stats.availableBalance <= 0) {
      toast.error("No tienes saldo disponible para retiro");
      return;
    }

    if (paymentMethods.length === 0) {
      toast.error("Agrega un método de pago primero");
      return;
    }

    await requestWithdrawal(stats.availableBalance);
    setWithdrawalDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pagos</h1>
        <p className="text-muted-foreground">
          Gestiona tus ganancias y pagos
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Disponible
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.availableBalance.toLocaleString("es-MX")}
            </div>
            <p className="text-xs text-muted-foreground">
              Listo para retiro
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Retenido
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.pendingBalance.toLocaleString("es-MX")}
            </div>
            <p className="text-xs text-muted-foreground">
              En garantía ({isVerified ? "24h" : "72h"} después del trabajo)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Ganancias
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalEarnings.toLocaleString("es-MX")}
            </div>
            <p className="text-xs text-muted-foreground">
              Histórico
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Métodos de Pago
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setPaymentMethodDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar
          </Button>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No tienes métodos de pago registrados
            </p>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{method.bank_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {method.account_holder_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      •••• {method.account_number.slice(-4)}
                    </p>
                  </div>
                  {method.is_default && (
                    <Badge>Predeterminado</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Frecuencia de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentSchedule} onValueChange={handlePaymentScheduleChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="daily" id="daily" disabled={!isVerified} />
              <Label htmlFor="daily" className="flex items-center gap-2">
                Diario
                {!isVerified && (
                  <Badge variant="outline" className="text-xs">
                    Solo verificados
                  </Badge>
                )}
              </Label>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <RadioGroupItem value="every_3_days" id="every_3_days" />
              <Label htmlFor="every_3_days">Cada 3 días</Label>
            </div>
          </RadioGroup>
          <p className="text-sm text-muted-foreground mt-4">
            {paymentSchedule === "daily"
              ? "Recibirás tus pagos 24 horas después de completar cada trabajo"
              : "Recibirás tus pagos 72 horas después de completar cada trabajo"}
          </p>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.paymentHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No tienes historial de pagos aún
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.paymentHistory.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.created_at), "PPP", { locale: es })}
                    </TableCell>
                    <TableCell className="capitalize">
                      {payment.type === "job_payment" ? "Pago de trabajo" : "Retiro"}
                    </TableCell>
                    <TableCell className={payment.amount < 0 ? "text-red-600" : ""}>
                      ${Math.abs(payment.amount).toLocaleString("es-MX")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          payment.status === "released"
                            ? "bg-green-500/10 text-green-700"
                            : "bg-yellow-500/10 text-yellow-700"
                        }
                      >
                        {payment.status === "released" ? "Liberado" : "Pendiente"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={() => setWithdrawalDialogOpen(true)}
          disabled={stats.availableBalance <= 0 || paymentMethods.length === 0}
        >
          Solicitar Retiro
        </Button>
      </div>

      <PaymentMethodForm
        open={paymentMethodDialogOpen}
        onOpenChange={setPaymentMethodDialogOpen}
        onSubmit={addPaymentMethod}
      />

      <AlertDialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Retiro</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Deseas solicitar el retiro de ${stats.availableBalance.toLocaleString("es-MX")}?
              El pago se procesará en 1-3 días hábiles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleWithdrawalRequest}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProviderPayments;
