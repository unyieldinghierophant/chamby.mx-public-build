import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePayout } from '@/hooks/usePayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  DollarSign, 
  FileText, 
  Calendar,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Save,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const AdminPayoutDetailPage = () => {
  const { payoutId } = useParams<{ payoutId: string }>();
  const navigate = useNavigate();
  const { payout, invoice, job, provider, client, loading, error, refetch } = usePayout(payoutId);

  const [notes, setNotes] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [marking, setMarking] = useState(false);

  // Initialize notes when payout loads
  useState(() => {
    if (payout?.notes) {
      setNotes(payout.notes);
    }
  });

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

  const handleMarkAsPaid = async () => {
    if (!payoutId) return;

    setMarking(true);
    try {
      const { error: fnError } = await supabase.functions.invoke('admin-mark-payout-paid', {
        body: { payoutId }
      });

      if (fnError) {
        throw fnError;
      }

      toast.success('Pago marcado como completado');
      setMarkPaidDialogOpen(false);
      refetch();
    } catch (err) {
      console.error('Error marking as paid:', err);
      toast.error('Error al actualizar el pago');
    } finally {
      setMarking(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!payoutId) return;

    setSavingNotes(true);
    try {
      // Update notes directly via the payouts table (admin has update rights)
      const { error: updateError } = await supabase
        .from('payouts')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', payoutId);

      if (updateError) {
        throw updateError;
      }

      toast.success('Notas guardadas');
      refetch();
    } catch (err) {
      console.error('Error saving notes:', err);
      toast.error('Error al guardar las notas');
    } finally {
      setSavingNotes(false);
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
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin/payouts')}>
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
              <Button className="mt-4" onClick={() => navigate('/admin/payouts')}>
                Volver a pagos
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
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin/payouts')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Detalle del Pago (Admin)</h1>
                <p className="text-sm text-muted-foreground font-mono">#{shortenId(payout.id)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(payout.status)}
              {payout.status === 'pending' && (
                <Button onClick={() => setMarkPaidDialogOpen(true)}>
                  <Check className="h-4 w-4 mr-2" />
                  Marcar como Pagado
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Amount Card */}
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
                        {format(new Date(payout.created_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
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
                          ? format(new Date(payout.paid_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })
                          : 'Pendiente'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Invoice Breakdown */}
            {invoice && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Desglose de Factura
                  </CardTitle>
                  <CardDescription className="font-mono">
                    #{shortenId(invoice.id)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Invoice Items */}
                  {invoice.items && invoice.items.length > 0 && (
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">Descripción</th>
                            <th className="text-center p-3 font-medium">Cant.</th>
                            <th className="text-right p-3 font-medium">Precio</th>
                            <th className="text-right p-3 font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.items.map((item) => (
                            <tr key={item.id} className="border-t">
                              <td className="p-3">{item.description}</td>
                              <td className="p-3 text-center">{item.quantity}</td>
                              <td className="p-3 text-right">${item.unit_price.toLocaleString()}</td>
                              <td className="p-3 text-right font-medium">${item.total.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal Proveedor</span>
                      <span className="font-medium">${invoice.subtotal_provider.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Comisión Chamby</span>
                      <span className="font-medium">${invoice.chamby_commission_amount.toLocaleString()}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Cliente</span>
                      <span className="font-bold">${invoice.total_customer_amount.toLocaleString()}</span>
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

            {/* Job Info */}
            {job && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Briefcase className="h-5 w-5" />
                    Trabajo
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Título</p>
                    <p className="font-medium">{job.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categoría</p>
                    <p className="font-medium capitalize">{job.category}</p>
                  </div>
                  {job.location && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Ubicación
                      </p>
                      <p className="font-medium">{job.location}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Admin Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notas del Administrador</CardTitle>
                <CardDescription>
                  Estas notas son visibles para el proveedor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    placeholder="Agregar notas sobre el pago, referencia de transferencia, etc."
                    value={notes || payout.notes || ''}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button onClick={handleSaveNotes} disabled={savingNotes}>
                  <Save className="h-4 w-4 mr-2" />
                  {savingNotes ? 'Guardando...' : 'Guardar Notas'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Provider Info */}
            {provider && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" />
                    Proveedor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium text-lg">{provider.full_name}</p>
                  </div>
                  {provider.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${provider.email}`} className="hover:text-primary">
                        {provider.email}
                      </a>
                    </div>
                  )}
                  {provider.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${provider.phone}`} className="hover:text-primary">
                        {provider.phone}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Client Info */}
            {client && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium text-lg">{client.full_name || 'Sin nombre'}</p>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${client.email}`} className="hover:text-primary">
                        {client.email}
                      </a>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${client.phone}`} className="hover:text-primary">
                        {client.phone}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Mark as Paid Dialog */}
      <AlertDialog open={markPaidDialogOpen} onOpenChange={setMarkPaidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar como pagado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará el pago de <strong>${payout.amount.toLocaleString()}</strong> como completado 
              y registrará la fecha actual como fecha de pago. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkAsPaid} disabled={marking}>
              {marking ? 'Procesando...' : 'Confirmar pago'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPayoutDetailPage;