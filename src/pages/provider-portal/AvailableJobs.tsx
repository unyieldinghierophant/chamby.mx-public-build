import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAvailableJobs } from "@/hooks/useAvailableJobs";
import { useJobSorting } from "@/hooks/useJobSorting";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { useAuth } from "@/contexts/AuthContext";
import { JobCardMobile } from "@/components/provider-portal/JobCardMobile";
import { JobSortingTabs, SortOption } from "@/components/provider-portal/JobSortingTabs";
import { JobFeedSkeleton } from "@/components/provider-portal/JobFeedSkeleton";
import { Briefcase, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const AvailableJobs = () => {
  const { user } = useAuth();
  const { profile: providerProfile } = useProviderProfile(user?.id);
  const [sortOption, setSortOption] = useState<SortOption>('for-you');
  const { jobs, loading, refetch, acceptJob } = useAvailableJobs();
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border md:hidden">
        <div className="px-4 py-4">
          {/* Title Row */}
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
                "p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors",
                isRefreshing && "animate-spin"
              )}
            >
              <RefreshCw className="w-5 h-5 text-muted-foreground" />
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
      <div className="hidden md:block px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-jakarta">
              Trabajos Disponibles
            </h1>
            <p className="text-muted-foreground mt-1">
              {sortedJobs.length} oportunidad{sortedJobs.length !== 1 ? 'es' : ''} disponible{sortedJobs.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium",
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
      <div className="p-4 md:px-6">
        {/* Refresh indicator */}
        <AnimatePresence>
          {isRefreshing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-center py-4"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Actualizando...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <JobFeedSkeleton count={4} />
        ) : sortedJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Briefcase className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No hay trabajos disponibles
            </h3>
            <p className="text-muted-foreground max-w-xs">
              Te notificaremos cuando haya nuevas oportunidades de trabajo en tu zona
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {sortedJobs.map((job, index) => (
              <JobCardMobile
                key={job.id}
                job={job}
                onAccept={acceptJob}
                isMatch={job.isMatch}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailableJobs;