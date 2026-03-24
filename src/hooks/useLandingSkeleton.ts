import { useState, useCallback, useEffect, useRef } from "react";

const FAILSAFE_TIMEOUT_MS = 2500;

/**
 * Manages a skeleton overlay for landing pages.
 * Hides once both hero media AND category icons are ready, or after a failsafe timeout.
 */
export function useLandingSkeleton() {
  const [isVisible, setIsVisible] = useState(true);
  const mediaReady = useRef(false);
  const iconsReady = useRef(false);

  const tryHide = useCallback(() => {
    if (mediaReady.current && iconsReady.current) {
      setIsVisible(false);
    }
  }, []);

  const onHeroMediaReady = useCallback(() => {
    mediaReady.current = true;
    tryHide();
  }, [tryHide]);

  const onIconsReady = useCallback(() => {
    iconsReady.current = true;
    tryHide();
  }, [tryHide]);

  // Failsafe: auto-hide after timeout
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), FAILSAFE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  return { isSkeletonVisible: isVisible, onHeroMediaReady, onIconsReady };
}
