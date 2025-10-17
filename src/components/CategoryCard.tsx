import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryCardProps {
  icon: string;
  category: string;
  description: string;
  services: string[];
  gradient: string;
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
      <CardHeader className="pb-6">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-glow text-3xl group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <CardTitle className="text-xl mb-2">{category}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
    </Card>
  );
};
