import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { useJobSorting } from "@/hooks/useJobSorting";
import { JobCardMobile } from "@/components/provider-portal/JobCardMobile";
import { JobSortingTabs, SortOption } from "@/components/provider-portal/JobSortingTabs";
import { JobFeedSkeleton } from "@/components/provider-portal/JobFeedSkeleton";
import {
  Calendar,
  MapPin,
  DollarSign,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  BadgeCheck,
  XCircle,
  FileText,
  Briefcase,
  RefreshCw,
  ChevronRight,
  Bell,
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
  const { jobs: availableJobs, loading: availableJobsLoading, acceptJob, refetch } = useAvailableJobs();
  
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
  const [sortOption, setSortOption] = useState<SortOption>('for-you');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Sorted jobs for feed
  const sortedJobs = useJobSorting({
    jobs: availableJobs,
    sortOption,
    providerSkills: providerProfile?.skills || []
  });
  
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
      const { data: details } = await supabase
        .from('provider_details')
        .select('verification_status, admin_notes')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const { count } = await supabase
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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refetch]);

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

  const { status, admin_notes, documentsCount } = verificationDetails;
  const showVerificationBanner = status !== 'verified';

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Profile Card - Compact */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b border-border">
        <div className="px-4 py-5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-16 h-16 border-2 border-background shadow-md">
                <AvatarImage 
                  src={providerProfile?.avatar_url || profile?.avatar_url} 
                  alt={profile?.full_name || 'Provider'} 
                />
                <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                  {getInitials(profile?.full_name || providerProfile?.display_name || 'CH')}
                </AvatarFallback>
              </Avatar>
              {providerProfile?.verification_status === 'verified' && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
                  <BadgeCheck className="w-5 h-5 text-primary fill-primary/20" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate font-jakarta">
                ¡Hola, {profile?.full_name?.split(' ')[0] || 'Chambynauta'}!
              </h1>
              <p className="text-sm text-muted-foreground truncate">
                {providerProfile?.specialty || 'Chambynauta profesional'}
              </p>
              
              {/* Quick Stats */}
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{stats.rating.toFixed(1)}</span>
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {stats.completedJobs} trabajos
                </span>
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="flex flex-col items-center">
              <Switch
                id="availability"
                checked={isAvailable}
                onCheckedChange={setIsAvailable}
              />
              <span className={cn(
                "text-xs mt-1",
                isAvailable ? "text-green-600" : "text-muted-foreground"
              )}>
                {isAvailable ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Jobs Alert Popup */}
      <AvailableJobsAlert 
        jobCount={availableJobs.length}
        isOpen={showJobsAlert}
        onClose={() => setShowJobsAlert(false)}
      />

      {/* Verification Banner - Compact */}
      {showVerificationBanner && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={cn(
            "mx-4 mt-4 p-3 rounded-xl border flex items-center gap-3",
            status === 'rejected' 
              ? "bg-destructive/5 border-destructive/30" 
              : "bg-amber-500/5 border-amber-500/30"
          )}
        >
          {status === 'rejected' ? (
            <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          ) : status === 'pending' ? (
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {status === 'rejected' ? 'Verificación rechazada' :
               status === 'pending' ? 'Verificación en revisión' :
               'Completa tu verificación'}
            </p>
          </div>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => navigate("/provider-portal/verification")}
            className="flex-shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}

      {/* Stats Grid - Mobile Optimized */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-4">
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold">{stats.activeJobs}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ganancias</p>
                <p className="text-2xl font-bold">${earnings.total.toLocaleString('es-MX')}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Feed Section */}
      <div className="mt-6">
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground font-jakarta">
                Trabajos Disponibles
              </h2>
              {availableJobs.length > 0 && (
                <Badge className="bg-primary text-primary-foreground">
                  {availableJobs.length}
                </Badge>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={cn(
                "p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors",
                isRefreshing && "animate-spin"
              )}
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Sorting Tabs */}
          <JobSortingTabs
            activeSort={sortOption}
            onSortChange={setSortOption}
          />
        </div>

        {/* Job Cards */}
        <div className="px-4 pb-6">
          <AnimatePresence>
            {isRefreshing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-center py-3"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Actualizando...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {availableJobsLoading ? (
            <JobFeedSkeleton count={2} />
          ) : sortedJobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                <Briefcase className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No hay trabajos disponibles
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Te notificaremos cuando haya nuevas oportunidades
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {sortedJobs.slice(0, 4).map((job, index) => (
                <JobCardMobile
                  key={job.id}
                  job={job}
                  onAccept={acceptJob}
                  isMatch={job.isMatch}
                  index={index}
                />
              ))}

              {sortedJobs.length > 4 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/provider-portal/available-jobs")}
                >
                  Ver {sortedJobs.length - 4} trabajo{sortedJobs.length - 4 !== 1 ? 's' : ''} más
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions - Hidden on Mobile, shown on larger screens */}
      <div className="hidden md:grid gap-4 md:grid-cols-2 px-6 pb-6">
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