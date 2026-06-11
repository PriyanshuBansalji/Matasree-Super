/**
 * ProductCardSkeleton
 *
 * Standalone shimmer skeleton that mimics the ProductCard layout.
 * Used as a loading placeholder while product data is being fetched.
 *
 * Requirements: 2.6, 17.4
 */

import { Skeleton } from '@/components/ui/skeleton';

export const ProductCardSkeleton = () => {
  return (
    <div
      className="card-ornate bg-card overflow-hidden flex flex-col h-full animate-pulse"
      aria-hidden="true"
    >
      {/* Image area — aspect-[3/4] matches ProductCard */}
      <Skeleton className="aspect-[3/4] w-full rounded-none" />

      {/* Content area */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Category label */}
        <Skeleton className="h-3 w-1/3 rounded-full" />

        {/* Product name */}
        <Skeleton className="h-5 w-3/4 rounded-full" />

        {/* Price */}
        <Skeleton className="h-5 w-1/2 rounded-full" />

        {/* Star rating row */}
        <div className="flex gap-1 mt-auto">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-4 rounded-full" />
          ))}
        </div>

        {/* Price + Add-to-cart row */}
        <div className="flex items-center justify-between border-t border-dashed border-border/60 pt-4">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
