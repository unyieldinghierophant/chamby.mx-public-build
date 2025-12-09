import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePayout } from '@/hooks/usePayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  DollarSign, 
  FileText, 
  Calendar,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ProviderPayoutDetailPage = () => {
  const { payoutId } = useParams<{ payoutId: string }>();
  const navigate = useNavigate();
  const { payout, invoice, job, loading, error } = usePayout(payoutId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Pagado
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Fallido
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Cargando detalles del pago...</p>
        </div>
      </div>
    );
  }

  if (error || !payout) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/provider/payouts')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">Error</h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-6">
          <Card className="border-destructive">
            <CardContent className="py-8 text-center">
              <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-destructive">{error || 'Pago no encontrado'}</p>
              <Button className="mt-4" onClick={() => navigate('/provider/payouts')}>
                Volver a mis pagos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const shortenId = (id: string) => id.slice(0, 8).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/provider/payouts')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Detalle del Pago</h1>
                <p className="text-sm text-muted-foreground font-mono">#{shortenId(payout.id)}</p>
              </div>
            </div>
            {getStatusBadge(payout.status)}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Main Amount Card */}
        <Card className={`${
          payout.status === 'paid' 
            ? 'bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20' 
            : payout.status === 'pending'
              ? 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20'
              : 'bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monto del pago</p>
                <p className="text-4xl font-bold mt-1">${payout.amount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-2">MXN</p>
              </div>
              <div className={`p-4 rounded-full ${
                payout.status === 'paid' 
                  ? 'bg-green-500/20' 
                  : payout.status === 'pending'
                    ? 'bg-yellow-500/20'
                    : 'bg-red-500/20'
              }`}>
                <DollarSign className={`h-8 w-8 ${
                  payout.status === 'paid' 
                    ? 'text-green-600' 
                    : payout.status === 'pending'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-muted">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha de creación</p>
                  <p className="font-medium">
                    {format(new Date(payout.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${payout.paid_at ? 'bg-green-500/20' : 'bg-muted'}`}>
                  <CheckCircle className={`h-4 w-4 ${payout.paid_at ? 'text-green-600' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha de pago</p>
                  <p className="font-medium">
                    {payout.paid_at 
                      ? format(new Date(payout.paid_at), "d 'de' MMMM, yyyy", { locale: es })
                      : 'Pendiente'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Info */}
        {job && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5" />
                Trabajo Relacionado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Título</p>
                <p className="font-medium">{job.title}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categoría</p>
                <p className="font-medium capitalize">{job.category}</p>
              </div>
              {job.location && (
                <div>
                  <p className="text-sm text-muted-foreground">Ubicación</p>
                  <p className="font-medium">{job.location}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Invoice Info */}
        {invoice && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Factura Relacionada
              </CardTitle>
              <CardDescription>
                #{shortenId(invoice.id)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal Proveedor</span>
                  <span className="font-medium">${invoice.subtotal_provider.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Cliente</span>
                  <span className="font-medium">${invoice.total_customer_amount.toLocaleString()}</span>
                </div>
              </div>

              <Link to={`/provider/invoices/preview/${invoice.id}`}>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver factura completa
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {payout.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground italic">"{payout.notes}"</p>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Help Link */}
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <HelpCircle className="h-5 w-5" />
              <div>
                <p className="text-sm font-medium">¿Tienes dudas sobre este pago?</p>
                <p className="text-xs">Contacta a soporte para obtener ayuda con cualquier consulta.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProviderPayoutDetailPage;