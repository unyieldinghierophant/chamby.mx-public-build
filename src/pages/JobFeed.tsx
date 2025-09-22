import { useState } from "react";
import { useJobs } from "@/hooks/useJobs";
import Header from "@/components/Header";
import JobCard from "@/components/JobCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, SortAsc, Briefcase, Loader2 } from "lucide-react";

const JOB_CATEGORIES = [
  "Limpieza",
  "Plomería", 
  "Electricidad",
  "Carpintería",
  "Jardinería",
  "Pintura",
  "Mudanzas",
  "Reparaciones",
  "Montaje",
  "Otros"
];

const JobFeed = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState<'rate_asc' | 'rate_desc' | 'created_at_desc' | 'created_at_asc'>('created_at_desc');
  
  const { jobs, loading, error } = useJobs({
    search,
    category,
    sortBy
  });

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setSortBy('created_at_desc');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Encuentra el Servicio Perfecto
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explora miles de profesionales verificados listos para ayudarte con cualquier tarea
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="bg-background/60 backdrop-blur-sm border-border/50 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Buscar Servicios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Buscar por palabra clave..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SortAsc className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at_desc">Más recientes</SelectItem>
                    <SelectItem value="created_at_asc">Más antiguos</SelectItem>
                    <SelectItem value="rate_asc">Precio: menor a mayor</SelectItem>
                    <SelectItem value="rate_desc">Precio: mayor a menor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(search || category) && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {search && `Buscando: "${search}"`}
                    {search && category && " • "}
                    {category && `Categoría: ${category}`}
                  </div>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Briefcase className="w-6 h-6" />
                Servicios Disponibles
              </h2>
              {!loading && (
                <div className="text-muted-foreground">
                  {jobs.length} {jobs.length === 1 ? 'servicio encontrado' : 'servicios encontrados'}
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mr-2" />
              <span className="text-muted-foreground">Cargando servicios...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="bg-destructive/10 border-destructive/20">
              <CardContent className="pt-6">
                <p className="text-destructive text-center">
                  Error al cargar los servicios: {error}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Jobs Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))
              ) : (
                <div className="col-span-full">
                  <Card className="bg-background/60 backdrop-blur-sm border-border/50">
                    <CardContent className="pt-6 text-center py-12">
                      <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No se encontraron servicios</h3>
                      <p className="text-muted-foreground mb-4">
                        {search || category 
                          ? "Intenta ajustar tus filtros de búsqueda"
                          : "Aún no hay servicios publicados"
                        }
                      </p>
                      {(search || category) && (
                        <Button variant="outline" onClick={clearFilters}>
                          Ver todos los servicios
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default JobFeed;