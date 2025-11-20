import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, MapPin, User, Filter, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedDateJobs, setSelectedDateJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchJobs();

      // Subscribe to realtime changes for both bookings and jobs
      const bookingsChannel = supabase
        .channel('calendar-bookings-changes')
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
        .channel('calendar-jobs-changes')
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
  }, [user, currentMonth]);

  useEffect(() => {
    if (date) {
      const dayJobs = jobs.filter((job) => {
        const jobDate = new Date(job.scheduled_date);
        return isSameDay(jobDate, date);
      });
      setSelectedDateJobs(dayJobs);
    }
  }, [date, jobs]);

  const fetchJobs = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      // Fetch assigned jobs
      const { data: assignedJobs, error: assignedError } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          scheduled_at,
          location,
          status,
          total_amount,
          customer:profiles!jobs_customer_id_fkey(full_name)
        `)
        .eq("tasker_id", user.id)
        .in("status", ["pending", "confirmed", "in_progress"])
        .gte("scheduled_at", monthStart.toISOString())
        .lte("scheduled_at", monthEnd.toISOString());

      // Fetch available jobs (not assigned yet)
      const { data: availableJobs, error: availableError } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          scheduled_at,
          location,
          status,
          total_amount,
          customer:profiles!jobs_customer_id_fkey(full_name)
        `)
        .is("tasker_id", null)
        .eq("status", "pending")
        .gte("scheduled_at", monthStart.toISOString())
        .lte("scheduled_at", monthEnd.toISOString());

      // Fetch available job requests from jobs table
      const { data: jobRequests, error: jobRequestsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "active")
        .is("provider_id", null)
        .eq("visit_fee_paid", true)
        .not("scheduled_at", "is", null)
        .gte("scheduled_at", monthStart.toISOString())
        .lte("scheduled_at", monthEnd.toISOString());

      if (assignedError) throw assignedError;
      if (availableError) throw availableError;
      if (jobRequestsError) throw jobRequestsError;

      // Mark available jobs with a special status
      const markedAvailableJobs = (availableJobs || []).map(job => ({
        ...job,
        scheduled_date: job.scheduled_at,
        address: job.location || "Sin dirección",
        status: 'available'
      }));

      // Convert job requests to calendar format
      const formattedJobRequests = await Promise.all(
        (jobRequests || []).map(async (job) => {
          let customerName = null;
          if (job.client_id) {
            const { data: clientData } = await supabase
              .from("clients")
              .select("email")
              .eq("id", job.client_id)
              .single();
            customerName = clientData?.email || null;
          }

          return {
            id: job.id,
            title: job.title,
            scheduled_date: job.scheduled_at,
            address: job.location || "Sin dirección",
            status: 'available',
            total_amount: job.rate,
            customer: { full_name: customerName }
          };
        })
      );

      setJobs([
        ...(assignedJobs || []).map((job: any) => ({
          ...job,
          scheduled_date: job.scheduled_at,
          address: job.location || "Sin dirección"
        })),
        ...markedAvailableJobs,
        ...formattedJobRequests
      ]);
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
      case "available":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 animate-pulse";
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
      case "available":
        return "Disponible";
      case "in_progress":
        return "En progreso";
      default:
        return status;
    }
  };

  const getDayJobsCount = (day: Date) => {
    return jobs.filter(job => isSameDay(new Date(job.scheduled_date), day)).length;
  };

  const filteredJobs = statusFilter === "all" 
    ? jobs 
    : jobs.filter(j => j.status === statusFilter);

  const jobCounts = {
    all: jobs.length,
    pending: jobs.filter(j => j.status === "pending").length,
    confirmed: jobs.filter(j => j.status === "confirmed").length,
    in_progress: jobs.filter(j => j.status === "in_progress").length,
  };

  const modifiers = {
    confirmed: jobs
      .filter((j) => j.status === "confirmed")
      .map((j) => new Date(j.scheduled_date)),
    pending: jobs
      .filter((j) => j.status === "pending")
      .map((j) => new Date(j.scheduled_date)),
    available: jobs
      .filter((j) => j.status === "available")
      .map((j) => new Date(j.scheduled_date)),
    inProgress: jobs
      .filter((j) => j.status === "in_progress")
      .map((j) => new Date(j.scheduled_date)),
  };

  const modifiersClassNames = {
    confirmed: "bg-green-500/20 text-green-900 font-semibold hover:bg-green-500/30",
    pending: "bg-yellow-500/20 text-yellow-900 font-semibold hover:bg-yellow-500/30",
    available: "bg-yellow-500/30 text-yellow-900 font-bold hover:bg-yellow-500/40 animate-pulse",
    inProgress: "bg-blue-500/20 text-blue-900 font-semibold hover:bg-blue-500/30",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Calendario</h1>
        <p className="text-muted-foreground">
          Gestiona tu agenda y disponibilidad
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Sidebar - Filters & Stats */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button
                variant={statusFilter === "all" ? "default" : "ghost"}
                className="w-full justify-between"
                onClick={() => setStatusFilter("all")}
              >
                <span>Todos</span>
                <Badge variant="secondary">{jobCounts.all}</Badge>
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "ghost"}
                className="w-full justify-between"
                onClick={() => setStatusFilter("pending")}
              >
                <span>Pendiente</span>
                <Badge variant="secondary">{jobCounts.pending}</Badge>
              </Button>
              <Button
                variant={statusFilter === "confirmed" ? "default" : "ghost"}
                className="w-full justify-between"
                onClick={() => setStatusFilter("confirmed")}
              >
                <span>Confirmado</span>
                <Badge variant="secondary">{jobCounts.confirmed}</Badge>
              </Button>
              <Button
                variant={statusFilter === "in_progress" ? "default" : "ghost"}
                className="w-full justify-between"
                onClick={() => setStatusFilter("in_progress")}
              >
                <span>En progreso</span>
                <Badge variant="secondary">{jobCounts.in_progress}</Badge>
              </Button>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3">Leyenda</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500/40" />
                  <span>Confirmado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500/40" />
                  <span>Pendiente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500/60 animate-pulse" />
                  <span>Disponible (no asignado)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500/40" />
                  <span>En progreso</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Este mes</h4>
              <p className="text-2xl font-bold">{filteredJobs.length}</p>
              <p className="text-xs text-muted-foreground">trabajos programados</p>
            </div>
          </CardContent>
        </Card>

        {/* Main Calendar */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {format(currentMonth, "MMMM yyyy", { locale: es })}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentMonth(new Date());
                    setDate(new Date());
                  }}
                >
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md border-0 w-full"
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              components={{
                DayContent: ({ date: dayDate }) => {
                  const count = getDayJobsCount(dayDate);
                  return (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <span>{format(dayDate, "d")}</span>
                      {count > 0 && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -bottom-1 text-[10px] h-4 min-w-4 px-1"
                        >
                          {count}
                        </Badge>
                      )}
                    </div>
                  );
                },
              }}
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4 w-full",
                caption: "flex justify-center pt-1 relative items-center hidden",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md w-full font-semibold text-sm flex-1",
                row: "flex w-full mt-2",
                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1 h-24",
                day: "h-full w-full p-2 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground border-2 border-primary",
                day_today: "bg-accent text-accent-foreground font-bold",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          </CardContent>
        </Card>

        {/* Right Panel - Selected Day Details */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">
              {date ? format(date, "EEEE, d 'de' MMMM", { locale: es }) : "Selecciona una fecha"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              {selectedDateJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm text-muted-foreground">
                    No hay trabajos programados para este día
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateJobs
                    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
                    .map((job) => (
                      <Card key={job.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm leading-tight mb-1">
                                {job.title}
                              </h4>
                              <div className="flex items-center gap-1 text-lg font-bold text-primary">
                                <Clock className="h-4 w-4" />
                                {format(new Date(job.scheduled_date), "HH:mm")}
                              </div>
                            </div>
                            <Badge className={getStatusColor(job.status)}>
                              {getStatusText(job.status)}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{job.customer?.full_name || "Cliente"}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{job.address || "Sin dirección"}</span>
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t flex items-center justify-between">
                            <span className="font-semibold text-sm">
                              ${job.total_amount.toLocaleString("es-MX")}
                            </span>
                            <Button variant="outline" size="sm">
                              Ver detalles
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProviderCalendar;
