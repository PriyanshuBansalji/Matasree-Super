import { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  /** true → loading="eager" + fetchpriority="high" (hero/above-fold image) */
  isAboveFold?: boolean;
  /** CSS aspect-ratio value, e.g. "3/4", "1/1". Defaults to "1/1" */
  aspectRatio?: string;
  /** Shown on load error. Fallback: placeholder image */
  fallbackSrc?: string;
  onLoad?: () => void;
  /**
   * When true, shows a magnifier icon overlay on hover and zooms the image
   * to 150% centered on the cursor position (transform-origin driven by mousemove).
   */
  enableZoom?: boolean;
}

// ─── Spice-themed SVG placeholder (warm cream + mortar icon) ─────────────────

const SPICE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23F5F0E8'/%3E%3Ccircle cx='200' cy='200' r='180' fill='none' stroke='%23D4A373' stroke-width='1' stroke-dasharray='8 4' opacity='0.4'/%3E%3Ccircle cx='200' cy='200' r='120' fill='none' stroke='%23D4A373' stroke-width='0.8' stroke-dasharray='6 3' opacity='0.3'/%3E%3Cellipse cx='200' cy='235' rx='70' ry='45' fill='%23D4A373' opacity='0.55'/%3E%3Cellipse cx='200' cy='235' rx='55' ry='30' fill='%23F5E0B3' opacity='0.8'/%3E%3Crect x='172' y='195' width='56' height='8' rx='4' fill='%23C9884A' opacity='0.7'/%3E%3Cellipse cx='200' cy='180' rx='28' ry='16' fill='%23D4A373' opacity='0.6'/%3E%3Cpath d='M186 180 Q200 162 214 180' fill='none' stroke='%23C9884A' stroke-width='2.5' stroke-linecap='round' opacity='0.7'/%3E%3Ccircle cx='200' cy='148' r='8' fill='%23E8A040' opacity='0.5'/%3E%3Ccircle cx='160' cy='220' r='4' fill='%23C9533B' opacity='0.4'/%3E%3Ccircle cx='240' cy='215' r='3' fill='%23E8A040' opacity='0.4'/%3E%3Ccircle cx='175' cy='258' r='3' fill='%23C9884A' opacity='0.35'/%3E%3Ccircle cx='225' cy='260' r='2.5' fill='%23C9533B' opacity='0.35'/%3E%3C/svg%3E";

// ─── Component ─────────────────────────────────────────────────────────────────

const ProductImage = ({
  src,
  alt,
  className,
  isAboveFold = false,
  aspectRatio = '1/1',
  fallbackSrc,
  onLoad,
  enableZoom = false,
}: ProductImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc || SPICE_PLACEHOLDER);

  useEffect(() => {
    setImgSrc(src || fallbackSrc || SPICE_PLACEHOLDER);
    setErrored(false);
  }, [src, fallbackSrc]);

  // Zoom state
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    if (!errored) {
      // First failure → try fallbackSrc
      const next = fallbackSrc || SPICE_PLACEHOLDER;
      setImgSrc(next === imgSrc ? SPICE_PLACEHOLDER : next);
      setErrored(true);
    } else {
      // Second failure → use embedded spice placeholder
      setImgSrc(SPICE_PLACEHOLDER);
    }
    setLoaded(true);
  };

  // ── Zoom handlers ────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enableZoom || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomOrigin(`${x}% ${y}%`);
    },
    [enableZoom],
  );

  const handleMouseEnter = useCallback(() => {
    if (enableZoom) setIsZoomed(true);
  }, [enableZoom]);

  const handleMouseLeave = useCallback(() => {
    if (enableZoom) {
      setIsZoomed(false);
      setZoomOrigin('50% 50%');
    }
  }, [enableZoom]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        enableZoom && 'cursor-zoom-in',
        className,
      )}
      style={{ aspectRatio }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Warm brand shimmer skeleton ─────────────────────────────────────── */}
      {!loaded && (
        <div
          className="absolute inset-0 w-full h-full rounded-none animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* ── Product image ────────────────────────────────────────────────────── */}
      <img
        src={imgSrc}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-300 ease-out will-change-transform"
        loading={isAboveFold ? 'eager' : 'lazy'}
        {...(isAboveFold ? { fetchPriority: 'high' as any } : {})}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          display: loaded ? undefined : 'block',
          transform: isZoomed ? 'scale(1.5)' : 'scale(1)',
          transformOrigin: zoomOrigin,
        }}
      />

      {/* ── Zoom magnifier icon overlay ──────────────────────────────────────── */}
      {enableZoom && loaded && !isZoomed && (
        <div
          className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1.5 bg-card/80 backdrop-blur-sm rounded-full shadow-card border border-border/60 text-foreground text-xs font-medium pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          aria-hidden="true"
        >
          <ZoomIn className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] tracking-wide">Zoom</span>
        </div>
      )}
    </div>
  );
};

export default ProductImage;
