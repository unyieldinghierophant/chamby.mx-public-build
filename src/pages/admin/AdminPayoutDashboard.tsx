import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminPayouts } from '@/hooks/useAdminPayouts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  Search,
  Plus,
  Wallet,
  Users,
  FileText,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const AdminPayoutDashboard = () => {
  const navigate = useNavigate();
  const { payouts, summary, paidInvoices, loading, error, createPayout, markAsPaid, refetch } = useAdminPayouts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Create payout modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string>('');
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Mark as paid dialog state
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [selectedPayoutId, setSelectedPayoutId] = useState<string>('');
  const [marking, setMarking] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Pagado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pendiente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = 
      payout.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreatePayout = async () => {
    if (!selectedInvoice || !payoutAmount) {
      toast.error('Selecciona una factura y monto');
      return;
    }

    setCreating(true);
    const success = await createPayout(selectedInvoice, parseFloat(payoutAmount), payoutNotes || undefined);
    setCreating(false);

    if (success) {
      toast.success('Pago creado exitosamente');
      setCreateModalOpen(false);
      setSelectedInvoice('');
      setPayoutAmount('');
      setPayoutNotes('');
    } else {
      toast.error('Error al crear el pago');
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedPayoutId) return;

    setMarking(true);
    const success = await markAsPaid(selectedPayoutId);
    setMarking(false);

    if (success) {
      toast.success('Pago marcado como completado');
      setMarkPaidDialogOpen(false);
      setSelectedPayoutId('');
    } else {
      toast.error('Error al actualizar el pago');
    }
  };

  const openMarkPaidDialog = (payoutId: string) => {
    setSelectedPayoutId(payoutId);
    setMarkPaidDialogOpen(true);
  };

  // Get selected invoice details for amount suggestion
  const selectedInvoiceData = paidInvoices.find(inv => inv.id === selectedInvoice);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Cargando pagos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Gestión de Pagos</h1>
                <p className="text-sm text-muted-foreground">Administrar pagos a proveedores</p>
              </div>
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Pago
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {error && (
          <Card className="border-destructive">
            <CardContent className="py-4">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/20">
                  <Wallet className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Pagado</p>
                  <p className="text-xl font-bold text-green-600">
                    ${summary?.totalPaid?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-500/20">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pendiente</p>
                  <p className="text-xl font-bold text-yellow-600">
                    ${summary?.pendingAmount?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/20">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pagos Completados</p>
                  <p className="text-xl font-bold text-blue-600">
                    {summary?.paidCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500/20">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Pagos</p>
                  <p className="text-xl font-bold text-purple-600">
                    {summary?.totalPayouts || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por proveedor, trabajo o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="paid">Pagado</SelectItem>
              <SelectItem value="failed">Fallido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payouts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Todos los Pagos
            </CardTitle>
            <CardDescription>
              {filteredPayouts.length} pago{filteredPayouts.length !== 1 ? 's' : ''} encontrado{filteredPayouts.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPayouts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No hay pagos registrados.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primer pago
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPayouts.map((payout) => (
                  <div 
                    key={payout.id} 
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/payouts/${payout.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        payout.status === 'paid' 
                          ? 'bg-green-500/20' 
                          : payout.status === 'pending'
                            ? 'bg-yellow-500/20'
                            : 'bg-red-500/20'
                      }`}>
                        <DollarSign className={`h-4 w-4 ${
                          payout.status === 'paid' 
                            ? 'text-green-600' 
                            : payout.status === 'pending'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{payout.provider_name}</p>
                        <p className="text-sm text-muted-foreground">{payout.job_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(payout.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                        </p>
                        {payout.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            "{payout.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">${payout.amount.toLocaleString()}</p>
                        <div className="mt-1">{getStatusBadge(payout.status)}</div>
                        {payout.paid_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(payout.paid_at), "d MMM", { locale: es })}
                          </p>
                        )}
                      </div>
                      {payout.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openMarkPaidDialog(payout.id);
                          }}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Marcar Pagado
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Payout Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Pago</DialogTitle>
            <DialogDescription>
              Selecciona una factura pagada para crear un registro de pago al proveedor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Factura</Label>
              <Select value={selectedInvoice} onValueChange={(value) => {
                setSelectedInvoice(value);
                const invoice = paidInvoices.find(inv => inv.id === value);
                if (invoice) {
                  // Suggest the provider amount (90% of subtotal)
                  const providerAmount = invoice.subtotal_provider * 0.9;
                  setPayoutAmount(providerAmount.toFixed(2));
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar factura..." />
                </SelectTrigger>
                <SelectContent>
                  {paidInvoices.filter(inv => !inv.has_payout).map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      <div className="flex flex-col">
                        <span>{invoice.job_title}</span>
                        <span className="text-xs text-muted-foreground">
                          {invoice.provider_name} • ${invoice.subtotal_provider}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {paidInvoices.filter(inv => !inv.has_payout).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No hay facturas pagadas sin pago registrado.
                </p>
              )}
            </div>

            {selectedInvoiceData && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p><strong>Proveedor:</strong> {selectedInvoiceData.provider_name}</p>
                <p><strong>Subtotal Proveedor:</strong> ${selectedInvoiceData.subtotal_provider}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sugerido: ${(selectedInvoiceData.subtotal_provider * 0.9).toFixed(2)} (menos 10% comisión)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Monto a Pagar</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                placeholder="Transferencia bancaria, referencia, etc."
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePayout} disabled={creating || !selectedInvoice || !payoutAmount}>
              {creating ? 'Creando...' : 'Crear Pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Confirmation Dialog */}
      <AlertDialog open={markPaidDialogOpen} onOpenChange={setMarkPaidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar como pagado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará el pago como completado y registrará la fecha actual como fecha de pago.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkAsPaid} disabled={marking}>
              {marking ? 'Procesando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPayoutDashboard;