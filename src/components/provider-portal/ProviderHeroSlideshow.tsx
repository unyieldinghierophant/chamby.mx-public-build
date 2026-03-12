import { useState, useEffect, useCallback, useRef } from "react";

const SLIDE_INTERVAL_MS = 7000;
const TRANSITION_MS = 1200;

const IMAGES = [
  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1590479773265-7464e5d48118?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=1920&q=80&auto=format&fit=crop",
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
