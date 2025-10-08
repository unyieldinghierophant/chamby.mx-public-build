import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useProviderJobs } from "@/hooks/useJobs";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import JobForm from "@/components/JobForm";
import { ProfileTab } from "@/components/provider/ProfileTab";
import { ReviewsTab } from "@/components/provider/ReviewsTab";
import { InvoicesTab } from "@/components/provider/InvoicesTab";
import { RatingDisplay } from "@/components/provider/RatingDisplay";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Briefcase, 
  DollarSign, 
  Calendar,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  TrendingUp,
  Users,
  Clock,
  User,
  Star,
  FileText,
  Award
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const ProviderDashboard = () => {
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { jobs, loading, updateJob, deleteJob } = useProviderJobs();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [providerRating, setProviderRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);

  useEffect(() => {
    if (user) {
      fetchProviderRating();
    }
  }, [user]);

  const fetchProviderRating = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("rating, total_reviews")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProviderRating(data.rating || 0);
        setTotalReviews(data.total_reviews || 0);
      }
    } catch (error) {
      console.error("Error fetching provider rating:", error);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || role !== 'provider') {
    return <Navigate to="/auth/tasker" replace />;
  }

  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const result = await updateJob(jobId, { status: newStatus });
    
    if (result.error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del trabajo",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Estado actualizado",
        description: `El trabajo está ahora ${newStatus === 'active' ? 'activo' : 'inactivo'}`,
      });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este trabajo?')) {
      const result = await deleteJob(jobId);
      
      if (result.error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el trabajo",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Trabajo eliminado",
          description: "El trabajo ha sido eliminado exitosamente",
        });
      }
    }
  };

  const activeJobs = jobs.filter(job => job.status === 'active');
  const inactiveJobs = jobs.filter(job => job.status === 'inactive');
  const avgRate = jobs.length > 0 ? jobs.reduce((sum, job) => sum + job.rate, 0) / jobs.length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard del Proveedor</h1>
              <p className="text-muted-foreground">Gestiona tus servicios y revisa tu rendimiento</p>
            </div>
            {providerRating > 0 && (
              <div className="hidden md:block">
                <RatingDisplay rating={providerRating} totalReviews={totalReviews} size="lg" />
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-2 md:grid-cols-7 w-full bg-background/60 backdrop-blur-sm border border-border/50">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Resumen</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Mi Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span className="hidden sm:inline">Servicios</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span className="hidden sm:inline">Reseñas</span>
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Cotizaciones</span>
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Crear</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Analíticas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-background/60 backdrop-blur-sm border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Servicios Activos</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeJobs.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {inactiveJobs.length} inactivos
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background/60 backdrop-blur-sm border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Precio Promedio</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${avgRate.toFixed(0)}</div>
                    <p className="text-xs text-muted-foreground">
                      por hora
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background/60 backdrop-blur-sm border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reservas Totales</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      Próximamente
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background/60 backdrop-blur-sm border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tu Calificación</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      {providerRating > 0 ? (
                        <>
                          <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                          {providerRating.toFixed(1)}
                        </>
                      ) : (
                        <span className="text-muted-foreground text-base">Sin calificación</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {totalReviews} {totalReviews === 1 ? "reseña" : "reseñas"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Jobs */}
              <Card className="bg-background/60 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>Servicios Recientes</CardTitle>
                  <CardDescription>Tus últimos servicios publicados</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      <span className="text-muted-foreground">Cargando servicios...</span>
                    </div>
                  ) : jobs.length > 0 ? (
                    <div className="space-y-4">
                      {jobs.slice(0, 3).map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <h4 className="font-medium">{job.title}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">{job.category}</Badge>
                              <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                                {job.status === 'active' ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${job.rate}/hr</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(job.created_at).toLocaleDateString('es-MX')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No tienes servicios aún</h3>
                      <p className="text-muted-foreground mb-4">
                        Comienza creando tu primer servicio
                      </p>
                      <Button onClick={() => setActiveTab("create")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Servicio
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <ProfileTab />
            </TabsContent>

            <TabsContent value="jobs" className="space-y-6">
              <Card className="bg-background/60 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Mis Servicios ({jobs.length})
                    </span>
                    <Button onClick={() => setActiveTab("create")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Servicio
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Gestiona todos tus servicios publicados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      <span className="text-muted-foreground">Cargando servicios...</span>
                    </div>
                  ) : jobs.length > 0 ? (
                    <div className="space-y-4">
                      {jobs.map((job) => (
                        <div key={job.id} className="p-6 border rounded-lg space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold">{job.title}</h3>
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary">{job.category}</Badge>
                                <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                                  {job.status === 'active' ? 'Activo' : 'Inactivo'}
                                </Badge>
                              </div>
                              {job.description && (
                                <p className="text-muted-foreground text-sm line-clamp-2">
                                  {job.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-primary">${job.rate}</div>
                              <div className="text-sm text-muted-foreground">por hora</div>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>Creado {new Date(job.created_at).toLocaleDateString('es-MX')}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleJobStatus(job.id, job.status)}
                              >
                                {job.status === 'active' ? (
                                  <>
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Activar
                                  </>
                                )}
                              </Button>
                              
                              <Button variant="outline" size="sm">
                                <Edit3 className="w-4 h-4 mr-2" />
                                Editar
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteJob(job.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No tienes servicios aún</h3>
                      <p className="text-muted-foreground mb-6">
                        Comienza a ofrecer tus servicios creando tu primera publicación
                      </p>
                      <Button onClick={() => setActiveTab("create")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Crear mi primer servicio
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <ReviewsTab />
            </TabsContent>

            <TabsContent value="invoices" className="space-y-6">
              <InvoicesTab />
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              <JobForm onSuccess={() => setActiveTab("jobs")} />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card className="bg-background/60 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Analíticas y Rendimiento
                  </CardTitle>
                  <CardDescription>
                    Métricas detalladas de tus servicios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Analíticas Próximamente</h3>
                    <p className="text-muted-foreground">
                      Aquí podrás ver métricas detalladas sobre el rendimiento de tus servicios
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ProviderDashboard;