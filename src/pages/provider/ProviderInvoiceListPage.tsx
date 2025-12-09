import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileText, 
  Plus, 
  Search, 
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface InvoiceListItem {
  id: string;
  job_id: string;
  job_title: string;
  client_name: string;
  status: string;
  total_customer_amount: number;
  created_at: string;
}

export default function ProviderInvoiceListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    fetchInvoices();
  }, [user]);

  useEffect(() => {
    // Apply filters
    let filtered = [...invoices];
    
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inv => 
        inv.job_title.toLowerCase().includes(query) ||
        inv.client_name.toLowerCase().includes(query) ||
        inv.id.toLowerCase().includes(query)
      );
    }
    
    setFilteredInvoices(filtered);
  }, [invoices, statusFilter, searchQuery]);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "list-provider-invoices",
        { body: {} }
      );

      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);

      setInvoices(data.invoices || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : "Error al cargar facturas");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">
            <CheckCircle className="mr-1 h-3 w-3" />
            Pagada
          </Badge>
        );
      case "pending_payment":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">
            <Clock className="mr-1 h-3 w-3" />
            Pendiente
          </Badge>
        );
      case "draft":
      default:
        return (
          <Badge variant="outline" className="border-muted-foreground/30 hover:bg-muted">
            <FileText className="mr-1 h-3 w-3" />
            Borrador
          </Badge>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const shortenId = (id: string) => {
    return `INV-${id.slice(0, 6).toUpperCase()}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <Receipt className="h-7 w-7 text-primary" />
            Mis Facturas
          </h1>
          <p className="text-muted-foreground">
            Gestiona y revisa tus facturas creadas
          </p>
        </div>
        <Button onClick={() => navigate('/provider-portal/jobs')} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Crear Factura
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por trabajo o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="pending_payment">Pendiente</SelectItem>
                  <SelectItem value="paid">Pagada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchInvoices} className="ml-auto">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!error && filteredInvoices.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {invoices.length === 0 
                ? "No has creado facturas aún" 
                : "No se encontraron facturas"}
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              {invoices.length === 0 
                ? "Cuando completes un trabajo, podrás crear facturas para cobrar a tus clientes."
                : "Intenta ajustar los filtros de búsqueda."}
            </p>
            {invoices.length === 0 && (
              <Button onClick={() => navigate('/provider-portal/jobs')}>
                <Plus className="mr-2 h-4 w-4" />
                Ir a mis trabajos
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invoice List */}
      {!error && filteredInvoices.length > 0 && (
        <div className="space-y-3">
          {/* Desktop Table Header */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <div className="col-span-2">Factura</div>
            <div className="col-span-3">Trabajo</div>
            <div className="col-span-2">Cliente</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-2 text-right">Monto</div>
            <div className="col-span-1"></div>
          </div>

          {filteredInvoices.map((invoice) => (
            <Card 
              key={invoice.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/provider/invoices/preview/${invoice.id}`)}
            >
              <CardContent className="p-4">
                {/* Mobile Layout */}
                <div className="lg:hidden space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm font-medium text-primary">
                        {shortenId(invoice.id)}
                      </p>
                      <p className="font-semibold mt-1">{invoice.job_title}</p>
                      <p className="text-sm text-muted-foreground">{invoice.client_name}</p>
                    </div>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(invoice.created_at), "d MMM yyyy", { locale: es })}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      ${formatCurrency(invoice.total_customer_amount)}
                    </span>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                  <div className="col-span-2">
                    <p className="font-mono text-sm font-medium text-primary">
                      {shortenId(invoice.id)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(invoice.created_at), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                  <div className="col-span-3">
                    <p className="font-medium truncate">{invoice.job_title}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground truncate">{invoice.client_name}</p>
                  </div>
                  <div className="col-span-2">
                    {getStatusBadge(invoice.status)}
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-lg font-bold text-primary">
                      ${formatCurrency(invoice.total_customer_amount)}
                    </span>
                    <p className="text-xs text-muted-foreground">MXN</p>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/provider/invoices/preview/${invoice.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      {!error && invoices.length > 0 && (
        <div className="flex flex-wrap gap-4 pt-4 text-sm text-muted-foreground">
          <span>
            Total: <strong className="text-foreground">{invoices.length}</strong> facturas
          </span>
          <span>•</span>
          <span>
            Pagadas: <strong className="text-green-600">{invoices.filter(i => i.status === 'paid').length}</strong>
          </span>
          <span>•</span>
          <span>
            Pendientes: <strong className="text-amber-600">{invoices.filter(i => i.status === 'pending_payment').length}</strong>
          </span>
          <span>•</span>
          <span>
            Borradores: <strong className="text-muted-foreground">{invoices.filter(i => i.status === 'draft').length}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
