import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { Icon3D } from '@/components/Icon3D';

interface CategoryCardProps {
  icon: LucideIcon;
  category: string;
  description: string;
  services: string[];
  gradient?: string;
}

export const CategoryCard = ({ icon, category, description, gradient }: CategoryCardProps) => {
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
      <CardHeader className="pb-6 flex flex-col items-center text-center">
        <Icon3D icon={icon} gradient={gradient} size="md" className="mb-4" />
        <CardTitle className="text-xl mb-2">{category}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
    </Card>
  );
};
