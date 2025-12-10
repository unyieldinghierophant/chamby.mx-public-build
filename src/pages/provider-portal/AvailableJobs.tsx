import { useState } from "react";
import { useAvailableJobs } from "@/hooks/useAvailableJobs";
import { JobCardAvailable } from "@/components/provider-portal/JobCardAvailable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase } from "lucide-react";
import { JobCardSkeleton } from "@/components/skeletons";

const AvailableJobs = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { jobs, loading, acceptJob } = useAvailableJobs();

  // Filter by category
  const filteredJobs = categoryFilter === "all" 
    ? jobs 
    : jobs.filter(job => job.category === categoryFilter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trabajos Disponibles</h1>
          <p className="text-muted-foreground mt-1">
            {filteredJobs.length} trabajo{filteredJobs.length !== 1 ? 's' : ''} disponible{filteredJobs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="Handyman">Handyman</TabsTrigger>
          <TabsTrigger value="Electricidad">Electricidad</TabsTrigger>
          <TabsTrigger value="Plomería">Plomería</TabsTrigger>
          <TabsTrigger value="Pintura">Pintura</TabsTrigger>
          <TabsTrigger value="Jardinería">Jardinería</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <JobCardSkeleton key={i} style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No hay trabajos disponibles</h3>
          <p className="text-muted-foreground">
            {categoryFilter === "all" 
              ? "No hay trabajos nuevos en este momento" 
              : `No hay trabajos de ${categoryFilter} disponibles`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <JobCardAvailable
              key={job.id}
              job={job}
              onAccept={acceptJob}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableJobs;
