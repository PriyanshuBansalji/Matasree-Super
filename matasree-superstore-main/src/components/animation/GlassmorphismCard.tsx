import { ReactNode } from 'react';

/**
 * GlassmorphismCard — a polymorphic wrapper component that applies the
 * `glass-card` CSS class to any element type.
 *
 * The visual effect is defined entirely in `index.css`:
 * - Semi-transparent background at ~12% opacity (Req 9.1)
 * - `backdrop-filter: blur(20px)` for the frosted-glass blur (Req 9.1)
 * - Semi-transparent border at ~18% opacity (Req 9.1)
 * - Diffused box-shadow for depth (Req 9.1)
 * - Inset top highlight `inset 0 1px 0 rgba(255,255,255,0.3)` (Req 9.2)
 * - `@supports not (backdrop-filter)` fallback with ≥85% opacity white (Req 9.3)
 *
 * Usage examples:
 * ```tsx
 * // Default div
 * <GlassmorphismCard className="rounded-xl p-6">…</GlassmorphismCard>
 *
 * // As a <section>
 * <GlassmorphismCard as="section" className="rounded-lg">…</GlassmorphismCard>
 *
 * // As a <span> (inline badge/pill)
 * <GlassmorphismCard as="span" className="px-3 py-1 rounded-full text-sm">
 *   Hero Badge
 * </GlassmorphismCard>
 * ```
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

interface GlassmorphismCardProps {
  children: ReactNode;
  /** Additional Tailwind / custom CSS classes merged with `glass-card`. */
  className?: string;
  /** The HTML element or React component to render. Defaults to `'div'`. */
  as?: React.ElementType;
}

export function GlassmorphismCard({
  children,
  className,
  as: Component = 'div',
}: GlassmorphismCardProps): JSX.Element {
  return (
    <Component className={['glass-card', className].filter(Boolean).join(' ')}>
      {children}
    </Component>
  );
}
