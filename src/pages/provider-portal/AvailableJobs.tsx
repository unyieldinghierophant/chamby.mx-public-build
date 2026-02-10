import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAvailableJobs, AvailableJob } from "@/hooks/useAvailableJobs";
import { useJobSorting } from "@/hooks/useJobSorting";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { useActiveJobs } from "@/hooks/useActiveJobs";
import { useAuth } from "@/contexts/AuthContext";
import { JobCardMobile } from "@/components/provider-portal/JobCardMobile";
import { JobSortingTabs, SortOption } from "@/components/provider-portal/JobSortingTabs";
import { JobFeedSkeleton } from "@/components/provider-portal/JobFeedSkeleton";
import { JobDetailSheet } from "@/components/provider-portal/JobDetailSheet";
import { Briefcase, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const AvailableJobs = () => {
  const { user } = useAuth();
  const { profile: providerProfile } = useProviderProfile(user?.id);
  const [sortOption, setSortOption] = useState<SortOption>('for-you');
  const { jobs, loading, refetch, acceptJob } = useAvailableJobs();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<AvailableJob | null>(null);
  const [showJobDetail, setShowJobDetail] = useState(false);
  
  // Active jobs to check if provider has one
  const { jobs: activeJobs } = useActiveJobs();
  const hasActiveJob = activeJobs.length > 0;

  // Get sorted jobs with match indicators
  const sortedJobs = useJobSorting({
    jobs,
    sortOption,
    providerSkills: providerProfile?.skills || []
  });

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refetch]);

  const handleViewJobDetails = (job: AvailableJob) => {
    setSelectedJob(job);
    setShowJobDetail(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header - Compact */}
      <div className="sticky top-14 md:top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border md:hidden">
        <div className="px-4 py-3">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-3">
            <div>
            <h1 className="text-lg font-bold text-foreground font-jakarta">
                Trabajos Disponibles
              </h1>
              <p className="text-xs text-muted-foreground">
                {sortedJobs.length} oportunidad{sortedJobs.length !== 1 ? 'es' : ''}
              </p>
            </div>
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

          {/* Sorting Tabs */}
          <JobSortingTabs
            activeSort={sortOption}
            onSortChange={setSortOption}
          />
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-jakarta">
              Trabajos Disponibles
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {sortedJobs.length} oportunidad{sortedJobs.length !== 1 ? 'es' : ''} disponible{sortedJobs.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium",
              isRefreshing && "opacity-50"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            Actualizar
          </button>
        </div>

        {/* Desktop Sorting Tabs */}
        <JobSortingTabs
          activeSort={sortOption}
          onSortChange={setSortOption}
        />
      </div>

      {/* Job Feed */}
      <div className="px-4 pb-24 md:px-6 md:pb-6">
        {/* Refresh indicator */}
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

        {loading ? (
          <JobFeedSkeleton count={4} />
        ) : sortedJobs.length === 0 ? (
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
            {sortedJobs.map((job, index) => (
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
          </div>
        )}

        {/* Active job warning */}
        {hasActiveJob && sortedJobs.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border text-center">
            <p className="text-sm text-muted-foreground">
              Finaliza tu trabajo activo para aceptar otro
            </p>
          </div>
        )}
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

export default AvailableJobs;