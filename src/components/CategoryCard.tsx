import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CategoryCardProps {
  icon: string;
  category: string;
  description: string;
  services: string[];
  gradient: string;
}

export const CategoryCard = ({ icon, category, description, services, gradient }: CategoryCardProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleServiceClick = (service: string) => {
    navigate('/book-job', {
      state: {
        category,
        service,
        description: `${service} - ${category}`
      }
    });
  };

  return (
    <Card className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-105 bg-gradient-card border-white/20 h-full">
      <CardHeader className="pb-4">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-glow text-3xl group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <CardTitle className="text-xl mb-2">{category}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between bg-background/50 hover:bg-background/80 border-border/50"
            >
              Ver servicios
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="center" 
            className="w-[280px] bg-card/95 backdrop-blur-sm border-border/50 shadow-raised z-50"
          >
            {services.map((service, index) => (
              <DropdownMenuItem
                key={index}
                onClick={() => handleServiceClick(service)}
                className="cursor-pointer hover:bg-accent/50 py-3 px-4"
              >
                {service}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
};
