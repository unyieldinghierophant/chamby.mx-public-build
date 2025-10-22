import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'jobs' | 'bookings'>('jobs');

  useEffect(() => {
    fetchData();
  }, [view]);

  const fetchData = async () => {
    try {
      if (view === 'jobs') {
        const { data, error } = await supabase
          .from('jobs')
          .select('*, profiles!jobs_provider_id_fkey(full_name)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setJobs(data || []);
      } else {
        const { data, error } = await supabase
          .from('bookings')
          .select('*, services(name)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBookings(data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId);

      if (error) throw error;
      toast.success('Trabajo cancelado');
      fetchData();
    } catch (error) {
      console.error('Error cancelling job:', error);
      toast.error('Error al cancelar trabajo');
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBookings = bookings.filter(booking =>
    booking.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar trabajos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={view === 'jobs' ? 'default' : 'outline'}
              onClick={() => setView('jobs')}
            >
              Jobs Feed
            </Button>
            <Button
              variant={view === 'bookings' ? 'default' : 'outline'}
              onClick={() => setView('bookings')}
            >
              Bookings
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{view === 'jobs' ? 'Jobs Feed' : 'Bookings'}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {view === 'jobs' ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">ID</th>
                        <th className="text-left py-3 px-4 font-medium">Título</th>
                        <th className="text-left py-3 px-4 font-medium">Proveedor</th>
                        <th className="text-left py-3 px-4 font-medium">Categoría</th>
                        <th className="text-left py-3 px-4 font-medium">Estado</th>
                        <th className="text-left py-3 px-4 font-medium">Precio</th>
                        <th className="text-left py-3 px-4 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJobs.map((job) => (
                        <tr key={job.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {job.id.slice(0, 8)}...
                          </td>
                          <td className="py-3 px-4 font-medium">{job.title}</td>
                          <td className="py-3 px-4">{job.profiles?.full_name || 'N/A'}</td>
                          <td className="py-3 px-4">{job.category}</td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                job.status === 'active' ? 'default' :
                                job.status === 'completed' ? 'secondary' :
                                'destructive'
                              }
                            >
                              {job.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-semibold">${job.rate}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost">
                                <Eye className="w-4 h-4" />
                              </Button>
                              {job.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCancelJob(job.id)}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">ID</th>
                        <th className="text-left py-3 px-4 font-medium">Título</th>
                        <th className="text-left py-3 px-4 font-medium">Servicio</th>
                        <th className="text-left py-3 px-4 font-medium">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium">Estado</th>
                        <th className="text-left py-3 px-4 font-medium">Pago</th>
                        <th className="text-left py-3 px-4 font-medium">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {booking.id.slice(0, 8)}...
                          </td>
                          <td className="py-3 px-4 font-medium">{booking.title}</td>
                          <td className="py-3 px-4">{booking.services?.name || 'N/A'}</td>
                          <td className="py-3 px-4">
                            {new Date(booking.scheduled_date).toLocaleDateString('es-MX')}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                              {booking.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                              {booking.payment_status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-semibold">${booking.total_amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
