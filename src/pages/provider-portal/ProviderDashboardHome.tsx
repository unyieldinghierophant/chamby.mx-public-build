import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  DollarSign,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
// import { useFCMToken } from "@/hooks/useFCMToken";

interface UpcomingJob {
  id: string;
  title: string;
  scheduled_at: string;
  address: string;
  status: string;
  customer_name: string;
}

const ProviderDashboardHome = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  
  // TODO: Re-enable FCM after fixing build issues
  // useFCMToken();
  
  const [upcomingJobs, setUpcomingJobs] = useState<UpcomingJob[]>([]);
  const [earnings, setEarnings] = useState({ total: 0, pending: 0 });
  const [stats, setStats] = useState({
    completedJobs: 0,
    activeJobs: 0,
    rating: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch upcoming jobs
      const { data: jobs } = await supabase
        .from("bookings")
        .select(`
          id,
          title,
          scheduled_date,
          address,
          status,
          customer_id,
          profiles!bookings_customer_id_fkey(full_name)
        `)
        .eq("tasker_id", user?.id)
        .in("status", ["pending", "confirmed"])
        .gte("scheduled_date", new Date().toISOString())
        .order("scheduled_date", { ascending: true })
        .limit(5);

      if (jobs) {
        setUpcomingJobs(
          jobs.map((job: any) => ({
            id: job.id,
            title: job.title,
            scheduled_at: job.scheduled_date,
            address: job.address || "Sin dirección",
            status: job.status,
            customer_name: job.profiles?.full_name || "Cliente",
          }))
        );
      }

      // Fetch earnings
      const { data: payments } = await supabase
        .from("bookings")
        .select("total_amount, payment_status")
        .eq("tasker_id", user?.id);

      if (payments) {
        const total = payments
          .filter((p) => p.payment_status === "paid")
          .reduce((sum, p) => sum + Number(p.total_amount), 0);
        const pending = payments
          .filter((p) => p.payment_status === "pending")
          .reduce((sum, p) => sum + Number(p.total_amount), 0);
        setEarnings({ total, pending });
      }

      // Stats from profile
      if (profile) {
        const { data: completedBookings } = await supabase
          .from("bookings")
          .select("id", { count: "exact" })
          .eq("tasker_id", user?.id)
          .eq("status", "completed");

        const { data: activeBookings } = await supabase
          .from("bookings")
          .select("id", { count: "exact" })
          .eq("tasker_id", user?.id)
          .in("status", ["pending", "confirmed", "in_progress"]);

        // Fetch reviews
        const { data: reviews } = await supabase
          .from("reviews")
          .select("rating")
          .eq("provider_id", user?.id);

        const avgRating = reviews?.length
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

        setStats({
          completedJobs: completedBookings?.length || 0,
          activeJobs: activeBookings?.length || 0,
          rating: avgRating,
          totalReviews: reviews?.length || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-700";
      case "pending":
        return "bg-yellow-500/10 text-yellow-700";
      case "in_progress":
        return "bg-blue-500/10 text-blue-700";
      default:
        return "bg-gray-500/10 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmado";
      case "pending":
        return "Pendiente";
      case "in_progress":
        return "En progreso";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          ¡Hola, {profile?.full_name || "Chambynauta"}!
        </h1>
        <p className="text-muted-foreground">
          Aquí está tu resumen de actividad
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Trabajos Completados
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedJobs}</div>
            <p className="text-xs text-muted-foreground">
              Total de servicios finalizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Trabajos Activos
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              En progreso o pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ganancias Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${earnings.total.toLocaleString("es-MX")}
            </div>
            <p className="text-xs text-muted-foreground">
              Pendiente: ${earnings.pending.toLocaleString("es-MX")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Calificación
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {stats.rating.toFixed(1)}
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalReviews} reseñas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Verification Status */}
      {profile?.verification_status !== "verified" && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Completa tu verificación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Para desbloquear trabajos grandes (&gt; $4,000 MXN) y aumentar tu
              visibilidad, completa el proceso de verificación.
            </p>
            <Button onClick={() => navigate("/provider-portal/verification")}>
              Completar Verificación
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Próximos Trabajos</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/provider-portal/jobs")}
          >
            Ver todos
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingJobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No tienes trabajos próximos programados
            </p>
          ) : (
            <div className="space-y-4">
              {upcomingJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/provider-portal/jobs/${job.id}`)}
                >
                  <Calendar className="h-5 w-5 text-primary mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium">{job.title}</h3>
                      <Badge className={getStatusColor(job.status)}>
                        {getStatusText(job.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cliente: {job.customer_name}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(job.scheduled_at), "PPP 'a las' p", {
                          locale: es,
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.address}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => navigate("/provider-portal/jobs?tab=disponibles")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Ver Trabajos Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Explora nuevas oportunidades de trabajo en tu área
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => navigate("/provider-portal/calendar")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Ver Calendario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Organiza tu agenda y disponibilidad
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProviderDashboardHome;
