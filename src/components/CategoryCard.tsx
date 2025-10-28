import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface CategoryCardProps {
  icon: LucideIcon;
  category: string;
  description: string;
  services: string[];
}

export const CategoryCard = ({ icon: Icon, category, description }: CategoryCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate('/book-job', {
      state: {
        category
      }
    });
  };

  return (
    <Card 
      onClick={handleCardClick}
      className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-105 bg-gradient-card border-white/20 h-full"
    >
      <CardHeader className="pb-6">
        <div className="w-16 h-16 rounded-2xl bg-background/50 backdrop-blur-sm border border-border flex items-center justify-center mb-4 group-hover:bg-background/80 transition-all">
          <Icon className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>
        <CardTitle className="text-xl mb-2">{category}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
    </Card>
  );
};
