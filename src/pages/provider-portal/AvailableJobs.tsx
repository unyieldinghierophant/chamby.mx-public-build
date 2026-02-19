import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAvailableJobs, AvailableJob } from "@/hooks/useAvailableJobs";
import { useFilteredJobs, JobWithDistance } from "@/hooks/useFilteredJobs";
import { useProviderLocation } from "@/hooks/useProviderLocation";
import { useActiveJobs } from "@/hooks/useActiveJobs";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderEligibility } from "@/hooks/useProviderEligibility";
import { JobCardMobile } from "@/components/provider-portal/JobCardMobile";
import { JobFeedFilters, CategoryFilter, DateFilter } from "@/components/provider-portal/JobFeedFilters";
import { JobFeedSkeleton } from "@/components/provider-portal/JobFeedSkeleton";
import { JobDetailSheet } from "@/components/provider-portal/JobDetailSheet";
import { EligibilityBlockModal } from "@/components/provider-portal/EligibilityBlockModal";
import { UnverifiedJobsPlaceholder } from "@/components/provider-portal/UnverifiedJobsPlaceholder";
import { Briefcase, RefreshCw, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const AvailableJobs = () => {
  const { user } = useAuth();
  const { location: providerLocation, permissionDenied, requestLocation } = useProviderLocation();
  const { jobs, loading, refetch, acceptJob } = useAvailableJobs();
  const { eligible, missing, loading: eligibilityLoading } = useProviderEligibility();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<AvailableJob | null>(null);
  const [showJobDetail, setShowJobDetail] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  // Check verification status
  useEffect(() => {
    if (!user) return;
    supabase
      .from('provider_details')
      .select('verification_status')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setIsVerified(data?.verification_status === 'verified');
      });
  }, [user]);

  // Filters
  const [category, setCategory] = useState<CategoryFilter>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>(null);

  // Active jobs to check if provider has one
  const { jobs: activeJobs } = useActiveJobs();
  const hasActiveJob = activeJobs.length > 0;

  // Filtered and distance-sorted jobs
  const filteredJobs = useFilteredJobs({
    jobs,
    providerLocation,
    category,
    radius: null,
    dateFilter,
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refetch]);

  const handleViewJobDetails = (job: AvailableJob) => {
    setSelectedJob(job);
    setShowJobDetail(true);
  };

  // Eligibility-gated accept
  const handleGatedAccept = async (jobId: string) => {
    if (!eligible) {
      setShowEligibilityModal(true);
      throw new Error('No elegible');
    }
    return acceptJob(jobId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-14 md:top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground font-jakarta">
                Trabajos Disponibles
              </h1>
              <p className="text-xs text-muted-foreground">
                {filteredJobs.length} oportunidad{filteredJobs.length !== 1 ? 'es' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <JobFeedFilters
                category={category}
                onCategoryChange={setCategory}
                radius={null}
                onRadiusChange={() => {}}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
                hasLocation={!!providerLocation}
              />
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={cn(
                  "p-2 rounded-full bg-muted active:bg-muted/80 transition-colors",
                  isRefreshing && "animate-spin"
                )}
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Location CTA */}
      {permissionDenied && (
        <div className="mx-4 mt-3 p-3 bg-muted/50 rounded-xl border border-border flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">Habilita tu ubicación</p>
            <p className="text-[10px] text-muted-foreground">Para ver trabajos cercanos y filtrar por distancia</p>
          </div>
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={requestLocation}>
            Activar
          </Button>
        </div>
      )}

      {/* Job Feed */}
      <div className="px-4 pb-24 md:px-6 md:pb-6 mt-3">
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

        {isVerified === false ? (
          <UnverifiedJobsPlaceholder />
        ) : loading ? (
          <JobFeedSkeleton count={4} />
        ) : filteredJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
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
              Te notificaremos cuando haya nuevas oportunidades de trabajo en tu zona
            </p>
          </motion.div>
        ) : (
          <div className={cn(
            "space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0",
            hasActiveJob && "opacity-50 grayscale pointer-events-none"
          )}>
            {filteredJobs.map((job, index) => (
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
          </div>
        )}

        {isVerified !== false && hasActiveJob && filteredJobs.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border text-center">
            <p className="text-sm text-muted-foreground">
              Finaliza tu trabajo activo para aceptar otro
            </p>
          </div>
        )}
      </div>

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

export default AvailableJobs;
