import { useState } from 'react';
import { categoryServicesMap } from '@/data/categoryServices';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import categoryHandyman from '@/assets/category-handyman.png';
import categoryElectrician from '@/assets/category-electrician.png';
import categoryPlumbing from '@/assets/category-plumbing.png';
import categoryAuto from '@/assets/category-auto.png';
import medchargeIcon from '@/assets/medcharge-icon.png';
import handymanHero from '@/assets/category-handyman-hero.jpg';
import electricianHero from '@/assets/category-electrician-hero.jpg';
import plumbingHero from '@/assets/category-plumbing-hero.jpg';
import autoHero from '@/assets/category-auto-hero.jpg';
import medusaHero from '@/assets/category-medusa-hero.png';

interface Category {
  id: string;
  name: string;
  icon: string;
  dataKey: string;
  heroImage: string;
}

const categories: Category[] = [
  { id: 'handyman', name: 'Handyman', icon: categoryHandyman, dataKey: 'Handyman', heroImage: handymanHero },
  { id: 'electrician', name: 'Electricidad', icon: categoryElectrician, dataKey: 'Electricidad', heroImage: electricianHero },
  { id: 'plumbing', name: 'Fontanería', icon: categoryPlumbing, dataKey: 'Fontanería', heroImage: plumbingHero },
  { id: 'auto', name: 'Auto y Lavado', icon: categoryAuto, dataKey: 'Auto y Lavado', heroImage: autoHero },
  { id: 'medusa', name: 'Medusa Energy', icon: medchargeIcon, dataKey: 'Medusa Energy', heroImage: medusaHero },
];

export const CategoryTabs = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0].id);
  const navigate = useNavigate();

  const currentCategory = categories.find(cat => cat.id === selectedCategory);
  const services = currentCategory ? categoryServicesMap[currentCategory.dataKey] || [] : [];

  const handleServiceClick = (serviceName: string, description: string) => {
    // Clear any saved form data to start fresh
    localStorage.removeItem('chamby_form_job-booking');
    sessionStorage.removeItem('chamby_form_job-booking');
    
    // Navigate to booking with force-new flag to ensure fresh form
    navigate(`/book-job?new=${Date.now()}`, {
      state: {
        category: currentCategory?.dataKey || 'General',
        service: serviceName,
        description: description,
        forceNew: true // Flag to force fresh form
      }
    });
  };

  return (
    <div className="w-full mx-auto">
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        {/* Category Tabs - Horizontal scroll on mobile, grid on desktop */}
        <div className="w-full overflow-x-auto md:overflow-visible scrollbar-hide">
          <TabsList className="w-max md:w-full h-auto bg-background/50 backdrop-blur-sm p-3 md:p-4 rounded-2xl flex md:grid md:grid-cols-5 gap-3 md:gap-4">
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex flex-col items-center gap-2 md:gap-4 p-3 md:p-5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-xl transition-all duration-300 h-auto min-w-[90px] md:min-w-0 hover:scale-105"
              >
                <div className="w-14 h-14 md:w-24 md:h-24 flex items-center justify-center transition-transform duration-300">
                  <img 
                    src={category.icon} 
                    alt={category.name} 
                    className="w-full h-full object-contain transition-transform duration-300 group-data-[state=active]:scale-110"
                  />
                </div>
                <span className="text-sm md:text-lg font-medium whitespace-nowrap">
                  {category.name}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Service Pills for Each Category */}
        {categories.map((category) => (
          <TabsContent 
            key={category.id} 
            value={category.id}
            className="mt-8 animate-fade-in"
          >
            {/* Service pills - wrapping layout */}
            <div className="flex flex-wrap gap-2 md:gap-3 mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              {services.map((service) => (
                <Button
                  key={service.name}
                  onClick={() => handleServiceClick(service.name, service.description)}
                  variant="outline"
                  className="rounded-full px-4 py-2 md:px-5 md:py-2.5 h-auto text-sm md:text-base bg-background/50 backdrop-blur-sm hover:bg-primary/10 hover:text-primary hover:border-primary transition-all duration-300 hover:scale-105"
                >
                  {service.name}
                </Button>
              ))}
            </div>
            
            {/* Hero Image Container with Overlay Card */}
            <div className="relative rounded-2xl overflow-hidden bg-blue-50 p-4 md:p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="relative">
                {/* Hero Image */}
                <img 
                  src={category.heroImage} 
                  alt={category.name}
                  className="w-full h-[300px] md:h-[400px] object-cover rounded-xl"
                />
                
                {/* White Card Overlay - positioned on left side */}
                <div className="absolute top-4 left-4 md:top-8 md:left-8 bg-white rounded-xl p-4 md:p-6 shadow-lg max-w-[280px] md:max-w-[350px]">
                  {/* Category Title */}
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                    {category.name}
                  </h3>
                  
                  {/* Benefits with checkmarks */}
                  <div className="space-y-3">
                    {category.id === 'handyman' && (
                      <>
                        <p className="text-sm md:text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span>Monta de forma segura tu TV, estantes, arte, espejos, y más.</span>
                        </p>
                        <p className="text-sm md:text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span><strong>Ahora en tendencia:</strong> Paredes galería, TVs artísticos, y estanterías envolventes.</span>
                        </p>
                      </>
                    )}
                    {category.id === 'electrician' && (
                      <>
                        <p className="text-sm md:text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span>Instalaciones eléctricas seguras y certificadas por profesionales.</span>
                        </p>
                        <p className="text-sm md:text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span><strong>Ahora en tendencia:</strong> Iluminación LED inteligente y paneles solares.</span>
                        </p>
                      </>
                    )}
                    {category.id === 'plumbing' && (
                      <>
                        <p className="text-sm md:text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span>Reparaciones rápidas de fugas, tuberías, y sistemas de agua.</span>
                        </p>
                        <p className="text-sm md:text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span><strong>Ahora en tendencia:</strong> Grifería moderna y sistemas de ahorro de agua.</span>
                        </p>
                      </>
                    )}
                    {category.id === 'auto' && (
                      <>
                        <p className="text-sm md:text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span>Lavado profesional de auto a domicilio, sin complicaciones.</span>
                        </p>
                        <p className="text-sm md:text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span><strong>Ahora en tendencia:</strong> Detallado ecológico y protección cerámica.</span>
                        </p>
                      </>
                    )}
                    {category.id === 'medusa' && (
                      <>
                        <p className="text-sm md:text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span>Instalación profesional de cargadores para vehículos eléctricos.</span>
                        </p>
                        <p className="text-sm md:text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span><strong>Ahora en tendencia:</strong> Energía solar residencial y sistemas de almacenamiento.</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
