import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryCardProps {
  image: string;
  category: string;
  description: string;
  services: string[];
}

export const CategoryCard = ({ image, category, description }: CategoryCardProps) => {
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
        <div className="w-24 h-24 mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <img src={image} alt={category} className="w-full h-full object-contain" />
        </div>
        <CardTitle className="text-xl mb-2">{category}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
    </Card>
  );
};
