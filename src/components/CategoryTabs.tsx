import { useState } from 'react';
import { categoryServicesMap } from '@/data/categoryServices';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import categoryHandyman from '@/assets/category-handyman.png';
import categoryElectrician from '@/assets/category-electrician.png';
import categoryPlumbing from '@/assets/category-plumbing.png';
import categoryAuto from '@/assets/category-auto.png';

interface Category {
  id: string;
  name: string;
  icon: string;
  dataKey: string;
}

const categories: Category[] = [
  { id: 'handyman', name: 'Handyman', icon: categoryHandyman, dataKey: 'Handyman' },
  { id: 'electrician', name: 'Electricidad', icon: categoryElectrician, dataKey: 'Electricidad' },
  { id: 'plumbing', name: 'Fontanería', icon: categoryPlumbing, dataKey: 'Fontanería' },
  { id: 'auto', name: 'Auto y Lavado', icon: categoryAuto, dataKey: 'Auto y Lavado' },
];

export const CategoryTabs = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0].id);
  const navigate = useNavigate();

  const currentCategory = categories.find(cat => cat.id === selectedCategory);
  const services = currentCategory ? categoryServicesMap[currentCategory.dataKey] || [] : [];

  const handleServiceClick = (serviceName: string, description: string) => {
    // Clear any saved form data to start fresh
    localStorage.removeItem('job_booking_form');
    
    // Navigate to booking with pre-selected service and description
    navigate(`/book-job?service=${encodeURIComponent(serviceName)}&description=${encodeURIComponent(description)}`);
  };

  return (
    <div className="w-[96%] md:w-[98%] mx-auto">
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        {/* Category Tabs */}
        <TabsList className="w-full h-auto bg-background/50 backdrop-blur-sm p-4 rounded-2xl grid grid-cols-4 gap-4">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="flex flex-col items-center gap-4 p-5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-xl transition-all h-auto"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                <img 
                  src={category.icon} 
                  alt={category.name} 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-base md:text-lg font-medium whitespace-nowrap">
                {category.name}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Service Pills for Each Category */}
        {categories.map((category) => (
          <TabsContent 
            key={category.id} 
            value={category.id}
            className="mt-10 animate-in fade-in-50 duration-300"
          >
            <div className="flex flex-wrap gap-4 justify-center pb-7">
              {services.map((service) => (
                <Button
                  key={service.name}
                  onClick={() => handleServiceClick(service.name, service.description)}
                  variant="outline"
                  className="rounded-full px-7 py-4 h-auto text-base md:text-lg bg-background/50 backdrop-blur-sm hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
                >
                  {service.name}
                </Button>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
