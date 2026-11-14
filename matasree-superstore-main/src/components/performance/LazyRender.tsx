import React, { useState, useEffect, useRef } from 'react';

interface LazyRenderProps {
  children: React.ReactNode;
  height?: string | number;
  placeholderClassName?: string;
}

/**
 * LazyRender — High performance lazy-rendering viewport wrapper.
 * Intersects with viewport and mounts content only when the user scrolls near it (with a 200px prefetch margin).
 * Significantly improves browser layout rendering times for large product catalogs.
 */
export function LazyRender({
  children,
  height = 380,
  placeholderClassName = 'bg-accent/5 animate-pulse rounded-2xl border border-border/20 w-full'
}: LazyRenderProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Render once and keep it mounted for a smoother scroll back up
        }
      },
      { rootMargin: '200px' } // Pre-render ahead of scroll
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} style={{ minHeight: isVisible ? undefined : height }} className="w-full">
      {isVisible ? children : <div style={{ height }} className={placeholderClassName} />}
    </div>
  );
}
