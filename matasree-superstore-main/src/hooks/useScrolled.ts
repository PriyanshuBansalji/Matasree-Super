import { useState, useEffect } from 'react';

/**
 * Returns `true` when `window.scrollY > threshold`.
 *
 * Attaches a passive `scroll` event listener on mount and cleans it up on
 * unmount. Guards against SSR/test environments where `window` is undefined.
 *
 * @param threshold - Scroll distance in pixels before returning `true`.
 *                    Defaults to `60`.
 *
 * Used exclusively by `Navbar` to drive the scroll-condensing behaviour
 * (Requirements 11.1 – 11.5).
 */
export function useScrolled(threshold: number = 60): boolean {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  useEffect(() => {
    // Guard against SSR and test environments where window is not defined
    if (typeof window === 'undefined') {
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > threshold);
    };

    // Set initial value synchronously so the first render is correct
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  return isScrolled;
}
