import { useRef, ReactNode } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { usePointerFine } from '../../hooks/usePointerFine';

/**
 * TiltCard — a Framer Motion wrapper that applies a perspective 3D tilt on hover.
 *
 * Behaviours:
 * - Returns children as a plain div when pointer is coarse or reduced-motion
 *   is preferred — zero rotation and no glare in both accessibility cases.
 * - On pointermove: computes normalized cursor position within the card
 *   ((x / w - 0.5) × 2) then multiplies by maxTilt to obtain rotation degrees.
 * - rotateX and rotateY are useMotionValues smoothed with
 *   useSpring({ damping: 20, stiffness: 300 }) so the return-to-zero on
 *   pointerleave happens naturally (~400 ms).
 * - Glare overlay: radial-gradient div at opacity 0–0.4, whose highlight
 *   center tracks the cursor position across the full card area.
 * - Uses GPU-only properties (transform / opacity) — no layout reflow.
 * - perspective: 1000px set on the outer wrapper div.
 *
 * Properties satisfied:
 * - Property 7: |rotateX| ≤ maxTilt and |rotateY| ≤ maxTilt for any cursor
 *   position within the card bounding box.
 * - Property 8: zero rotation and zero glare when prefers-reduced-motion or
 *   coarse pointer is active.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

interface TiltCardProps {
  children: ReactNode;
  /** Maximum tilt in degrees on each axis. Default 12. */
  maxTilt?: number;
  className?: string;
}

export function TiltCard({
  children,
  maxTilt = 12,
  className,
}: TiltCardProps): JSX.Element {
  const isPointerFine = usePointerFine();
  const prefersReducedMotion = useReducedMotion();

  // Raw (un-smoothed) rotation values set directly on every pointermove
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);

  // Glare spotlight position as percentage (0–100) within the card
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  // Glare opacity: 0 at card center, up to 0.4 at corners
  const glareOpacity = useMotionValue(0);

  // Spring-smoothed rotation values (spec: damping 20, stiffness 300)
  const rotateX = useSpring(rawRotateX, { damping: 20, stiffness: 300 });
  const rotateY = useSpring(rawRotateY, { damping: 20, stiffness: 300 });

  // Derive the CSS `background` string so the radial-gradient center tracks
  // the glare motion values reactively without React re-renders
  const glareBackground = useTransform(
    [glareX, glareY],
    ([gx, gy]: number[]) =>
      `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.75) 0%, transparent 65%)`,
  );

  const wrapperRef = useRef<HTMLDivElement>(null);

  // --- Gate: coarse pointer OR reduced motion → plain div, no effect ---
  if (!isPointerFine || prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  // --- pointermove handler ---
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = wrapperRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const { clientX, clientY } = event;

    // Normalize to [-1, 1] relative to card center
    const normX = ((clientX - rect.left) / rect.width - 0.5) * 2;  // -1 (left) … +1 (right)
    const normY = ((clientY - rect.top) / rect.height - 0.5) * 2;  // -1 (top)  … +1 (bottom)

    // rotateX: negative normY so the top of the card tilts toward the viewer when
    //          the cursor is near the top (natural tilt direction).
    // rotateY: positive normX so the right edge tilts toward the viewer when
    //          the cursor is near the right (Property 7: bounded by maxTilt).
    rawRotateX.set(-normY * maxTilt);
    rawRotateY.set(normX * maxTilt);

    // Glare position as percentage (0–100)
    glareX.set(((clientX - rect.left) / rect.width) * 100);
    glareY.set(((clientY - rect.top) / rect.height) * 100);

    // Opacity proportional to distance from card center (max 0.4 at corners)
    const distFromCenter = Math.sqrt(normX * normX + normY * normY) / Math.SQRT2;
    glareOpacity.set(distFromCenter * 0.4);
  };

  // --- pointerleave handler ---
  // Spring values animate naturally back to 0; reset raw targets immediately.
  const handlePointerLeave = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
    glareOpacity.set(0);
    glareX.set(50);
    glareY.set(50);
  };

  return (
    // Outer wrapper: provides perspective projection context (req 5.1, design §7)
    <div
      ref={wrapperRef}
      className={className}
      style={{ perspective: '1000px' }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Inner motion.div carries the 3D rotation — transform only, no reflow */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
        {children}

        {/* Glare overlay — radial-gradient, opacity 0–0.4, tracks cursor (req 5.2) */}
        <motion.div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            opacity: glareOpacity,
            background: glareBackground,
            mixBlendMode: 'overlay',
          }}
        />
      </motion.div>
    </div>
  );
}
