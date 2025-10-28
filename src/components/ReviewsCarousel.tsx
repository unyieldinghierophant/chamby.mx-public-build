import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { RatingDisplay } from "@/components/provider/RatingDisplay";
import reviewWork1 from "@/assets/review-work-1.jpg";
import reviewWork2 from "@/assets/review-work-2.jpg";
import reviewWork3 from "@/assets/review-work-3.jpg";
import reviewWork4 from "@/assets/review-work-4.jpg";

interface Review {
  id: number;
  name: string;
  review: string;
  rating: number;
  image: string;
  service: string;
}

const reviews: Review[] = [
  {
    id: 1,
    name: "Mariana P.",
    review: "Llegaron en menos de una hora y resolvieron todo sin ensuciar. Servicio impecable.",
    rating: 5,
    image: reviewWork1,
    service: "Destapado de alcantarilla",
  },
  {
    id: 2,
    name: "Roberto C.",
    review: "Los técnicos fueron puntuales y dejaron todo funcionando perfecto. Excelente servicio.",
    rating: 4.5,
    image: reviewWork2,
    service: "Instalación de ventanas motorizadas",
  },
  {
    id: 3,
    name: "Ana L.",
    review: "Las cortinas quedaron hermosas y la instalación fue rapidísima.",
    rating: 5,
    image: reviewWork3,
    service: "Instalación de cortinas",
  },
  {
    id: 4,
    name: "Carlos M.",
    review: "Muy profesionales. Dejaron limpio, bien instalado y funcionando al 100%.",
    rating: 4.5,
    image: reviewWork4,
    service: "Instalación de aire acondicionado",
  },
];

export const ReviewsCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });

    // Auto-scroll every 5 seconds
    const autoScroll = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 5000);

    return () => clearInterval(autoScroll);
  }, [api]);

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-muted-foreground text-lg">
            Miles de clientes satisfechos confían en Chamby
          </p>
        </div>

        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {reviews.map((review) => (
              <CarouselItem
                key={review.id}
                className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3"
              >
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  <div className="relative h-48 md:h-56 overflow-hidden">
                    <img
                      src={review.image}
                      alt={review.service}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white font-semibold text-sm">
                        {review.service}
                      </p>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="mb-3">
                      <RatingDisplay
                        rating={review.rating}
                        showNumber={false}
                        size="sm"
                      />
                    </div>
                    <p className="text-muted-foreground mb-4 italic line-clamp-3">
                      "{review.review}"
                    </p>
                    <p className="font-semibold text-foreground">
                      {review.name}
                    </p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Buttons - Hidden on mobile, visible on desktop */}
          <div className="hidden md:block">
            <CarouselPrevious className="left-0 -translate-x-12" />
            <CarouselNext className="right-0 translate-x-12" />
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  current === index
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Ir a reseña ${index + 1}`}
              />
            ))}
          </div>
        </Carousel>
      </div>
    </section>
  );
};
