import { useState, useEffect } from 'react';

/**
 * Returns `true` when the device's primary pointer is fine (mouse/stylus),
 * `false` on touch/coarse-pointer devices or in SSR/test environments.
 *
 * Reads `window.matchMedia('(pointer: fine)')` once on mount — pointer type
 * doesn't change mid-session so no event listener is needed.
 *
 * Used as the single source of truth for gating pointer-intensive effects:
 * CustomCursor, MagneticButton, TiltCard, ParticleSystem mouse-repulsion,
 * and CartDrawer drag gesture.
 */
export function usePointerFine(): boolean {
  const [isPointerFine, setIsPointerFine] = useState<boolean>(false);

  useEffect(() => {
    // Guard against SSR and test environments where window is not defined
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(pointer: fine)');
    setIsPointerFine(mediaQuery.matches);
  }, []);

  return isPointerFine;
}
