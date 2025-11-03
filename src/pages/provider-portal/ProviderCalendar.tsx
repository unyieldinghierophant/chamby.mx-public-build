import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, MapPin, User } from "lucide-react";

interface Job {
  id: string;
  title: string;
  scheduled_date: string;
  address: string;
  status: string;
  total_amount: number;
  customer: { full_name: string } | null;
}

const ProviderCalendar = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedDateJobs, setSelectedDateJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  useEffect(() => {
    if (date) {
      const dayJobs = jobs.filter((job) => {
        const jobDate = new Date(job.scheduled_date);
        return (
          jobDate.getDate() === date.getDate() &&
          jobDate.getMonth() === date.getMonth() &&
          jobDate.getFullYear() === date.getFullYear()
        );
      });
      setSelectedDateJobs(dayJobs);
    }
  }, [date, jobs]);

  const fetchJobs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          title,
          scheduled_date,
          address,
          status,
          total_amount,
          customer:profiles!bookings_customer_id_fkey(full_name)
        `)
        .eq("tasker_id", user.id)
        .in("status", ["pending", "confirmed", "in_progress"]);

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmado";
      case "pending":
        return "Pendiente";
      case "in_progress":
        return "En progreso";
      default:
        return status;
    }
  };

  const modifiers = {
    confirmed: jobs
      .filter((j) => j.status === "confirmed")
      .map((j) => new Date(j.scheduled_date)),
    pending: jobs
      .filter((j) => j.status === "pending")
      .map((j) => new Date(j.scheduled_date)),
    inProgress: jobs
      .filter((j) => j.status === "in_progress")
      .map((j) => new Date(j.scheduled_date)),
  };

  const modifiersStyles = {
    confirmed: { backgroundColor: "rgb(34 197 94 / 0.2)" },
    pending: { backgroundColor: "rgb(234 179 8 / 0.2)" },
    inProgress: { backgroundColor: "rgb(59 130 246 / 0.2)" },
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
        <h1 className="text-3xl font-bold text-foreground">Calendario</h1>
        <p className="text-muted-foreground">
          Gestiona tu agenda y disponibilidad
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tu Calendario</CardTitle>
            <div className="flex gap-4 text-sm mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500/40" />
                <span>Confirmado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                <span>Pendiente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500/40" />
                <span>En progreso</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {date ? format(date, "d 'de' MMMM", { locale: es }) : "Selecciona una fecha"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tienes trabajos programados para este día
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-3 border rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm">{job.title}</h4>
                      <Badge className={getStatusColor(job.status)}>
                        {getStatusText(job.status)}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(job.scheduled_date), "p", { locale: es })}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {job.customer?.full_name || "Cliente"}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.address || "Sin dirección"}
                      </div>
                    </div>
                    <div className="font-medium text-sm">
                      ${job.total_amount.toLocaleString("es-MX")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProviderCalendar;
