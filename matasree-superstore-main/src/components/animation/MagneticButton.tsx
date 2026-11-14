import { useRef, ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { usePointerFine } from '../../hooks/usePointerFine';

/**
 * MagneticButton — a wrapper that subtly attracts its children toward the
 * cursor when the pointer is within 80px of the nearest edge of the element.
 *
 * Behaviours:
 * - Returns children as-is (no wrapper) when pointer is coarse or reduced-motion
 *   is preferred — zero positional shift in both accessibility cases.
 * - Displacement is proportional to cursor offset from element center, scaled by
 *   `strength`, and capped at `12 × strength` on each axis.
 * - Motion values are fed through useSpring({ stiffness: 200, damping: 20 }) so
 *   tracking is smooth and the return-to-zero on pointerleave is automatic.
 * - Uses only `transform: translate()` via motion.div style — no layout reflow.
 *
 * Properties satisfied:
 * - Property 3: |tx| ≤ 12 × strength and |ty| ≤ 12 × strength for any cursor
 *   position within the 80px activation radius.
 * - Property 4: zero shift when prefers-reduced-motion or coarse pointer is active.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

interface MagneticButtonProps {
  children: ReactNode;
  /** Scales the maximum displacement. Range 0.1–1.0. Default 0.4. */
  strength?: number;
  className?: string;
}

export function MagneticButton({
  children,
  strength = 0.4,
  className,
}: MagneticButtonProps): JSX.Element {
  const isPointerFine = usePointerFine();
  const prefersReducedMotion = useReducedMotion();

  // Raw motion values updated on every pointermove
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Spring-smoothed values — stiffness/damping match the spec (2.2)
  const x = useSpring(rawX, { stiffness: 200, damping: 20 });
  const y = useSpring(rawY, { stiffness: 200, damping: 20 });

  const wrapperRef = useRef<HTMLDivElement>(null);

  // --- Gate: coarse pointer OR reduced motion → render children unchanged ---
  if (!isPointerFine || prefersReducedMotion) {
    // Render a plain non-animated div so layout/className still applies
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  // --- pointermove handler ---
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = wrapperRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const { clientX, clientY } = event;

    // Distance from each edge
    const distLeft   = clientX - rect.left;
    const distRight  = rect.right - clientX;
    const distTop    = clientY - rect.top;
    const distBottom = rect.bottom - clientY;

    // Nearest edge distance (negative means outside element)
    const nearestEdge = Math.min(distLeft, distRight, distTop, distBottom);

    // Only apply magnetic effect within 80px of the nearest edge (req 2.1)
    if (nearestEdge > 80) {
      rawX.set(0);
      rawY.set(0);
      return;
    }

    // Cursor offset from element center
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = clientX - centerX;
    const offsetY = clientY - centerY;

    // Maximum displacement for this strength value
    const cap = 12 * strength;

    // Scale offset by strength and clamp to cap (Property 3)
    const tx = Math.max(-cap, Math.min(cap, offsetX * strength));
    const ty = Math.max(-cap, Math.min(cap, offsetY * strength));

    rawX.set(tx);
    rawY.set(ty);
  };

  // --- pointerleave handler ---
  // Spring values naturally return to 0 — just reset raw values to 0.
  const handlePointerLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.div
      ref={wrapperRef}
      className={className}
      style={{ x, y }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </motion.div>
  );
}
