import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useAvailableJobs } from "@/hooks/useAvailableJobs";
import { useActiveJobs } from "@/hooks/useActiveJobs";
import { JobCardAvailable } from "@/components/provider-portal/JobCardAvailable";
import { JobCardActive } from "@/components/provider-portal/JobCardActive";
import { InvoiceCreationDialog } from "@/components/provider-portal/InvoiceCreationDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface FutureJob {
  id: string;
  title: string;
  description: string | null;
  scheduled_date: string;
  total_amount: number;
  address: string | null;
  status: string;
  customer?: {
    full_name: string | null;
  };
}

interface HistoricalJob {
  id: string;
  title: string;
  scheduled_date: string;
  total_amount: number;
  status: string;
  created_at: string;
  customer?: {
    full_name: string | null;
  };
}

const ProviderJobs = () => {
  const { user } = useAuth();
  const { jobs: availableJobs, loading: loadingAvailable, acceptJob } = useAvailableJobs();
  const { jobs: activeJobs, loading: loadingActive, completeJob } = useActiveJobs();
  const [futureJobs, setFutureJobs] = useState<FutureJob[]>([]);
  const [historicalJobs, setHistoricalJobs] = useState<HistoricalJob[]>([]);
  const [loadingFuture, setLoadingFuture] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFutureJobs();
      fetchHistoricalJobs();
    }
  }, [user]);

  const fetchFutureJobs = async () => {
    if (!user) return;
    
    setLoadingFuture(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!bookings_customer_id_fkey(full_name)
        `)
        .eq('tasker_id', user.id)
        .eq('status', 'confirmed')
        .gt('scheduled_date', new Date().toISOString())
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setFutureJobs(data || []);
    } catch (error) {
      console.error('Error fetching future jobs:', error);
    } finally {
      setLoadingFuture(false);
    }
  };

  const fetchHistoricalJobs = async () => {
    if (!user) return;
    
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!bookings_customer_id_fkey(full_name)
        `)
        .eq('tasker_id', user.id)
        .in('status', ['completed', 'cancelled'])
        .order('scheduled_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistoricalJobs(data || []);
    } catch (error) {
      console.error('Error fetching historical jobs:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Trabajos</h1>
        <p className="text-muted-foreground">
          Gestiona tus trabajos activos y encuentra nuevas oportunidades
        </p>
      </div>

      <Tabs defaultValue="disponibles" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="disponibles">Disponibles</TabsTrigger>
          <TabsTrigger value="activos">Activos</TabsTrigger>
          <TabsTrigger value="futuros">Futuros</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="disponibles" className="space-y-4">
          {loadingAvailable ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : availableJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">
                  No hay trabajos disponibles en este momento
                </p>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Te notificaremos cuando haya nuevos trabajos disponibles
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableJobs.map((job) => (
                <JobCardAvailable
                  key={job.id}
                  job={job}
                  onAccept={acceptJob}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activos" className="space-y-4">
          {loadingActive ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : activeJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">
                  No tienes trabajos activos
                </p>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Acepta trabajos de la pestaña "Disponibles" para verlos aquí
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeJobs.map((job) => (
                <JobCardActive
                  key={job.id}
                  job={job}
                  onComplete={completeJob}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="futuros" className="space-y-4">
          {loadingFuture ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : futureJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">
                  No tienes trabajos programados
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {futureJobs.map((job) => (
                <Card key={job.id} className="bg-gradient-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(job.scheduled_date), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                        {job.customer && (
                          <p className="text-sm text-muted-foreground">
                            Cliente: {job.customer.full_name}
                          </p>
                        )}
                      </div>
                      <p className="text-lg font-semibold text-primary">
                        ${job.total_amount.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="historial" className="space-y-4">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : historicalJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">
                  No hay trabajos en el historial
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {historicalJobs.map((job) => (
                <Card key={job.id} className="bg-gradient-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(job.scheduled_date), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                        {job.customer && (
                          <p className="text-sm text-muted-foreground">
                            Cliente: {job.customer.full_name}
                          </p>
                        )}
                        <p className="text-sm">
                          Estado: {job.status === 'completed' ? 'Completado' : 'Cancelado'}
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-primary">
                        ${job.total_amount.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProviderJobs;