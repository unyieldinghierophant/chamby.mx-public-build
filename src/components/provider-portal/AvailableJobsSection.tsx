import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, ArrowRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AvailableJob } from "@/hooks/useAvailableJobs";
import { JobCardMobile } from "./JobCardMobile";
import { JobFeedSkeleton } from "./JobFeedSkeleton";
import { useJobSorting } from "@/hooks/useJobSorting";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { useAuth } from "@/contexts/AuthContext";

interface AvailableJobsSectionProps {
  jobs: AvailableJob[];
  loading: boolean;
  onAcceptJob: (jobId: string) => Promise<void>;
}

export const AvailableJobsSection = ({ jobs, loading, onAcceptJob }: AvailableJobsSectionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile: providerProfile } = useProviderProfile(user?.id);

  // Get sorted jobs with match indicators
  const sortedJobs = useJobSorting({
    jobs,
    sortOption: 'for-you',
    providerSkills: providerProfile?.skills || []
  });

  if (loading) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Trabajos Disponibles</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <JobFeedSkeleton count={2} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              Trabajos Disponibles
              {jobs.length > 0 && (
                <Badge variant="default" className="animate-pulse bg-primary">
                  {jobs.length} nuevo{jobs.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Oportunidades de trabajo cerca de ti
            </p>
          </div>
        </div>
        
        {jobs.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/provider-portal/available-jobs")}
          >
            Ver todos
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {jobs.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-muted-foreground"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Briefcase className="h-8 w-8 opacity-50" />
            </div>
            <p className="font-medium">No hay trabajos disponibles</p>
            <p className="text-sm">Te notificaremos cuando haya nuevas oportunidades</p>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sortedJobs.slice(0, 4).map((job, index) => (
              <JobCardMobile
                key={job.id}
                job={job}
                onAccept={onAcceptJob}
                isMatch={job.isMatch}
                index={index}
              />
            ))}
          </div>
        )}

        {jobs.length > 4 && (
          <div className="mt-4 text-center">
            <Button 
              variant="link"
              onClick={() => navigate("/provider-portal/available-jobs")}
              className="text-primary"
            >
              Ver {jobs.length - 4} trabajo{jobs.length - 4 !== 1 ? 's' : ''} más
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
