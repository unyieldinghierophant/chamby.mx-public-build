import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useJobs } from '@/hooks/useJobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Clock, Star, User } from 'lucide-react';
import Header from '@/components/Header';
import { Link } from 'react-router-dom';

const JobListing = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { jobs, loading, error } = useJobs({
    search: searchQuery,
    category: selectedCategory,
    sortBy: 'created_at_desc'
  });

  const categories = ['Limpieza', 'Jardinería', 'Reparaciones', 'Cuidado Personal', 'Transporte', 'Otros'];

  return (
    <div className="min-h-screen bg-gradient-main bg-gradient-mesh">
      <Header />
      <div className="pt-20 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Encuentra el Servicio Perfecto
            </h1>
            <p className="text-muted-foreground">
              Conecta con profesionales calificados cerca de ti
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar servicios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/95 backdrop-blur-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('')}
              >
                Todos
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Job Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-card/95 backdrop-blur-sm shadow-raised animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="h-20 bg-muted rounded mb-4"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Error al cargar los servicios. Intenta de nuevo.</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron servicios disponibles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <Card key={job.id} className="bg-card/95 backdrop-blur-sm shadow-raised hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg mb-2">{job.title}</CardTitle>
                        <Badge variant="secondary">{job.category}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">${job.rate}</p>
                        <p className="text-sm text-muted-foreground">por hora</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {job.description}
                    </p>
                    
                    {job.provider && (
                      <div className="flex items-center mb-4 space-x-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {job.provider.email}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">5.0</span>
                        <span className="text-sm text-muted-foreground">(12)</span>
                      </div>
                      <Link to={`/booking/${job.id}`}>
                        <Button size="sm" className="bg-primary hover:bg-primary/90">
                          Contratar
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobListing;