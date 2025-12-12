import { useState } from 'react';
import { categoryServicesMap } from '@/data/categoryServices';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
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
    localStorage.removeItem('chamby_form_job-booking');
    sessionStorage.removeItem('chamby_form_job-booking');
    
    navigate(`/book-job?new=${Date.now()}`, {
      state: {
        category: currentCategory?.dataKey || 'General',
        service: serviceName,
        description: description,
        forceNew: true
      }
    });
  };

  return (
    <div className="w-full mx-auto">
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        {/* Mobile: Carousel | Desktop: Grid */}
        <div className="md:hidden">
          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {categories.map((category) => (
                <CarouselItem key={category.id} className="pl-2 basis-1/3">
                  <TabsList className="w-full h-auto bg-transparent p-0">
                    <TabsTrigger
                      value={category.id}
                      className="w-full flex flex-col items-center gap-1.5 p-2 data-[state=active]:bg-primary/15 data-[state=active]:text-primary rounded-xl transition-all duration-200 h-auto"
                    >
                      <div className="w-10 h-10 flex items-center justify-center">
                        <img
                          src={category.icon}
                          alt={category.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[10px] font-medium text-center leading-tight">
                        {category.id === "electrician"
                          ? "Luz"
                          : category.id === "plumbing"
                          ? "Agua"
                          : category.id === "auto"
                          ? "Auto"
                          : category.id === "medusa"
                          ? "Medusa"
                          : category.name}
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Desktop: Grid layout */}
        <TabsList className="hidden md:grid w-full h-auto bg-card/80 backdrop-blur-sm p-4 rounded-2xl grid-cols-5 gap-4">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="flex flex-col items-center gap-3 p-4 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-md rounded-xl transition-all duration-300 h-auto"
            >
              <div className="w-16 h-16 flex items-center justify-center">
                <img
                  src={category.icon}
                  alt={category.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-sm font-medium text-center">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Service Pills */}
        {categories.map((category) => (
          <TabsContent 
            key={category.id} 
            value={category.id}
            className="mt-4 md:mt-8 animate-fade-in"
          >
            <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4 md:mb-6">
              {services.map((service) => (
                <Button
                  key={service.name}
                  onClick={() => handleServiceClick(service.name, service.description)}
                  variant="outline"
                  className="rounded-full px-2.5 py-1 md:px-4 md:py-2 h-auto text-[11px] md:text-sm bg-background/50 backdrop-blur-sm hover:bg-primary/10 hover:text-primary hover:border-primary transition-all duration-200"
                >
                  {service.name}
                </Button>
              ))}
            </div>
            
            {/* Hero Image Container with Responsive Text */}
            <div className="rounded-2xl overflow-hidden bg-blue-50 p-4 md:p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
              
              {/* Mobile: Text ABOVE image (hidden on desktop) */}
              <div className="md:hidden mb-4 text-left">
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {category.name}
                </h3>
                <div className="space-y-2">
                  {category.id === 'handyman' && (
                    <>
                      <p className="text-sm flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary text-lg">✓</span>
                        <span>Monta de forma segura tu TV, estantes, arte, espejos, y más.</span>
                      </p>
                      <p className="text-sm flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary text-lg">✓</span>
                        <span><strong className="text-foreground">Ahora en tendencia:</strong> Paredes galería, TVs artísticos, y estanterías envolventes.</span>
                      </p>
                    </>
                  )}
                  {category.id === 'electrician' && (
                    <>
                      <p className="text-sm flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary text-lg">✓</span>
                        <span>Instalaciones eléctricas seguras y certificadas por profesionales.</span>
                      </p>
                      <p className="text-sm flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary text-lg">✓</span>
                        <span><strong className="text-foreground">Ahora en tendencia:</strong> Iluminación LED inteligente y paneles solares.</span>
                      </p>
                    </>
                  )}
                  {category.id === 'plumbing' && (
                    <>
                      <p className="text-sm flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary text-lg">✓</span>
                        <span>Reparaciones rápidas de fugas, tuberías, y sistemas de agua.</span>
                      </p>
                      <p className="text-sm flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary text-lg">✓</span>
                        <span><strong className="text-foreground">Ahora en tendencia:</strong> Grifería moderna y sistemas de ahorro de agua.</span>
                      </p>
                    </>
                  )}
                  {category.id === 'auto' && (
                    <>
                      <p className="text-sm flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary text-lg">✓</span>
                        <span>Lavado profesional de auto a domicilio, sin complicaciones.</span>
                      </p>
                      <p className="text-sm flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary text-lg">✓</span>
                        <span><strong className="text-foreground">Ahora en tendencia:</strong> Detallado ecológico y protección cerámica.</span>
                      </p>
                    </>
                  )}
                  {category.id === 'medusa' && (
                    <>
                      <p className="text-sm flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary text-lg">✓</span>
                        <span>Instalación profesional de cargadores para vehículos eléctricos.</span>
                      </p>
                      <p className="text-sm flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary text-lg">✓</span>
                        <span><strong className="text-foreground">Ahora en tendencia:</strong> Energía solar residencial y sistemas de almacenamiento.</span>
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Image Container */}
              <div className="relative">
                {/* Hero Image */}
                <img 
                  src={category.heroImage} 
                  alt={category.name}
                  className="w-full h-[220px] md:h-[400px] object-cover rounded-xl"
                />
                
                {/* Desktop: Overlay Card (hidden on mobile) */}
                <div className="hidden md:block absolute top-8 left-8 bg-white rounded-xl p-6 shadow-lg max-w-[350px]">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {category.name}
                  </h3>
                  <div className="space-y-3">
                    {category.id === 'handyman' && (
                      <>
                        <p className="text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span>Monta de forma segura tu TV, estantes, arte, espejos, y más.</span>
                        </p>
                        <p className="text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span><strong>Ahora en tendencia:</strong> Paredes galería, TVs artísticos, y estanterías envolventes.</span>
                        </p>
                      </>
                    )}
                    {category.id === 'electrician' && (
                      <>
                        <p className="text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span>Instalaciones eléctricas seguras y certificadas por profesionales.</span>
                        </p>
                        <p className="text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span><strong>Ahora en tendencia:</strong> Iluminación LED inteligente y paneles solares.</span>
                        </p>
                      </>
                    )}
                    {category.id === 'plumbing' && (
                      <>
                        <p className="text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span>Reparaciones rápidas de fugas, tuberías, y sistemas de agua.</span>
                        </p>
                        <p className="text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span><strong>Ahora en tendencia:</strong> Grifería moderna y sistemas de ahorro de agua.</span>
                        </p>
                      </>
                    )}
                    {category.id === 'auto' && (
                      <>
                        <p className="text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span>Lavado profesional de auto a domicilio, sin complicaciones.</span>
                        </p>
                        <p className="text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span><strong>Ahora en tendencia:</strong> Detallado ecológico y protección cerámica.</span>
                        </p>
                      </>
                    )}
                    {category.id === 'medusa' && (
                      <>
                        <p className="text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span>Instalación profesional de cargadores para vehículos eléctricos.</span>
                        </p>
                        <p className="text-base flex items-start gap-2">
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
