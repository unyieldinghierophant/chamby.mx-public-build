import { useState } from "react";
import { useAvailableJobs } from "@/hooks/useAvailableJobs";
import { useNotifications } from "@/hooks/useNotifications";
import { JobRequestCard } from "@/components/provider-portal/JobRequestCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Loader2 } from "lucide-react";

const AvailableJobs = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { jobs, loading, acceptJob } = useAvailableJobs();
  const { notifications, markAsRead } = useNotifications();

  // Filtrar notificaciones de trabajos nuevos no leídas
  const jobNotifications = notifications.filter(
    (n) => n.type === "new_job_available" && !n.read
  );

  // Filtrar por categoría
  const filteredNotifications = categoryFilter === "all" 
    ? jobNotifications 
    : jobNotifications.filter(n => {
        const jobData = n.data as { category?: string };
        return jobData.category === categoryFilter;
      });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trabajos Disponibles</h1>
          <p className="text-muted-foreground mt-1">
            {filteredNotifications.length} trabajo{filteredNotifications.length !== 1 ? 's' : ''} disponible{filteredNotifications.length !== 1 ? 's' : ''}
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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredNotifications.length === 0 ? (
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
          {filteredNotifications.map((notification) => (
            <JobRequestCard
              key={notification.id}
              notification={notification}
              onAccept={acceptJob}
              onReject={markAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableJobs;
