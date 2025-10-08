import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Invoice {
  id: string;
  job_id: string;
  amount: number;
  description: string | null;
  invoice_photo_url: string | null;
  status: string;
  created_at: string;
  job: {
    title: string;
    category: string;
  } | null;
}

export const InvoicesTab = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  const fetchInvoices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("provider_invoices")
        .select(`
          id,
          job_id,
          amount,
          description,
          invoice_photo_url,
          status,
          created_at,
          job:jobs(title, category)
        `)
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pendiente" },
      accepted: { variant: "default", label: "Aceptada" },
      rejected: { variant: "destructive", label: "Rechazada" },
      countered: { variant: "outline", label: "Contraoferta" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-background/60 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Historial de Cotizaciones
          </CardTitle>
          <CardDescription>
            Todas las cotizaciones que has enviado a clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Servicio
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Categoría
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Monto
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Estado
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Fecha
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">
                              {invoice.job?.title || "Sin título"}
                            </p>
                            {invoice.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {invoice.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">
                            {invoice.job?.category || "N/A"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          ${invoice.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {format(new Date(invoice.created_at), "dd/MM/yyyy", {
                            locale: es,
                          })}
                        </td>
                        <td className="py-3 px-4">
                          {invoice.invoice_photo_url && (
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  window.open(invoice.invoice_photo_url!, "_blank")
                                }
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const a = document.createElement("a");
                                  a.href = invoice.invoice_photo_url!;
                                  a.download = `cotizacion-${invoice.id}.jpg`;
                                  a.click();
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No tienes cotizaciones aún
              </h3>
              <p className="text-muted-foreground">
                Cuando envíes cotizaciones a clientes, aparecerán aquí
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
