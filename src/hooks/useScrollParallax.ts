import { useState, useEffect, useMemo } from 'react';

interface ScrollParallaxResult {
  scrollY: number;
  heroOpacity: number;
  parallaxOffset: number;
  dotOpacity: number;
  cardOpacity: number;
  mapOpacity: number;
  scrollProgress: number;
}

export const useScrollParallax = (fadeDistance = 600): ScrollParallaxResult => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const values = useMemo(() => {
    const scrollProgress = Math.min(1, scrollY / fadeDistance);
    
    return {
      scrollY,
      scrollProgress,
      // Hero fades as user scrolls
      heroOpacity: Math.max(0, 1 - scrollProgress * 0.7),
      // Parallax offset for layered movement
      parallaxOffset: scrollY * 0.3,
      // Dots start subtle and become more visible with scroll
      dotOpacity: Math.min(1, 0.5 + scrollProgress * 0.5),
      // Cards fade in gradually
      cardOpacity: Math.min(1, 0.4 + scrollProgress * 0.6),
      // Map stays more stable
      mapOpacity: Math.max(0.1, 0.25 - scrollProgress * 0.1),
    };
  }, [scrollY, fadeDistance]);

  return values;
};
