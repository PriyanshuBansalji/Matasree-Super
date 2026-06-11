/**
 * TestimonialSkeleton
 *
 * Standalone shimmer skeleton that mimics a testimonial/review card layout.
 * Used as a loading placeholder while testimonial data is being fetched.
 *
 * Requirements: 9.1, 6.5
 */

import { Skeleton } from '@/components/ui/skeleton';

export const TestimonialSkeleton = () => {
  return (
    <div
      className="bg-card rounded-2xl border border-border/50 p-6 flex flex-col gap-4 animate-pulse"
      aria-hidden="true"
    >
      {/* Top row: avatar + name */}
      <div className="flex items-center gap-3">
        {/* Avatar circle — w-12 h-12 */}
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />

        {/* Name + sub-label */}
        <div className="flex flex-col gap-1.5 flex-1">
          <Skeleton className="h-4 w-1/2 rounded-full" />
          <Skeleton className="h-3 w-1/3 rounded-full" />
        </div>
      </div>

      {/* Star rating row — 5 stars */}
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-4 rounded-full" />
        ))}
      </div>

      {/* Review text — two lines */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-4/5 rounded-full" />
      </div>
    </div>
  );
};

export default TestimonialSkeleton;
