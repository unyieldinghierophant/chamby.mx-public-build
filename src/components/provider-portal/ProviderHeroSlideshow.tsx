import { useState, useEffect, useCallback, useRef } from "react";

const SLIDE_INTERVAL_MS = 7000;
const TRANSITION_MS = 1200;

const IMAGES = [
  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1920&q=80&auto=format&fit=crop", // electrician working on panel
  "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1920&q=80&auto=format&fit=crop", // plumber under sink
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&q=80&auto=format&fit=crop", // handyman with drill
  "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1920&q=80&auto=format&fit=crop", // worker installing/building
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1920&q=80&auto=format&fit=crop", // construction worker on site
  "https://images.unsplash.com/photo-1541123603104-512919d6a96c?w=1920&q=80&auto=format&fit=crop", // painter painting wall
  "https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=1920&q=80&auto=format&fit=crop", // carpenter working with wood
  "https://images.unsplash.com/photo-1622653902334-23c8e tried0a72b1?w=1920&q=80&auto=format&fit=crop", // worker with tools
  "https://images.unsplash.com/photo-1564182842519-8a3b2af3e228?w=1920&q=80&auto=format&fit=crop", // tradesperson with power tools
  "https://images.unsplash.com/photo-1595814433015-e6f5ce69614e?w=1920&q=80&auto=format&fit=crop", // worker fixing/repairing
];

interface Props {
  onReady?: () => void;
}

export const ProviderHeroSlideshow = ({ onReady }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [firstLoaded, setFirstLoaded] = useState(false);
  const calledReady = useRef(false);

  // Preload all images on mount
  useEffect(() => {
    IMAGES.forEach((src, i) => {
      const img = new window.Image();
      img.src = src;
      if (i === 0) {
        img.onload = () => {
          setFirstLoaded(true);
          if (!calledReady.current) {
            calledReady.current = true;
            onReady?.();
          }
        };
      }
    });

    // Fallback if first image takes too long
    const fallback = setTimeout(() => {
      if (!calledReady.current) {
        calledReady.current = true;
        setFirstLoaded(true);
        onReady?.();
      }
    }, 3000);

    return () => clearTimeout(fallback);
  }, [onReady]);

  // Rotate slides
  useEffect(() => {
    if (!firstLoaded) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % IMAGES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [firstLoaded]);

  return (
    <>
      {IMAGES.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: firstLoaded && i === currentIndex ? 1 : 0,
            transition: `opacity ${TRANSITION_MS}ms ease-in-out`,
          }}
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}
    </>
  );
};
