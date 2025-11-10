import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";

const blogPosts = [
  {
    id: 1,
    title: "Cómo elegir al profesional perfecto para tu hogar",
    excerpt: "Consejos prácticos para encontrar y contratar al mejor profesional para tus necesidades del hogar.",
    author: "Equipo Chamby",
    date: "15 de Enero, 2025",
    readTime: "5 min",
    category: "Consejos",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2,
    title: "Mantenimiento preventivo: Ahorra dinero a largo plazo",
    excerpt: "Descubre cómo el mantenimiento regular puede prevenir reparaciones costosas en el futuro.",
    author: "Equipo Chamby",
    date: "10 de Enero, 2025",
    readTime: "7 min",
    category: "Mantenimiento",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 3,
    title: "Tendencias en remodelación del hogar para 2025",
    excerpt: "Las últimas tendencias en diseño y remodelación que transformarán tu hogar este año.",
    author: "Equipo Chamby",
    date: "5 de Enero, 2025",
    readTime: "6 min",
    category: "Diseño",
    image: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 4,
    title: "Guía completa de limpieza profunda para tu hogar",
    excerpt: "Todo lo que necesitas saber para mantener tu hogar impecable durante todo el año.",
    author: "Equipo Chamby",
    date: "1 de Enero, 2025",
    readTime: "8 min",
    category: "Limpieza",
    image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 5,
    title: "Jardinería sostenible: Crea un jardín eco-amigable",
    excerpt: "Aprende técnicas de jardinería sostenible para un hogar más verde y ecológico.",
    author: "Equipo Chamby",
    date: "28 de Diciembre, 2024",
    readTime: "6 min",
    category: "Jardinería",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 6,
    title: "Reparaciones urgentes: Qué hacer en una emergencia",
    excerpt: "Guía rápida para manejar emergencias del hogar antes de que llegue el profesional.",
    author: "Equipo Chamby",
    date: "20 de Diciembre, 2024",
    readTime: "5 min",
    category: "Emergencias",
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80"
  }
];

const Blog = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al inicio</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Blog de Chamby
          </h1>
          <p className="text-xl text-muted-foreground">
            Consejos, guías y tendencias para el cuidado de tu hogar
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {blogPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="aspect-video overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{post.category}</Badge>
                </div>
                <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{post.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
