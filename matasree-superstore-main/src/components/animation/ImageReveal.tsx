import { useRef, ReactNode } from 'react';
import { motion, useReducedMotion, useInView } from 'framer-motion';

/**
 * ImageReveal — wraps any image element in a cover-wipe reveal animation
 * triggered when the container scrolls into view.
 *
 * Behaviours:
 * - A brand-gradient cover panel (saffron → chili, left-to-right) slides away
 *   from left to right over 0.8 s using cubic-bezier [0.76, 0, 0.24, 1].
 * - Simultaneously, the underlying image animates from 115% → 100% scale over
 *   the same duration and easing, creating a reveal-zoom effect.
 * - Triggered once when ≥ 20% of the container is in the viewport.
 * - When `prefers-reduced-motion: reduce` is active, the cover panel is absent
 *   and the image renders at natural scale (1) immediately.
 * - Uses only `transform` (scaleX, scale) — no layout properties animated.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

interface ImageRevealProps {
  /** Must contain an <img> or image-like element */
  children: ReactNode;
  className?: string;
}

const REVEAL_TRANSITION = {
  duration: 0.8,
  ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
};

export function ImageReveal({ children, className }: ImageRevealProps): JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Trigger once when 20% of the container is visible (Req 8.2)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  // --- Reduced motion gate: render children without cover panel at natural scale ---
  if (prefersReducedMotion) {
    return (
      <div ref={containerRef} className={className} style={{ overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>
    );
  }

  return (
    // Container: overflow hidden to clip both cover panel and scaled image (Req 8.1)
    <div
      ref={containerRef}
      className={className}
      style={{ overflow: 'hidden', position: 'relative' }}
    >
      {/* Children (image) wrapper: scales from 115% → 100% (Req 8.4) */}
      <motion.div
        initial={{ scale: 1.15 }}
        animate={isInView ? { scale: 1 } : {}}
        transition={REVEAL_TRANSITION}
      >
        {children}
      </motion.div>

      {/* Cover panel: brand gradient that retracts left-to-right (Req 8.2, 8.3) */}
      <motion.div
        aria-hidden="true"
        initial={{ scaleX: 1, transformOrigin: 'left' }}
        animate={isInView ? { scaleX: 0 } : {}}
        transition={REVEAL_TRANSITION}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, #E65C19, #D63220)',
          transformOrigin: 'left',
        }}
      />
    </div>
  );
}
