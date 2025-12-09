import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProviderPayouts } from '@/hooks/useProviderPayouts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  Calendar,
  Search,
  FileText,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ProviderPayoutsPage = () => {
  const navigate = useNavigate();
  const { payouts, summary, loading, error } = useProviderPayouts();
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredPayouts = payouts.filter(payout => 
    payout.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payout.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/provider-portal')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Mis Pagos</h1>
              <p className="text-sm text-muted-foreground">Historial de pagos recibidos</p>
            </div>
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
                  <p className="text-xs text-muted-foreground">Pagos Recibidos</p>
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
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Último Pago</p>
                  <p className="text-sm font-medium text-purple-600">
                    {summary?.lastPaidAt 
                      ? format(new Date(summary.lastPaidAt), "d MMM yyyy", { locale: es })
                      : 'Sin pagos'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por trabajo o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Payouts List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Historial de Pagos
            </CardTitle>
            <CardDescription>
              {filteredPayouts.length} pago{filteredPayouts.length !== 1 ? 's' : ''} encontrado{filteredPayouts.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPayouts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No tienes pagos registrados todavía.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Los pagos aparecerán aquí cuando el administrador procese tus facturas.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPayouts.map((payout) => (
                  <div 
                    key={payout.id} 
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/provider/payouts/${payout.id}`)}
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
                        <p className="font-medium">{payout.job_title}</p>
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
                    <div className="text-right">
                      <p className="font-bold text-lg">${payout.amount.toLocaleString()}</p>
                      <div className="mt-1">{getStatusBadge(payout.status)}</div>
                      {payout.paid_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Pagado: {format(new Date(payout.paid_at), "d MMM", { locale: es })}
                        </p>
                      )}
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

export default ProviderPayoutsPage;