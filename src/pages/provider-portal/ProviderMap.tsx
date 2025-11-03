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
    }
  }, [user]);

  const fetchJobs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          title,
          address,
          status,
          scheduled_date,
          total_amount,
          customer:profiles!bookings_customer_id_fkey(full_name)
        `)
        .eq("tasker_id", user.id)
        .in("status", ["pending", "confirmed", "in_progress"])
        .not("address", "is", null);

      if (error) throw error;

      // For demo purposes, assign random coordinates near Guadalajara
      const jobsWithCoords = (data || []).map((job, index) => ({
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
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
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
            Ubicación de Trabajos
          </CardTitle>
          <div className="flex gap-4 text-sm mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Confirmado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>En progreso</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <LoadScript googleMapsApiKey="AIzaSyAsjwDHqMRXOW8lsFoMU9mTq6Yqy0O-YEg">
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
                      {selectedJob.status}
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
