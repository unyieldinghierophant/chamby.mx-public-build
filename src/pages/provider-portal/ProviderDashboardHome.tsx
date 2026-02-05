import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import {
  Calendar,
  MapPin,
  DollarSign,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  BadgeCheck,
  XCircle,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ProviderDashboardSkeleton } from "@/components/skeletons";
import { cn } from "@/lib/utils";
import { useAvailableJobs } from "@/hooks/useAvailableJobs";
import { AvailableJobsAlert } from "@/components/provider-portal/AvailableJobsAlert";
import { AvailableJobsSection } from "@/components/provider-portal/AvailableJobsSection";

interface UpcomingJob {
  id: string;
  title: string;
  scheduled_at: string;
  address: string;
  status: string;
  customer_name: string;
}

interface VerificationDetails {
  status: 'none' | 'pending' | 'verified' | 'rejected';
  admin_notes: string | null;
  documentsCount: number;
}

const ProviderDashboardHome = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { profile: providerProfile } = useProviderProfile(user?.id);
  const navigate = useNavigate();
  
  // Available jobs hook
  const { jobs: availableJobs, loading: availableJobsLoading, acceptJob } = useAvailableJobs();
  
  const [upcomingJobs, setUpcomingJobs] = useState<UpcomingJob[]>([]);
  const [earnings, setEarnings] = useState({ total: 0, pending: 0 });
  const [stats, setStats] = useState({
    completedJobs: 0,
    activeJobs: 0,
    rating: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [verificationDetails, setVerificationDetails] = useState<VerificationDetails>({
    status: 'none',
    admin_notes: null,
    documentsCount: 0
  });
  const [showJobsAlert, setShowJobsAlert] = useState(false);
  
  // Show popup alert when there are available jobs
  useEffect(() => {
    if (!availableJobsLoading && availableJobs.length > 0) {
      // Only show alert once per session
      const alertShownKey = 'provider_jobs_alert_shown';
      const lastShown = sessionStorage.getItem(alertShownKey);
      const now = Date.now();
      
      // Show alert if not shown in the last 5 minutes
      if (!lastShown || now - parseInt(lastShown) > 5 * 60 * 1000) {
        setShowJobsAlert(true);
        sessionStorage.setItem(alertShownKey, now.toString());
      }
    }
  }, [availableJobs, availableJobsLoading]);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
    fetchVerificationDetails();
  }, [user]);

  const fetchVerificationDetails = async () => {
    if (!user) return;
    
    try {
      // Fetch provider_details for verification status
      const { data: details } = await supabase
        .from('provider_details')
        .select('verification_status, admin_notes')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Fetch document count
      const { data: docs, count } = await supabase
        .from('documents')
        .select('id', { count: 'exact' })
        .eq('provider_id', user.id);

      setVerificationDetails({
        status: (details?.verification_status as 'none' | 'pending' | 'verified' | 'rejected') || 'none',
        admin_notes: details?.admin_notes || null,
        documentsCount: count || 0
      });
    } catch (error) {
      console.error('Error fetching verification details:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch upcoming jobs using user.id directly
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title, scheduled_at, location, status, client_id")
        .eq("provider_id", user?.id)
        .in("status", ["pending", "confirmed", "assigned"])
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(5);

      if (jobs) {
        setUpcomingJobs(
          jobs.map((job: any) => ({
            id: job.id,
            title: job.title,
            scheduled_at: job.scheduled_at,
            address: job.location || "Sin dirección",
            status: job.status,
            customer_name: job.customer?.full_name || "Cliente",
          }))
        );
      }

      // Fetch earnings using user.id
      const { data: payments } = await supabase
        .from("jobs")
        .select("total_amount")
        .eq("provider_id", user?.id)
        .eq("status", "completed");

      if (payments) {
        const total = payments.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);
        setEarnings({ total, pending: 0 });
      }

      // Fetch stats using user.id
      const { data: completedJobs } = await supabase
        .from("jobs")
        .select("id", { count: "exact" })
        .eq("provider_id", user?.id)
        .eq("status", "completed");

      const { data: activeJobs } = await supabase
        .from("jobs")
        .select("id", { count: "exact" })
        .eq("provider_id", user?.id)
        .in("status", ["pending", "confirmed", "in_progress", "assigned"]);

      // Fetch reviews
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("provider_id", user?.id);

      const avgRating = reviews?.length
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      setStats({
        completedJobs: completedJobs?.length || 0,
        activeJobs: activeJobs?.length || 0,
        rating: avgRating,
        totalReviews: reviews?.length || 0,
      });
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
    return <ProviderDashboardSkeleton />;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderVerificationCard = () => {
    const { status, admin_notes, documentsCount } = verificationDetails;
    
    // Don't show if verified
    if (status === 'verified') return null;

    const statusConfig = {
      none: {
        title: 'Completa tu Verificación',
        message: 'Para desbloquear trabajos grandes (> $4,000 MXN) y aumentar tu visibilidad, completa el proceso de verificación.',
        icon: AlertCircle,
        iconColor: 'text-yellow-600',
        borderColor: 'border-yellow-500/50',
        bgColor: 'bg-yellow-500/5',
        buttonText: 'Completar Verificación',
      },
      pending: {
        title: 'Verificación en Revisión',
        message: 'Tu perfil está siendo revisado por el equipo de Chamby. Te notificaremos cuando tengamos una respuesta.',
        icon: Clock,
        iconColor: 'text-amber-600',
        borderColor: 'border-amber-500/50',
        bgColor: 'bg-amber-500/5',
        buttonText: 'Ver Detalles',
      },
      rejected: {
        title: 'Verificación Rechazada',
        message: admin_notes || 'Hay un problema con tus documentos. Por favor revisa y vuelve a subir la información correcta.',
        icon: XCircle,
        iconColor: 'text-destructive',
        borderColor: 'border-destructive/50',
        bgColor: 'bg-destructive/5',
        buttonText: 'Corregir Documentos',
      },
      verified: {
        title: '',
        message: '',
        icon: CheckCircle,
        iconColor: '',
        borderColor: '',
        bgColor: '',
        buttonText: '',
      }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Card className={cn("border-2", config.borderColor, config.bgColor)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={cn("h-5 w-5", config.iconColor)} />
              {config.title}
            </div>
            <Badge variant={status === 'rejected' ? 'destructive' : 'secondary'}>
              {status === 'pending' ? 'En Revisión' : status === 'rejected' ? 'Rechazado' : 'Pendiente'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {config.message}
          </p>
          
          {status === 'pending' && documentsCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>Documentos enviados: {documentsCount}/4</span>
              {documentsCount >= 4 && <CheckCircle className="h-4 w-4 text-green-600" />}
            </div>
          )}

          <Button onClick={() => navigate("/provider-portal/verification")}>
            {config.buttonText}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      {/* Provider Profile Hero */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
        <CardContent className="pt-8 pb-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-lg">
                <AvatarImage 
                  src={providerProfile?.avatar_url || profile?.avatar_url} 
                  alt={profile?.full_name || 'Provider'} 
                />
                <AvatarFallback className="text-2xl md:text-3xl font-bold bg-primary/10 text-primary">
                  {getInitials(profile?.full_name || providerProfile?.display_name || 'CH')}
                </AvatarFallback>
              </Avatar>
              {providerProfile?.verification_status === 'verified' && (
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                  <BadgeCheck className="w-6 h-6 md:w-8 md:h-8 text-primary fill-primary/20" />
                </div>
              )}
            </div>

            {/* Name & Role */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                ¡Hola, {profile?.full_name?.split(' ')[0] || providerProfile?.display_name || "Chambynauta"}!
              </h1>
              <p className="text-muted-foreground mt-1">
                {providerProfile?.specialty || 'Chambynauta profesional'}
              </p>
            </div>

            {/* Quick Stats Row */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{stats.rating.toFixed(1)}</span>
                <span className="text-muted-foreground text-sm">({stats.totalReviews})</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold">{stats.completedJobs}</span>
                <span className="text-muted-foreground text-sm">trabajos</span>
              </div>
              {providerProfile?.zone_served && (
                <>
                  <div className="h-4 w-px bg-border hidden md:block" />
                  <div className="hidden md:flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="text-muted-foreground text-sm">{providerProfile.zone_served}</span>
                  </div>
                </>
              )}
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center gap-3 mt-4 p-3 bg-background/50 rounded-lg border">
              <Switch
                id="availability"
                checked={isAvailable}
                onCheckedChange={setIsAvailable}
              />
              <Label htmlFor="availability" className="cursor-pointer">
                <span className={isAvailable ? "text-green-600 font-medium" : "text-muted-foreground"}>
                  {isAvailable ? "Disponible para trabajos" : "No disponible"}
                </span>
              </Label>
            </div>

            {/* Edit Profile Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/provider-portal/profile")}
              className="mt-2"
            >
              <Settings className="w-4 h-4 mr-2" />
              Editar Perfil
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Jobs Alert Popup */}
      <AvailableJobsAlert 
        jobCount={availableJobs.length}
        isOpen={showJobsAlert}
        onClose={() => setShowJobsAlert(false)}
      />

      {/* Available Jobs Section - PROMINENT */}
      <AvailableJobsSection
        jobs={availableJobs}
        loading={availableJobsLoading}
        onAcceptJob={acceptJob}
      />

      {/* Verification Status Card */}
      {renderVerificationCard()}

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

        <Card className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => navigate("/provider-portal/earnings")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Mis Ganancias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Revisa tus pagos y balance
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProviderDashboardHome;
