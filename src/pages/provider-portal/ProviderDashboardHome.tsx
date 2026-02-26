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
  Power,
  Shield,
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
import { toFixedSafe } from "@/utils/formatSafe";

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
      const alertShownKey = 'provider_jobs_alert_shown';
      const lastShown = sessionStorage.getItem(alertShownKey);
      const now = Date.now();
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
      const { data: payments } = await supabase
        .from("jobs")
        .select("total_amount")
        .eq("provider_id", user?.id)
        .eq("status", "completed");
      if (payments) {
        const total = payments.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);
        setEarnings({ total, pending: 0 });
      }
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

  return (
    <div className="min-h-screen overflow-x-hidden w-full max-w-full" style={{ background: '#f2f6fd', fontFamily: "'Nunito', sans-serif" }}>
      
      {/* ─── DARK HERO HEADER ─── */}
      <div className="relative overflow-hidden" style={{ background: '#060e1a' }}>
        {/* Animated mesh gradient */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 80% 60% at 100% 0%, rgba(12,85,173,0.6) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 0% 100%, rgba(46,143,255,0.25) 0%, transparent 50%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(26,111,212,0.15) 0%, transparent 70%)
          `
        }} />
        {/* Dot grid texture */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <div className="relative z-10 px-5 pt-14 pb-6 md:pt-8">
          {/* Top row: avatar + greeting + menu */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <Avatar className="w-[46px] h-[46px] rounded-[14px] border-2 border-white/20">
                  <AvatarImage
                    src={providerProfile?.avatar_url || profile?.avatar_url}
                    alt={profile?.full_name || 'Provider'}
                  />
                  <AvatarFallback 
                    className="rounded-[14px] text-white font-extrabold text-lg"
                    style={{ background: 'linear-gradient(135deg, #2e8fff, #0c55ad)', fontFamily: "'Syne', sans-serif" }}
                  >
                    {getInitials(profile?.full_name || providerProfile?.display_name || 'CH')}
                  </AvatarFallback>
                </Avatar>
                {providerProfile?.verification_status === 'verified' && (
                  <div className="absolute -bottom-[3px] -right-[3px] w-[15px] h-[15px] rounded-full flex items-center justify-center" style={{ background: '#2e8fff', border: '2px solid #060e1a' }}>
                    <svg viewBox="0 0 8 8" fill="none" className="w-[7px] h-[7px]">
                      <path d="M1.5 4l1.5 1.5 3.5-3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Greeting */}
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] block mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Bienvenido de vuelta
                </span>
                <h1 className="text-xl font-extrabold text-white tracking-tight truncate" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em' }}>
                  ¡Hola, {profile?.full_name?.split(' ')[0] || 'Chambynauta'}!
                </h1>
              </div>
            </div>

            {/* Menu button */}
            {isMobile && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleSidebar}
                className="w-[42px] h-[42px] rounded-xl flex flex-col items-center justify-center gap-1 transition-colors flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <span className="block h-[2px] bg-white rounded-full" style={{ width: 20 }} />
                <span className="block h-[2px] bg-white rounded-full" style={{ width: 14 }} />
                <span className="block h-[2px] bg-white rounded-full" style={{ width: 17 }} />
              </motion.button>
            )}
          </div>

          {/* Availability Widget */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between gap-4 rounded-[20px] px-[18px] py-4 backdrop-blur-xl"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-[3px]">
                {/* Pulse ring */}
                <div className="relative w-3 h-3 flex-shrink-0">
                  <div className="absolute inset-0 rounded-full" style={{ background: isAvailable ? '#00d084' : '#94a3b8' }} />
                  {isAvailable && (
                    <div className="absolute -inset-[3px] rounded-full border-2 animate-ping" style={{ borderColor: '#00d084', animationDuration: '2s' }} />
                  )}
                </div>
                <span className="text-[17px] font-bold text-white" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>
                  {isAvailable ? 'Disponible' : 'No disponible'}
                </span>
              </div>
              <div className="text-[11.5px] pl-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {isAvailable ? 'Estás recibiendo solicitudes ahora' : 'No recibirás nuevas solicitudes'}
              </div>
            </div>

            {/* Power toggle button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (!eligible && !isAvailable) {
                  setShowEligibilityModal(true);
                  return;
                }
                setIsAvailable(!isAvailable);
              }}
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
              style={{
                background: isAvailable ? 'rgba(0,208,132,0.12)' : 'rgba(255,255,255,0.06)',
                border: isAvailable ? '2px solid rgba(0,208,132,0.4)' : '2px solid rgba(255,255,255,0.15)',
                boxShadow: isAvailable ? '0 0 20px rgba(0,208,132,0.2)' : 'none',
              }}
            >
              <Power className="w-[22px] h-[22px]" style={{ color: isAvailable ? '#00d084' : 'rgba(255,255,255,0.3)' }} />
            </motion.button>
          </motion.div>

          {/* Stats Strip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-[1px] rounded-2xl overflow-hidden mt-3.5"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <div className="text-center py-3 px-2.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="text-xl font-extrabold text-white leading-none" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em' }}>
                {stats.completedJobs}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] mt-[3px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Trabajos
              </div>
            </div>
            <div className="text-center py-3 px-2.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="text-xl font-extrabold leading-none" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em', color: '#00d084' }}>
                ${earnings.total.toLocaleString('es-MX')}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] mt-[3px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Ganado
              </div>
            </div>
            <div className="text-center py-3 px-2.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="text-xl font-extrabold leading-none" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em', color: '#ffb340' }}>
                {toFixedSafe(stats.rating, 1, '0')}★
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] mt-[3px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Rating
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Available Jobs Alert Popup */}
      <AvailableJobsAlert 
        jobCount={availableJobs.length}
        isOpen={showJobsAlert}
        onClose={() => setShowJobsAlert(false)}
      />

      {/* ─── ALERT BANNERS ─── */}
      <div className="px-5 pt-3.5 flex flex-col gap-2">
        {/* Stripe Banner */}
        {providerProfile?.stripe_onboarding_status !== "enabled" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => navigate("/provider-portal/account")}
            className="relative rounded-2xl p-[13px_15px] flex items-center gap-3 cursor-pointer overflow-hidden active:scale-[0.98] transition-transform"
            style={{
              background: 'linear-gradient(135deg, #0c55ad 0%, #1e7be0 50%, #0a4a99 100%)',
              boxShadow: '0 8px 24px rgba(12,85,173,0.3)',
            }}
          >
            {/* Shine sweep */}
            <div className="absolute top-0 left-0 w-[60%] h-full pointer-events-none" style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
              animation: 'shineSweep 4s ease-in-out infinite',
            }} />
            
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <DollarSign className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="flex-1 relative z-10">
              <div className="text-[13px] font-bold text-white leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                Conecta tu cuenta de Stripe
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Necesario para recibir tus pagos
              </div>
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <ChevronRight className="w-3 h-3 text-white" />
            </div>
          </motion.div>
        )}

        {/* Verification Banner */}
        {(() => {
          const isVerified = status === 'verified';
          if (isVerified || verificationDismissed) return null;
          
          const progressPercent = status === 'pending' ? 30 : status === 'rejected' ? 10 : 0;
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => navigate("/provider-portal/verification")}
              className="rounded-2xl p-[13px_15px] flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
              style={{
                background: 'white',
                border: '1.5px solid #fde68a',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}
            >
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: '#fef3c7' }}>
                <Shield className="w-[18px] h-[18px]" style={{ color: '#d97706' }} />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-bold leading-tight" style={{ fontFamily: "'Syne', sans-serif", color: '#92400e' }}>
                  {status === 'rejected' ? 'Verificación rechazada' : status === 'pending' ? `Verificación pendiente — ${documentsCount} docs` : 'Sube tus documentos'}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: '#b45309' }}>
                  {status === 'rejected' ? 'Revisa tus documentos y vuelve a intentar' : 'Completa tu perfil para más trabajos'}
                </div>
                {/* Progress bar */}
                <div className="h-[3px] rounded-full mt-[7px] overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
                  <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
                </div>
              </div>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#fef3c7' }}>
                <ChevronRight className="w-3 h-3" style={{ color: '#d97706' }} />
              </div>
            </motion.div>
          );
        })()}
      </div>

      {/* ─── ACTIVE JOB CARD ─── */}
      {hasActiveJob && firstActiveJob && (
        <div className="px-5 mt-5">
          <ActiveJobCard job={firstActiveJob} />
        </div>
      )}

      {/* ─── JOBS FEED ─── */}
      <div className="mt-3">
        {/* Unavailable Overlay */}
        {!isAvailable && (
          <div className="mx-5 mb-3 p-8 rounded-2xl text-center" style={{ background: '#e8eef8' }}>
            <div className="text-[52px] mb-4" style={{ animation: 'floatEmoji 3s ease-in-out infinite' }}>😴</div>
            <h3 className="text-lg font-extrabold mb-2" style={{ fontFamily: "'Syne', sans-serif", color: '#060e1a' }}>
              No estás disponible
            </h3>
            <p className="text-[13px] max-w-[240px] mx-auto" style={{ color: '#64748b', lineHeight: 1.6 }}>
              Activa tu disponibilidad y te notificaremos en cuanto llegue algo cerca de ti.
            </p>
          </div>
        )}

        {/* Jobs content - blur when unavailable */}
        <div className={cn(
          "transition-all duration-300",
          !isAvailable && "opacity-30 blur-sm pointer-events-none"
        )}>
          {/* Section header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-[19px] font-extrabold" style={{ fontFamily: "'Syne', sans-serif", color: '#060e1a', letterSpacing: '-0.03em' }}>
                Disponibles
              </span>
              {availableJobs.length > 0 && (
                <span className="text-[11px] font-extrabold text-white px-2 py-0.5 rounded-full" style={{ background: '#0c55ad', fontFamily: "'Syne', sans-serif" }}>
                  {availableJobs.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <JobFeedFilters
                category={categoryFilter}
                onCategoryChange={setCategoryFilter}
                radius={radiusFilter}
                onRadiusChange={setRadiusFilter}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
                hasLocation={!!providerLocation}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-9 h-9 flex items-center justify-center rounded-[10px] border-[1.5px] transition-colors"
                style={{ background: 'white', borderColor: '#e2e8f0' }}
              >
                <RefreshCw className={cn("w-[15px] h-[15px]", isRefreshing && "animate-spin")} style={{ color: '#64748b' }} />
              </motion.button>
            </div>
          </div>

          {/* Job Cards */}
          <div className="px-5 pb-28 md:pb-6">
            <AnimatePresence>
              {isRefreshing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex justify-center py-2"
                >
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#64748b' }}>
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
                <div className="text-[52px] mb-4" style={{ animation: 'floatEmoji 3s ease-in-out infinite' }}>😴</div>
                <h3 className="text-lg font-extrabold mb-2" style={{ fontFamily: "'Syne', sans-serif", color: '#060e1a' }}>
                  Sin trabajos por ahora
                </h3>
                <p className="text-[13px] max-w-[240px] mx-auto" style={{ color: '#64748b', lineHeight: 1.6 }}>
                  Te notificaremos cuando haya nuevas oportunidades
                </p>
              </motion.div>
            ) : (
              <div className={cn(
                "flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4",
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
