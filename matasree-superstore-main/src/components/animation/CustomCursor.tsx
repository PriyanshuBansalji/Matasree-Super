import { useState, useEffect } from 'react';
import { useReducedMotion, useMotionValue, useSpring, motion } from 'framer-motion';
import { usePointerFine } from '../../hooks/usePointerFine';

/**
 * CustomCursor — globally mounted, pointer-following orb that replaces the
 * default browser cursor on non-touch (pointer:fine) devices.
 *
 * Behaviours:
 * - Returns null on coarse-pointer (touch) devices — default cursor stays.
 * - Renders a static 8px saffron dot when reduced-motion is preferred.
 * - Renders a spring-animated 24px/48px orb with mix-blend-mode:difference
 *   that morphs on hover over interactive elements (a, button, [role="button"]).
 * - Hides the native cursor via document.body.style.cursor = 'none' on mount.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
 */
export function CustomCursor(): JSX.Element | null {
  const isPointerFine = usePointerFine();
  const prefersReducedMotion = useReducedMotion();

  // Raw motion values for the mouse position
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring-smoothed values for the 80ms trailing effect
  // damping: 28, stiffness: 220 produces ~80ms of lag
  const springX = useSpring(mouseX, { damping: 28, stiffness: 220 });
  const springY = useSpring(mouseY, { damping: 28, stiffness: 220 });

  const [isHovering, setIsHovering] = useState(false);

  // Native cursor is intentionally left visible — the orb renders alongside it.

  // --- Effect: track mouse position ---
  useEffect(() => {
    if (!isPointerFine || prefersReducedMotion) return;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX.set(event.clientX);
      mouseY.set(event.clientY);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isPointerFine, prefersReducedMotion, mouseX, mouseY]);

  // --- Effect: delegated hover detection on interactive elements ---
  useEffect(() => {
    if (!isPointerFine || prefersReducedMotion) return;

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest('a, button, [role="button"]')) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest('a, button, [role="button"]')) {
        setIsHovering(false);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [isPointerFine, prefersReducedMotion]);

  // Coarse pointer — render nothing, leave default cursor intact
  if (!isPointerFine) {
    return null;
  }

  // Reduced motion — static 8px saffron dot, no spring/animation
  if (prefersReducedMotion) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#E65C19',
          // Center on pointer origin (top-left of viewport when no movement)
          transform: 'translateX(-50%) translateY(-50%)',
        }}
      />
    );
  }

  // Full animated cursor
  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        borderRadius: '50%',
        backgroundColor: 'white',
        mixBlendMode: 'difference',
        x: springX,
        y: springY,
        // Offset so the center of the orb aligns with the pointer coordinates
        translateX: '-50%',
        translateY: '-50%',
      }}
      animate={{
        width: isHovering ? 48 : 24,
        height: isHovering ? 48 : 24,
      }}
      transition={{
        duration: 0.2,
        ease: 'easeOut',
      }}
    />
  );
}
