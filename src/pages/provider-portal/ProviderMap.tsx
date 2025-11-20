import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Job {
  id: string;
  title: string;
  address: string;
  status: string;
  scheduled_date: string;
  total_amount: number;
  customer: { full_name: string } | null;
  coordinates?: { lat: number; lng: number };
}

const ProviderMap = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  const mapCenter = { lat: 20.6597, lng: -103.3496 }; // Guadalajara

  useEffect(() => {
    if (user) {
      fetchJobs();

      // Subscribe to realtime changes for both bookings and jobs
      const bookingsChannel = supabase
        .channel('map-bookings-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings'
          },
          () => {
            fetchJobs();
          }
        )
        .subscribe();

      const jobsChannel = supabase
        .channel('map-jobs-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'jobs',
            filter: 'status=eq.active'
          },
          () => {
            fetchJobs();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(bookingsChannel);
        supabase.removeChannel(jobsChannel);
      };
    }
  }, [user]);

  const fetchJobs = async () => {
    if (!user) return;

    try {
      // Fetch assigned jobs
      const { data: assignedJobs, error: assignedError } = await supabase
        .from("jobs" as any)
        .select(`
          id,
          title,
          location,
          status,
          scheduled_at,
          total_amount,
          customer:profiles!jobs_customer_id_fkey(full_name)
        `)
        .eq("tasker_id", user.id)
        .in("status", ["pending", "confirmed", "in_progress"])
        .not("location", "is", null);

      // Fetch available jobs (not assigned yet)
      const { data: availableJobs, error: availableError } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          location,
          status,
          scheduled_at,
          total_amount,
          customer:profiles!jobs_customer_id_fkey(full_name)
        `)
        .is("tasker_id", null)
        .eq("status", "pending")
        .not("location", "is", null);

      // Fetch available job requests from jobs table
      const { data: jobRequests, error: jobRequestsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "active")
        .is("provider_id", null)
        .eq("visit_fee_paid", true)
        .not("location", "is", null);

      if (assignedError) throw assignedError;
      if (availableError) throw availableError;
      if (jobRequestsError) throw jobRequestsError;

      // Mark available jobs with a special status
      const markedAvailableJobs = (availableJobs || []).map(job => ({
        ...job,
        status: 'available',
        scheduled_date: job.scheduled_at,
        address: job.location || "Sin dirección"
      }));

      // Convert job requests to map format
      const formattedJobRequests = await Promise.all(
        (jobRequests || []).map(async (job) => {
          let customerName = null;
          if (job.client_id) {
            const { data: userData } = await supabase
              .from("users")
              .select("full_name")
              .eq("id", job.client_id)
              .single();
            customerName = userData?.full_name || null;
          }

          return {
            id: job.id,
            title: job.title,
            address: job.location,
            status: 'available',
            scheduled_date: job.scheduled_at || new Date().toISOString(),
            total_amount: job.rate,
            customer: { full_name: customerName }
          };
        })
      );

      const allJobs = [
        ...(assignedJobs || []).map((job: any) => ({
          ...job,
          scheduled_date: job.scheduled_at,
          address: job.location || "Sin dirección"
        })),
        ...markedAvailableJobs,
        ...formattedJobRequests
      ];

      // For demo purposes, assign random coordinates near Guadalajara
      const jobsWithCoords = allJobs.map((job, index) => ({
        ...job,
        coordinates: {
          lat: 20.6597 + (Math.random() - 0.5) * 0.1,
          lng: -103.3496 + (Math.random() - 0.5) * 0.1,
        },
      }));

      setJobs(jobsWithCoords);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
      case "pending":
        return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
      case "available":
        return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
      case "in_progress":
        return "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
      default:
        return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-700";
      case "pending":
        return "bg-yellow-500/10 text-yellow-700";
      case "available":
        return "bg-yellow-500/20 text-yellow-700 animate-pulse";
      case "in_progress":
        return "bg-blue-500/10 text-blue-700";
      default:
        return "bg-gray-500/10 text-gray-700";
    }
  };

  const handleNavigate = (job: Job) => {
    if (job.coordinates) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${job.coordinates.lat},${job.coordinates.lng}`;
      window.open(url, "_blank");
    }
  };
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="container mx-auto p-4 lg:p-6">
        <div className="p-8 text-center border border-destructive rounded-lg bg-destructive/10">
          <MapPin className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-semibold text-lg mb-2">
            Google Maps API key no configurado
          </p>
          <p className="text-sm text-muted-foreground">
            Por favor configura VITE_GOOGLE_MAPS_API_KEY en las variables de entorno para ver el mapa
          </p>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="container mx-auto p-4 lg:p-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mapa en Tiempo Real</h1>
          <p className="text-muted-foreground">
            Visualiza tus trabajos activos en el mapa
          </p>
        </div>
        <Card className="mt-6">
          <CardContent className="p-12 text-center">
            <MapPin className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay trabajos activos</h3>
            <p className="text-muted-foreground">
              Cuando tengas trabajos asignados, aparecerán aquí en el mapa
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mapa en Tiempo Real</h1>
        <p className="text-muted-foreground">
          Visualiza tus trabajos activos en el mapa
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación de Trabajos ({jobs.length})
          </CardTitle>
          <div className="flex flex-wrap gap-4 text-sm mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Confirmado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
              <span>Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>En progreso</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "500px" }}
              center={mapCenter}
              zoom={12}
            >
              {jobs.map((job) =>
                job.coordinates ? (
                  <Marker
                    key={job.id}
                    position={job.coordinates}
                    icon={getMarkerColor(job.status)}
                    onClick={() => setSelectedJob(job)}
                    animation={job.status === 'available' ? window.google?.maps.Animation.BOUNCE : undefined}
                  />
                ) : null
              )}

              {selectedJob && selectedJob.coordinates && (
                <InfoWindow
                  position={selectedJob.coordinates}
                  onCloseClick={() => setSelectedJob(null)}
                >
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-medium mb-2">{selectedJob.title}</h3>
                    <Badge className={getStatusColor(selectedJob.status)}>
                      {selectedJob.status === 'available' ? 'Disponible' : selectedJob.status}
                    </Badge>
                    <p className="text-sm mt-2">
                      Cliente: {selectedJob.customer?.full_name || "Cliente"}
                    </p>
                    <p className="text-sm">{selectedJob.address}</p>
                    <p className="font-medium mt-2">
                      ${selectedJob.total_amount.toLocaleString("es-MX")}
                    </p>
                    <Button
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => handleNavigate(selectedJob)}
                    >
                      <Navigation className="mr-2 h-4 w-4" />
                      Iniciar Ruta
                    </Button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderMap;
