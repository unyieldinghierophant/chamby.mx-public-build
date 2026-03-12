import { useState, useEffect, useCallback, useRef } from "react";

const SLIDE_INTERVAL_MS = 7000;
const TRANSITION_MS = 1200;

const IMAGES = [
  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1920&q=80&auto=format&fit=crop", // electrician at panel
  "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1920&q=80&auto=format&fit=crop", // plumber under sink
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&q=80&auto=format&fit=crop", // handyman with drill
  "https://images.unsplash.com/photo-1601600576337-c1d8a0d1373c?w=1920&q=80&auto=format&fit=crop", // carpenter sawing wood
  "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1920&q=80&auto=format&fit=crop", // AC technician repairing unit
  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80&auto=format&fit=crop", // construction worker building
  "https://images.unsplash.com/photo-1590479773265-7464e5d48118?w=1920&q=80&auto=format&fit=crop", // worker with power tools
  "https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=1920&q=80&auto=format&fit=crop", // painter rolling wall
  "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1920&q=80&auto=format&fit=crop", // welder at work
  "https://images.unsplash.com/photo-1513467535987-fd81bc7d600f?w=1920&q=80&auto=format&fit=crop", // tiler laying tiles
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
