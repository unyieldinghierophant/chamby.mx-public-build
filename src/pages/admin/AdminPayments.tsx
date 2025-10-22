import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPayments() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayouts: 0,
    completedPayments: 0,
    platformFees: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      // Fetch bookings with payment info
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);

      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('provider_invoices')
        .select('*, profiles!provider_invoices_provider_id_fkey(full_name)')
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;
      setInvoices(invoicesData || []);

      // Calculate stats
      const totalRevenue = bookingsData?.reduce((sum, b) => 
        b.payment_status === 'paid' ? sum + Number(b.total_amount) : sum, 0) || 0;
      
      const pendingPayouts = invoicesData?.reduce((sum, i) => 
        i.status === 'pending' ? sum + Number(i.amount) : sum, 0) || 0;
      
      const completedPayments = bookingsData?.filter(b => 
        b.payment_status === 'paid').length || 0;

      setStats({
        totalRevenue,
        pendingPayouts,
        completedPayments,
        platformFees: totalRevenue * 0.1 // 10% platform fee
      });

    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Error al cargar datos de pagos');
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayment = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('provider_invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId);

      if (error) throw error;
      toast.success('Pago liberado exitosamente');
      fetchPaymentData();
    } catch (error) {
      console.error('Error releasing payment:', error);
      toast.error('Error al liberar pago');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenue Total
              </CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">MXN</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payouts
              </CardTitle>
              <Clock className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.pendingPayouts.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting release</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Payments
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedPayments}</div>
              <p className="text-xs text-muted-foreground mt-1">Successful transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Platform Fees
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.platformFees.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">10% commission</p>
            </CardContent>
          </Card>
        </div>

        {/* Provider Invoices */}
        <Card>
          <CardHeader>
            <CardTitle>Provider Invoices</CardTitle>
            <CardDescription>Manage provider payouts and invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Invoice ID</th>
                    <th className="text-left py-3 px-4 font-medium">Provider</th>
                    <th className="text-left py-3 px-4 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {invoice.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {invoice.profiles?.full_name || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-green-600">
                        ${Number(invoice.amount).toLocaleString('es-MX')}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(invoice.created_at).toLocaleDateString('es-MX')}
                      </td>
                      <td className="py-3 px-4">
                        {invoice.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleReleasePayment(invoice.id)}
                          >
                            Release Payment
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Bookings Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Booking Payments</CardTitle>
            <CardDescription>Latest payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Booking ID</th>
                    <th className="text-left py-3 px-4 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 font-medium">Payment Status</th>
                    <th className="text-left py-3 px-4 font-medium">Stripe ID</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 10).map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {booking.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        ${Number(booking.total_amount).toLocaleString('es-MX')}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                          {booking.payment_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {booking.stripe_payment_intent_id?.slice(0, 20) || 'N/A'}...
                      </td>
                      <td className="py-3 px-4">
                        {new Date(booking.created_at).toLocaleDateString('es-MX')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
