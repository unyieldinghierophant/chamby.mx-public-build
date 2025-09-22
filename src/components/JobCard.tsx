import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Star, User } from "lucide-react";
import { Link } from "react-router-dom";

interface Job {
  id: string;
  title: string;
  description: string | null;
  category: string;
  rate: number;
  provider_id: string;
  status: string;
  created_at: string;
  provider?: {
    id: string;
    email: string;
    phone: string | null;
    role: string;
  };
}

interface JobCardProps {
  job: Job;
}

const JobCard = ({ job }: JobCardProps) => {
  const getProviderName = () => {
    if (job.provider?.email) {
      return job.provider.email.split('@')[0];
    }
    return 'Provider';
  };

  const getProviderInitials = () => {
    const name = getProviderName();
    return name.charAt(0).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <Card className="bg-background/60 backdrop-blur-sm border-border/50 hover:bg-background/80 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg line-clamp-2">{job.title}</CardTitle>
            <Badge variant="secondary" className="w-fit">
              {job.category}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              ${job.rate}
            </div>
            <div className="text-sm text-muted-foreground">por hora</div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getProviderInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Link 
              to={`/provider/${job.provider_id}`}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {getProviderName()}
            </Link>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Publicado {formatDate(job.created_at)}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      {job.description && (
        <CardContent className="pt-0">
          <CardDescription className="line-clamp-3 mb-4">
            {job.description}
          </CardDescription>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>4.8 (24)</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>Ciudad de México</span>
              </div>
            </div>

            <Link to={`/provider/${job.provider_id}`}>
              <Button variant="outline" size="sm">
                <User className="w-4 h-4 mr-2" />
                Ver Perfil
              </Button>
            </Link>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default JobCard;