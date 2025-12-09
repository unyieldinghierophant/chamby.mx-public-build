import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Clock, Search, Image, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface JobWithClient {
  id: string;
  title: string;
  category: string;
  service_type: string | null;
  description: string | null;
  problem: string | null;
  location: string | null;
  status: string | null;
  rate: number;
  scheduled_at: string | null;
  time_preference: string | null;
  exact_time: string | null;
  photos: string[] | null;
  created_at: string | null;
  client_id: string;
  provider_id: string | null;
  client?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      // Fetch all jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Fetch client info for each job
      const jobsWithClients = await Promise.all(
        (jobsData || []).map(async (job) => {
          const { data: clientData } = await supabase
            .from('users')
            .select('full_name, email, phone')
            .eq('id', job.client_id)
            .single();

          return {
            ...job,
            client: clientData || undefined
          };
        })
      );

      setJobs(jobsWithClients);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendiente', variant: 'secondary' },
      active: { label: 'Activo', variant: 'default' },
      in_progress: { label: 'En Progreso', variant: 'default' },
      completed: { label: 'Completado', variant: 'outline' },
      cancelled: { label: 'Cancelado', variant: 'destructive' },
    };

    const statusInfo = statusMap[status || 'pending'] || { label: status || 'Desconocido', variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando solicitudes...</p>
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
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Panel de Administración</h1>
                <p className="text-sm text-muted-foreground">Solicitudes de trabajo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/admin/payouts')}
                className="flex items-center gap-2"
              >
                <Wallet className="h-4 w-4" />
                Payouts
              </Button>
              <Badge variant="outline" className="text-xs">
                {filteredJobs.length} solicitudes
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, cliente, ubicación..."
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
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="in_progress">En Progreso</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Jobs List */}
      <div className="container mx-auto px-4 pb-8">
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No se encontraron solicitudes</p>
              </CardContent>
            </Card>
          ) : (
            filteredJobs.map((job) => (
              <Card key={job.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {job.category} {job.service_type && `• ${job.service_type}`}
                      </p>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Client Info */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <p className="font-medium text-sm">Cliente</p>
                    <div className="grid gap-1 text-sm">
                      <p className="font-semibold">{job.client?.full_name || 'Sin nombre'}</p>
                      {job.client?.phone && (
                        <a 
                          href={`tel:${job.client.phone}`}
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {job.client.phone}
                        </a>
                      )}
                      {job.client?.email && (
                        <a 
                          href={`mailto:${job.client.email}`}
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          {job.client.email}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {(job.description || job.problem) && (
                    <div>
                      <p className="font-medium text-sm mb-1">Descripción</p>
                      <p className="text-sm text-muted-foreground">
                        {job.description || job.problem}
                      </p>
                    </div>
                  )}

                  {/* Location */}
                  {job.location && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{job.location}</p>
                    </div>
                  )}

                  {/* Schedule */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {job.scheduled_at && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(job.scheduled_at), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                        </span>
                      </div>
                    )}
                    {(job.time_preference || job.exact_time) && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{job.exact_time || job.time_preference}</span>
                      </div>
                    )}
                  </div>

                  {/* Photos */}
                  {job.photos && job.photos.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Fotos ({job.photos.length})
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {job.photos.map((photo, index) => (
                          <a
                            key={index}
                            href={photo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                          >
                            <img
                              src={photo}
                              alt={`Foto ${index + 1}`}
                              className="h-20 w-20 object-cover rounded-lg border hover:opacity-80 transition-opacity"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                    <span>
                      Creado: {job.created_at && format(new Date(job.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                    </span>
                    <span className="font-mono">{job.id.slice(0, 8)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
