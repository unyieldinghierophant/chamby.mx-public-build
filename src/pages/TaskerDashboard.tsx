import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useTaskerJobs } from '@/hooks/useTaskerJobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import ServiceCreationWizard from '@/components/ServiceCreationWizard';
import { 
  Plus, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Briefcase,
  Star,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';

interface Booking {
  id: string;
  title: string;
  description: string;
  scheduled_date: string;
  total_amount: number;
  status: string;
  payment_status: string;
  duration_hours: number;
  address: string;
  customer_id: string;
}

const TaskerDashboard = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { jobs: taskerJobs, loading: jobsLoading, refetch: refetchJobs } = useTaskerJobs();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [earnings, setEarnings] = useState({
    thisMonth: 0,
    total: 0,
    pending: 0
  });

  useEffect(() => {
    if (user) {
      fetchBookings();
      calculateEarnings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('tasker_id', user.id)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEarnings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('total_amount, payment_status, scheduled_date')
        .eq('tasker_id', user.id);

      if (error) throw error;

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      let thisMonth = 0;
      let total = 0;
      let pending = 0;

      data?.forEach(booking => {
        const bookingDate = new Date(booking.scheduled_date);
        const amount = Number(booking.total_amount);

        if (booking.payment_status === 'completed') {
          total += amount;
          if (bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear) {
            thisMonth += amount;
          }
        } else if (booking.payment_status === 'pending') {
          pending += amount;
        }
      });

      setEarnings({ thisMonth, total, pending });
    } catch (error) {
      console.error('Error calculating earnings:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const upcomingBookings = bookings.filter(b => 
    new Date(b.scheduled_date) > new Date() && b.status !== 'cancelled'
  );
  
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const completedBookings = bookings.filter(b => b.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-main bg-gradient-mesh">
      <Header />
      <div className="pt-20 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              ¡Hola, {profile?.full_name || 'Tasker'}!
            </h1>
            <p className="text-muted-foreground">
              Gestiona tus trabajos, agenda y ganancias desde aquí
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Trabajos Pendientes
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {pendingBookings.length}
                    </p>
                  </div>
                  <Briefcase className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Próximos Trabajos
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {upcomingBookings.length}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Ganancias Este Mes
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      ${earnings.thisMonth.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Calificación
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      5.0
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="jobs" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="jobs">Trabajos</TabsTrigger>
              <TabsTrigger value="schedule">Agenda</TabsTrigger>
              <TabsTrigger value="earnings">Ganancias</TabsTrigger>
            </TabsList>

            <TabsContent value="jobs" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">
                  Gestión de Trabajos
                </h2>
                <Dialog open={showJobForm} onOpenChange={setShowJobForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Servicio
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <ServiceCreationWizard 
                      onSuccess={() => {
                        setShowJobForm(false);
                        refetchJobs();
                      }}
                      onClose={() => setShowJobForm(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Pending Jobs */}
                <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Trabajos Pendientes ({pendingBookings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pendingBookings.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No tienes trabajos pendientes
                      </p>
                    ) : (
                      pendingBookings.slice(0, 3).map((booking) => (
                        <div key={booking.id} className="p-4 border border-border rounded-lg bg-muted/50">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-foreground">{booking.title}</h4>
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-1">Pendiente</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {booking.description}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {new Date(booking.scheduled_date).toLocaleDateString()}
                            </span>
                            <span className="font-semibold text-primary">
                              ${booking.total_amount}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Recent Completed Jobs */}
                <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Trabajos Completados Recientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {completedBookings.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Aún no has completado trabajos
                      </p>
                    ) : (
                      completedBookings.slice(0, 3).map((booking) => (
                        <div key={booking.id} className="p-4 border border-border rounded-lg bg-muted/50">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-foreground">{booking.title}</h4>
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-1">Completado</span>
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {new Date(booking.scheduled_date).toLocaleDateString()}
                            </span>
                            <span className="font-semibold text-green-600">
                              ${booking.total_amount}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Mi Agenda
              </h2>
              
              <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Próximos Trabajos Agendados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingBookings.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No tienes trabajos agendados próximamente
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {upcomingBookings.map((booking) => (
                        <div key={booking.id} className="p-4 border border-border rounded-lg bg-muted/50">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-foreground mb-1">{booking.title}</h4>
                              <p className="text-sm text-muted-foreground">{booking.address}</p>
                            </div>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Fecha:</span>
                              <p className="font-medium">
                                {new Date(booking.scheduled_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Hora:</span>
                              <p className="font-medium">
                                {new Date(booking.scheduled_date).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Duración:</span>
                              <p className="font-medium">{booking.duration_hours}h</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Pago:</span>
                              <p className="font-medium text-primary">${booking.total_amount}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="earnings" className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Mis Ganancias
              </h2>
              
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <DollarSign className="w-5 h-5" />
                      Total Ganado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-foreground">
                      ${earnings.total.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Ganancias totales históricas
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <TrendingUp className="w-5 h-5" />
                      Este Mes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-foreground">
                      ${earnings.thisMonth.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Ganancias del mes actual
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <Clock className="w-5 h-5" />
                      Pendiente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-foreground">
                      ${earnings.pending.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Pagos pendientes por cobrar
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-0">
                <CardHeader>
                  <CardTitle>Historial de Pagos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {completedBookings
                      .filter(b => b.payment_status === 'completed')
                      .slice(0, 5)
                      .map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/50">
                          <div>
                            <h4 className="font-semibold text-foreground">{booking.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(booking.scheduled_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">
                              +${booking.total_amount}
                            </p>
                            <Badge className="bg-green-100 text-green-800">
                              Pagado
                            </Badge>
                          </div>
                        </div>
                      ))}
                    {completedBookings.filter(b => b.payment_status === 'completed').length === 0 && (
                      <p className="text-muted-foreground text-center py-8">
                        No hay pagos completados aún
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default TaskerDashboard;