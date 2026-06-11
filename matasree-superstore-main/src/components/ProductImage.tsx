import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
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
}

// ─── Component ─────────────────────────────────────────────────────────────────

const FALLBACK = 'https://via.placeholder.com/400';

const ProductImage = ({
  src,
  alt,
  className,
  isAboveFold = false,
  aspectRatio = '1/1',
  fallbackSrc,
  onLoad,
}: ProductImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc || FALLBACK);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImgSrc(fallbackSrc || FALLBACK);
    // Mark as loaded so skeleton disappears even on error
    setLoaded(true);
  };

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ aspectRatio }}
    >
      {/* Skeleton placeholder — hidden once image loads */}
      {!loaded && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
      )}

      <img
        src={imgSrc}
        alt={alt}
        className="w-full h-full object-cover"
        loading={isAboveFold ? 'eager' : 'lazy'}
        // fetchpriority is a valid HTML attribute; React types may not include it yet
        {...(isAboveFold ? { fetchPriority: 'high' as any } : {})}
        onLoad={handleLoad}
        onError={handleError}
        style={{ display: loaded ? undefined : 'block' }}
      />
    </div>
  );
};

export default ProductImage;
