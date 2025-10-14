import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useJobs } from "@/hooks/useJobs";
import MobileBottomNav from "@/components/MobileBottomNav";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModernButton } from "@/components/ui/modern-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Star, 
  X, 
  RotateCcw, 
  MessageSquare, 
  AlertTriangle,
  ChevronRight 
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const MobileJobs = () => {
  const { user } = useAuth();
  const { jobs, loading } = useJobs();
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Mock job data since we don't have real bookings yet
  const mockJobs = [
    {
      id: 1,
      service: "Limpieza del hogar",
      provider: {
        name: "María González",
        photo: "/placeholder.svg",
        rating: 4.9
      },
      scheduledDate: new Date("2024-01-15T10:00:00"),
      status: "scheduled",
      address: "Av. Insurgentes 123, Roma Norte",
      price: 350,
      category: "upcoming"
    },
    {
      id: 2,
      service: "Reparación de plomería",
      provider: {
        name: "Carlos Hernández",
        photo: "/placeholder.svg",
        rating: 4.8
      },
      scheduledDate: new Date("2024-01-12T14:00:00"),
      status: "in_progress",
      address: "Calle Madero 456, Centro",
      price: 450,
      category: "in_progress"
    },
    {
      id: 3,
      service: "Jardinería",
      provider: {
        name: "Ana Martínez",
        photo: "/placeholder.svg",
        rating: 4.7
      },
      scheduledDate: new Date("2024-01-08T09:00:00"),
      status: "completed",
      address: "Colonia del Valle 789",
      price: 320,
      category: "past"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "scheduled": return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress": return "bg-green-100 text-green-800 border-green-200";
      case "completed": return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Pendiente";
      case "scheduled": return "Programado";
      case "in_progress": return "En Progreso";
      case "completed": return "Completado";
      case "cancelled": return "Cancelado";
      default: return "Desconocido";
    }
  };

  const getCategoryJobs = (category: string) => {
    return mockJobs.filter(job => {
      switch (category) {
        case "upcoming":
          return job.status === "pending" || job.status === "scheduled";
        case "in_progress":
          return job.status === "in_progress";
        case "past":
          return job.status === "completed" || job.status === "cancelled";
        default:
          return false;
      }
    });
  };

  const JobCard = ({ job }: { job: any }) => (
    <Card className="bg-gradient-card shadow-raised border-0 mb-4">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-12 w-12 border-2 border-white/50">
            <AvatarImage src={job.provider.photo} />
            <AvatarFallback>{job.provider.name.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm truncate">
                  {job.service}
                </h3>
                <p className="text-muted-foreground text-xs truncate">
                  {job.provider.name}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span className="text-xs text-muted-foreground">{job.provider.rating}</span>
                </div>
              </div>
              <Badge className={`${getStatusColor(job.status)} text-xs`}>
                {getStatusText(job.status)}
              </Badge>
            </div>
            
            <div className="space-y-1 mb-3">
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{format(job.scheduledDate, "d MMM yyyy", { locale: es })}</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{format(job.scheduledDate, "HH:mm")}</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{job.address}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary">${job.price}</span>
              <div className="flex space-x-2">
                {job.status === "scheduled" && (
                  <>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                      <X className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reprogramar
                    </Button>
                  </>
                )}
                {job.status === "completed" && (
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Reseña
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-xs"
                  onClick={() => setSelectedJob(job)}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center pb-20">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold mb-4">Inicia sesión para ver tus trabajos</h2>
          <ModernButton variant="primary" onClick={() => window.location.href = "/auth"}>
            Iniciar Sesión
          </ModernButton>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-main pb-20 pt-32">
        {/* Header */}
        <div className="bg-gradient-glass backdrop-blur-glass border-b border-white/20 sticky top-32 z-40">
          <div className="p-4">
            <h1 className="text-xl font-bold text-foreground">Mis Trabajos</h1>
          </div>
        </div>

      {/* Content */}
      <div className="p-4">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gradient-glass backdrop-blur-glass">
            <TabsTrigger value="upcoming" className="text-xs">Próximos</TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs">En Progreso</TabsTrigger>
            <TabsTrigger value="past" className="text-xs">Pasados</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 space-y-4">
            <TabsContent value="upcoming" className="mt-0">
              {getCategoryJobs("upcoming").length > 0 ? (
                getCategoryJobs("upcoming").map((job) => (
                  <JobCard key={job.id} job={job} />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tienes trabajos próximos</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="in_progress" className="mt-0">
              {getCategoryJobs("in_progress").length > 0 ? (
                getCategoryJobs("in_progress").map((job) => (
                  <JobCard key={job.id} job={job} />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tienes trabajos en progreso</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="past" className="mt-0">
              {getCategoryJobs("past").length > 0 ? (
                getCategoryJobs("past").map((job) => (
                  <JobCard key={job.id} job={job} />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tienes trabajos pasados</p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <Card className="w-full bg-gradient-card rounded-t-2xl border-0 max-h-[80vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{selectedJob.service}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedJob(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedJob.provider.photo} />
                  <AvatarFallback>{selectedJob.provider.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedJob.provider.name}</h3>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span>{selectedJob.provider.rating}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(selectedJob.scheduledDate, "d MMMM yyyy", { locale: es })}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{format(selectedJob.scheduledDate, "HH:mm")}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedJob.address}</span>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold">Total:</span>
                  <span className="text-xl font-bold text-primary">${selectedJob.price}</span>
                </div>
                
                <div className="space-y-2">
                  <ModernButton variant="outline" className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contactar Proveedor
                  </ModernButton>
                  <ModernButton variant="outline" className="w-full">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Abrir Disputa
                  </ModernButton>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <MobileBottomNav />
    </div>
    </>
  );
};

export default MobileJobs;