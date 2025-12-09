import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Search, 
  CreditCard,
  CheckCircle,
  Clock,
  FileEdit,
  User,
  Calendar,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ClientInvoice {
  id: string;
  status: string;
  total_customer_amount: number;
  created_at: string;
  job_title: string;
  provider_name: string;
}

const ClientInvoiceListPage = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<ClientInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchQuery, statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke('list-client-invoices');

      if (fnError) {
        console.error('Error fetching invoices:', fnError);
        setError('Error al cargar las facturas');
        return;
      }

      setInvoices(data.invoices || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (inv) =>
          inv.job_title.toLowerCase().includes(query) ||
          inv.provider_name.toLowerCase().includes(query) ||
          inv.id.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            <FileEdit className="h-3 w-3 mr-1" />
            Borrador
          </Badge>
        );
      case 'pending_payment':
        return (
          <Badge variant="default" className="bg-amber-500/20 text-amber-600 border-amber-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'paid':
        return (
          <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pagada
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const shortenId = (id: string) => {
    return `INV-${id.slice(0, 4).toUpperCase()}`;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-main pt-32 pb-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-gradient-card border-0">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-10 w-28" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <MobileBottomNav />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-main pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Mis Facturas</h1>
            <p className="text-muted-foreground">
              Revisa y paga tus facturas pendientes
            </p>
          </div>

          {/* Filters */}
          <Card className="bg-gradient-card border-0 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por trabajo o proveedor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background/50"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 bg-background/50">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="pending_payment">Pendiente</SelectItem>
                    <SelectItem value="paid">Pagada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Error State */}
          {error && (
            <Card className="bg-destructive/10 border-destructive/30 mb-6">
              <CardContent className="p-6 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchInvoices} variant="outline">
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!error && filteredInvoices.length === 0 && (
            <Card className="bg-gradient-card border-0">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No tienes facturas todavía
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || statusFilter !== "all"
                    ? "No se encontraron facturas con los filtros aplicados"
                    : "Cuando un proveedor te envíe una factura, aparecerá aquí"}
                </p>
                {(searchQuery || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Invoice List */}
          {!error && filteredInvoices.length > 0 && (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <Card key={invoice.id} className="bg-gradient-card border-0 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      {/* Left: Invoice Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-sm text-muted-foreground">
                            {shortenId(invoice.id)}
                          </span>
                          {getStatusBadge(invoice.status)}
                        </div>
                        
                        <h3 className="font-semibold text-foreground">
                          {invoice.job_title}
                        </h3>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{invoice.provider_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(invoice.created_at), "d MMM yyyy", { locale: es })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-semibold text-foreground">
                              {formatCurrency(invoice.total_customer_amount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Action */}
                      <div className="flex items-center">
                        {invoice.status === 'pending_payment' ? (
                          <Button
                            onClick={() => navigate(`/invoice/${invoice.id}`)}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pagar Factura
                          </Button>
                        ) : invoice.status === 'paid' ? (
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/invoice/${invoice.id}`)}
                          >
                            Ver Factura
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            onClick={() => navigate(`/invoice/${invoice.id}`)}
                          >
                            Ver Detalles
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <MobileBottomNav />
    </>
  );
};

export default ClientInvoiceListPage;
