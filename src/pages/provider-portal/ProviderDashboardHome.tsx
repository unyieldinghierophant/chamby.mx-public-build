import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { useJobSorting } from "@/hooks/useJobSorting";
import { useActiveJobs } from "@/hooks/useActiveJobs";
import { JobCardMobile } from "@/components/provider-portal/JobCardMobile";
import { JobSortingTabs, SortOption } from "@/components/provider-portal/JobSortingTabs";
import { JobFeedSkeleton } from "@/components/provider-portal/JobFeedSkeleton";
import { AvailabilityButton } from "@/components/provider-portal/AvailabilityButton";
import { ActiveJobCard } from "@/components/provider-portal/ActiveJobCard";
import { JobDetailSheet } from "@/components/provider-portal/JobDetailSheet";
import { AvailableJob } from "@/hooks/useAvailableJobs";
import {
  Calendar,
  DollarSign,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  BadgeCheck,
  XCircle,
  Briefcase,
  RefreshCw,
  ChevronRight,
  Bell,
  Menu,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { ProviderDashboardSkeleton } from "@/components/skeletons";
import { cn } from "@/lib/utils";
import { useAvailableJobs } from "@/hooks/useAvailableJobs";
import { AvailableJobsAlert } from "@/components/provider-portal/AvailableJobsAlert";
import { useProviderNotifications } from "@/hooks/useProviderNotifications";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface VerificationDetails {
  status: 'none' | 'pending' | 'verified' | 'rejected';
  admin_notes: string | null;
  documentsCount: number;
}

const ProviderDashboardHome = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { profile: providerProfile } = useProviderProfile(user?.id);
  const { unreadCount } = useProviderNotifications();
  const { toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Available jobs hook
  const { jobs: availableJobs, loading: availableJobsLoading, acceptJob, refetch } = useAvailableJobs();
  
  // Active jobs hook
  const { jobs: activeJobs } = useActiveJobs();
  const hasActiveJob = activeJobs.length > 0;
  const firstActiveJob = activeJobs[0] || null;
  
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
  const [verificationDismissed, setVerificationDismissed] = useState(false);
  const [selectedJob, setSelectedJob] = useState<AvailableJob | null>(null);
  const [showJobDetail, setShowJobDetail] = useState(false);
  
  const handleViewJobDetails = (job: AvailableJob) => {
    setSelectedJob(job);
    setShowJobDetail(true);
  };
  
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

      const { data: activeJobsData } = await supabase
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
        activeJobs: activeJobsData?.length || 0,
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
  const showVerificationBanner = status !== 'verified' && !verificationDismissed;

  // Conditional stats display - hide if both are zero
  const showStats = stats.activeJobs > 0 || earnings.total > 0;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full max-w-full">
      {/* Welcome Card - Compact below header */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Avatar - Smaller on mobile */}
            <div className="relative flex-shrink-0">
              <Avatar className="w-11 h-11 border-2 border-background shadow-sm">
                <AvatarImage 
                  src={providerProfile?.avatar_url || profile?.avatar_url} 
                  alt={profile?.full_name || 'Provider'} 
                />
                <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                  {getInitials(profile?.full_name || providerProfile?.display_name || 'CH')}
                </AvatarFallback>
              </Avatar>
              {providerProfile?.verification_status === 'verified' && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-primary fill-primary/20" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-foreground truncate font-jakarta">
                ¡Hola, {profile?.full_name?.split(' ')[0] || 'Chambynauta'}!
              </h1>
              
              {/* Quick Stats Row */}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-0.5 text-xs">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{stats.rating.toFixed(1)}</span>
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  {stats.completedJobs} trabajos
                </span>
              </div>
            </div>

            {/* Mobile-only: Bell + Hamburger */}
            {isMobile && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => navigate('/provider-portal/notifications')}
                  className="relative h-9 w-9 flex items-center justify-center rounded-lg transition-colors active:bg-muted"
                >
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={toggleSidebar}
                  className="h-9 w-9 flex items-center justify-center rounded-lg bg-muted active:bg-muted/80 transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Jobs Alert Popup */}
      <AvailableJobsAlert 
        jobCount={availableJobs.length}
        isOpen={showJobsAlert}
        onClose={() => setShowJobsAlert(false)}
      />

      {/* Verification Banner - Slim inline format */}
      {showVerificationBanner && (
        <motion.button
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onClick={() => navigate("/provider-portal/verification")}
          className={cn(
            "mx-4 mt-3 py-2 px-3 rounded-lg border flex items-center gap-2 w-[calc(100%-2rem)] text-left transition-colors active:opacity-80",
            status === 'rejected' 
              ? "bg-destructive/5 border-destructive/30" 
              : "bg-amber-500/5 border-amber-500/30"
          )}
        >
          {status === 'rejected' ? (
            <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
          ) : status === 'pending' ? (
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          )}
          <span className="text-xs font-medium text-foreground flex-1">
            {status === 'rejected' ? 'Verificación rechazada' :
             status === 'pending' ? 'Verificación en revisión' :
             'Completa tu verificación'}
          </span>
          <span className="text-xs text-muted-foreground">Ver estado →</span>
        </motion.button>
      )}

      {/* Stats Grid - Conditional, compact */}
      {showStats && (
        <div className="grid grid-cols-2 gap-2 px-4 mt-3">
          <Card className={cn(
            "bg-card border-border/50",
            stats.activeJobs === 0 && "opacity-50"
          )}>
            <CardContent className="p-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Activos</p>
                  <p className="text-lg font-bold">{stats.activeJobs}</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "bg-card border-border/50",
            earnings.total === 0 && "opacity-50"
          )}>
            <CardContent className="p-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ganancias</p>
                  <p className="text-lg font-bold">${earnings.total.toLocaleString('es-MX')}</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Availability Button - Full width above jobs */}
      <div className="px-4 mt-4">
        <AvailabilityButton 
          isAvailable={isAvailable} 
          onToggle={setIsAvailable} 
        />
      </div>

      {/* Jobs Feed Section */}
      <div className="mt-4">
        {/* Unavailable Overlay */}
        {!isAvailable && (
          <div className="mx-4 mb-4 p-6 bg-muted/50 rounded-xl border border-border text-center">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-2">
              <Briefcase className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              No estás disponible
            </p>
            <p className="text-xs text-muted-foreground">
              Activa tu disponibilidad para ver trabajos
            </p>
          </div>
        )}

        {/* Jobs content - blur when unavailable */}
        <div className={cn(
          "transition-all duration-300",
          !isAvailable && "opacity-30 blur-sm pointer-events-none"
        )}>
          {/* Active Job Pinned Card */}
          {hasActiveJob && firstActiveJob && (
            <div className="px-4 mb-2">
              <ActiveJobCard job={firstActiveJob} />
              <p className="text-[10px] text-center text-muted-foreground mt-1">
                Finaliza tu trabajo activo para aceptar otro
              </p>
            </div>
          )}

          <div className="px-4 pb-2">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground font-jakarta">
                  Trabajos Disponibles
                </h2>
                {availableJobs.length > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                    {availableJobs.length}
                  </Badge>
                )}
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={cn(
                  "p-1.5 rounded-full bg-muted active:bg-muted/80 transition-colors",
                  isRefreshing && "animate-spin"
                )}
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Sorting Tabs - Light segmented */}
            <JobSortingTabs
              activeSort={sortOption}
              onSortChange={setSortOption}
            />
          </div>

          {/* Job Cards */}
          <div className="px-4 pb-28 md:pb-6">
            <AnimatePresence>
              {isRefreshing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex justify-center py-2"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Actualizando...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {availableJobsLoading ? (
              <JobFeedSkeleton count={2} />
            ) : sortedJobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-10 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-2">
                  <Briefcase className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-0.5">
                  No hay trabajos disponibles
                </h3>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Te notificaremos cuando haya nuevas oportunidades
                </p>
              </motion.div>
            ) : (
              <div className={cn(
                "space-y-2.5 md:grid md:grid-cols-2 md:gap-4 md:space-y-0",
                hasActiveJob && "opacity-50 grayscale"
              )}>
                {sortedJobs.slice(0, 4).map((job, index) => (
                  <JobCardMobile
                    key={job.id}
                    job={job}
                    onAccept={acceptJob}
                    onViewDetails={handleViewJobDetails}
                    isMatch={job.isMatch}
                    index={index}
                    disabled={hasActiveJob}
                  />
                ))}

                {sortedJobs.length > 4 && (
                  <Button
                    variant="outline"
                    className="w-full h-10 text-sm md:col-span-2"
                    onClick={() => navigate("/provider-portal/available-jobs")}
                    disabled={hasActiveJob}
                  >
                    Ver {sortedJobs.length - 4} trabajo{sortedJobs.length - 4 !== 1 ? 's' : ''} más
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions - Hidden on Mobile */}
      <div className="hidden md:grid gap-4 md:grid-cols-2 px-6 pb-6">
        <Card className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => navigate("/provider-portal/calendar")}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              Ver Calendario
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              Organiza tu agenda y disponibilidad
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => navigate("/provider-portal/earnings")}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-primary" />
              Mis Ganancias
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              Revisa tus pagos y balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Job Detail Sheet */}
      <JobDetailSheet
        job={selectedJob}
        isOpen={showJobDetail}
        onClose={() => setShowJobDetail(false)}
        onAccept={acceptJob}
        hasActiveJob={hasActiveJob}
      />
    </div>
  );
};

export default ProviderDashboardHome;
