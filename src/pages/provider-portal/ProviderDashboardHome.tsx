import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { useFilteredJobs } from "@/hooks/useFilteredJobs";
import { useProviderLocation } from "@/hooks/useProviderLocation";
import { useActiveJobs } from "@/hooks/useActiveJobs";
import { JobCardMobile } from "@/components/provider-portal/JobCardMobile";
import { JobFeedFilters, CategoryFilter, RadiusFilter, DateFilter } from "@/components/provider-portal/JobFeedFilters";
import { JobFeedSkeleton } from "@/components/provider-portal/JobFeedSkeleton";
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
  Menu,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { ProviderDashboardSkeleton } from "@/components/skeletons";
import { cn } from "@/lib/utils";
import { useAvailableJobs } from "@/hooks/useAvailableJobs";
import { useProviderEligibility } from "@/hooks/useProviderEligibility";
import { AvailableJobsAlert } from "@/components/provider-portal/AvailableJobsAlert";
import { EligibilityBlockModal } from "@/components/provider-portal/EligibilityBlockModal";
import { UnverifiedJobsPlaceholder } from "@/components/provider-portal/UnverifiedJobsPlaceholder";
import ProviderStripePayoutStatusCard from "@/components/provider-portal/ProviderStripePayoutStatusCard";

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
  
  const { toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Available jobs hook
  const { jobs: availableJobs, loading: availableJobsLoading, acceptJob, refetch } = useAvailableJobs();
  const { eligible, missing, loading: eligibilityLoading } = useProviderEligibility();
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  
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
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(null);
  const [radiusFilter, setRadiusFilter] = useState<RadiusFilter>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [verificationDismissed, setVerificationDismissed] = useState(false);
  const [selectedJob, setSelectedJob] = useState<AvailableJob | null>(null);
  const [showJobDetail, setShowJobDetail] = useState(false);
  
  const { location: providerLocation } = useProviderLocation();
  
  const handleViewJobDetails = (job: AvailableJob) => {
    setSelectedJob(job);
    setShowJobDetail(true);
  };
  
  // Filtered jobs for feed
  const filteredJobs = useFilteredJobs({
    jobs: availableJobs,
    providerLocation,
    category: categoryFilter,
    radius: radiusFilter,
    dateFilter,
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
        .in("status", ["pending", "confirmed", "in_progress", "assigned", "accepted", "en_route", "on_site", "quoted"]);

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

  // Eligibility-gated accept
  const handleGatedAccept = useCallback(async (jobId: string) => {
    if (!eligible) {
      setShowEligibilityModal(true);
      throw new Error('No elegible');
    }
    return acceptJob(jobId);
  }, [eligible, acceptJob]);

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
    <div className="min-h-screen bg-muted/30 overflow-x-hidden w-full max-w-full">
      {/* Welcome Card - Compact below header */}
      <div className="bg-background border-b border-border/50">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
                <AvatarImage 
                  src={providerProfile?.avatar_url || profile?.avatar_url} 
                  alt={profile?.full_name || 'Provider'} 
                />
                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                  {getInitials(profile?.full_name || providerProfile?.display_name || 'CH')}
                </AvatarFallback>
              </Avatar>
              {providerProfile?.verification_status === 'verified' && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-primary fill-primary/20" />
                </div>
              )}
            </div>

            {/* Greeting + optional rating */}
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-foreground truncate font-jakarta">
                ¡Hola, {profile?.full_name?.split(' ')[0] || 'Chambynauta'}!
              </h1>
              {stats.rating > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-foreground/70">{Number(stats.rating ?? 0).toFixed(1)}</span>
                </span>
              )}
            </div>

            {/* Mobile-only: Hamburger menu only */}
            {isMobile && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleSidebar}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-muted/60 transition-colors flex-shrink-0"
              >
                <Menu className="h-5 w-5 text-muted-foreground" />
              </motion.button>
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

      {/* Verification Banner - Yellow pill below header */}
      {showVerificationBanner && (
        <div className="px-4 mt-2 flex justify-center">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => navigate("/provider-portal/verification")}
            className={cn(
              "inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[11px] font-medium border transition-colors",
              status === 'rejected' 
                ? "border-destructive/50 bg-destructive/5 text-destructive" 
                : status === 'pending'
                  ? "border-yellow-400 bg-yellow-50 text-yellow-700 dark:border-yellow-500/50 dark:bg-yellow-900/20 dark:text-yellow-400"
                  : "border-muted-foreground/30 bg-muted/30 text-muted-foreground"
            )}
          >
            {status === 'rejected' ? (
              <XCircle className="w-3 h-3 flex-shrink-0" />
            ) : status === 'pending' ? (
              <Clock className="w-3 h-3 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
            )}
            <span>
              {status === 'rejected' ? 'Verificación rechazada' :
               status === 'pending' ? 'Verificación en revisión' :
               'Completa tu verificación'}
            </span>
            <span className="opacity-60">→</span>
          </motion.button>
        </div>
      )}

      {/* Stripe Payout Status Tile */}
      {providerProfile?.stripe_onboarding_status !== "enabled" && (
        <div className="px-4 mt-2">
          <ProviderStripePayoutStatusCard
            stripeOnboardingStatus={providerProfile?.stripe_onboarding_status || "not_started"}
            stripeAccountId={providerProfile?.stripe_account_id || null}
            compact
          />
        </div>
      )}

      {/* Availability Button - Large Circle */}
      <div className="px-4 mt-4 flex justify-center">
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => {
            if (!eligible && !isAvailable) {
              setShowEligibilityModal(true);
              return;
            }
            setIsAvailable(!isAvailable);
          }}
          className="relative flex items-center justify-center"
        >
          {/* Animated aura rings */}
          <motion.div
            className={cn(
              "absolute rounded-full",
              isAvailable ? "bg-emerald-400/20" : "bg-red-400/20"
            )}
            animate={{
              width: [100, 130, 100],
              height: [100, 130, 100],
              opacity: [0.4, 0.1, 0.4],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className={cn(
              "absolute rounded-full",
              isAvailable ? "bg-emerald-400/15" : "bg-red-400/15"
            )}
            animate={{
              width: [110, 150, 110],
              height: [110, 150, 110],
              opacity: [0.3, 0.05, 0.3],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
          {/* Main circle */}
          <div className={cn(
            "relative w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-lg",
            isAvailable 
              ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-400/30" 
              : "bg-gradient-to-br from-red-400 to-red-600 shadow-red-400/30"
          )}>
            <AnimatePresence mode="wait">
              <motion.div
                key={isAvailable ? 'on' : 'off'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
              >
                {isAvailable ? (
                  <CheckCircle className="w-7 h-7 text-white mb-0.5" />
                ) : (
                  <XCircle className="w-7 h-7 text-white mb-0.5" />
                )}
                <span className="text-[9px] font-bold text-white/90 uppercase tracking-wider">
                  {isAvailable ? 'Disponible' : 'No disponible'}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.button>
      </div>
      <p className="text-[10px] text-muted-foreground/60 text-center mt-1">
        Toca para cambiar tu disponibilidad
      </p>

      {/* Jobs Feed Section */}
      <div className="mt-3">
        {/* Unavailable Overlay */}
        {!isAvailable && (
          <div className="mx-4 mb-3 p-5 bg-muted/30 rounded-xl text-center">
            <div className="w-10 h-10 rounded-full bg-muted/60 mx-auto flex items-center justify-center mb-1.5">
              <Briefcase className="w-5 h-5 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium text-foreground/80 mb-0.5">
              No estás disponible
            </p>
            <p className="text-[11px] text-muted-foreground">
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
            </div>
          )}

          <div className="px-4 pb-2">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-semibold text-foreground/80">
                  Trabajos disponibles
                </h2>
                {availableJobs.length > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                    {availableJobs.length}
                  </Badge>
                )}
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  isRefreshing && "animate-spin"
                )}
              >
                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
              </motion.button>
            </div>

            {/* Filter Chips */}
            <JobFeedFilters
              category={categoryFilter}
              onCategoryChange={setCategoryFilter}
              radius={radiusFilter}
              onRadiusChange={setRadiusFilter}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              hasLocation={!!providerLocation}
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

            {verificationDetails.status !== 'verified' ? (
              <UnverifiedJobsPlaceholder />
            ) : availableJobsLoading ? (
              <JobFeedSkeleton count={2} />
            ) : filteredJobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                  <Briefcase className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <h3 className="text-sm font-medium text-foreground/70 mb-0.5">
                  Sin trabajos por ahora
                </h3>
                <p className="text-[11px] text-muted-foreground max-w-[200px]">
                  Te notificaremos cuando haya nuevas oportunidades
                </p>
              </motion.div>
            ) : (
              <div className={cn(
                "space-y-2.5 md:grid md:grid-cols-2 md:gap-4 md:space-y-0",
                hasActiveJob && "opacity-50 grayscale"
              )}>
                {filteredJobs.slice(0, 4).map((job, index) => (
                  <JobCardMobile
                    key={job.id}
                    job={job}
                    onAccept={handleGatedAccept}
                    onViewDetails={handleViewJobDetails}
                    index={index}
                    disabled={hasActiveJob}
                    distanceKm={job.distanceKm}
                  />
                ))}

                {filteredJobs.length > 4 && (
                  <Button
                    variant="outline"
                    className="w-full h-10 text-sm md:col-span-2"
                    onClick={() => navigate("/provider-portal/available-jobs")}
                    disabled={hasActiveJob}
                  >
                    Ver {filteredJobs.length - 4} trabajo{filteredJobs.length - 4 !== 1 ? 's' : ''} más
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
        onAccept={handleGatedAccept}
        hasActiveJob={hasActiveJob}
      />
      <EligibilityBlockModal
        open={showEligibilityModal}
        onClose={() => setShowEligibilityModal(false)}
        missing={missing}
      />
    </div>
  );
};

export default ProviderDashboardHome;
