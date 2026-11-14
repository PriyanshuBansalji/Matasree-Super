import { ReactNode, useRef, useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * RippleButton — a button wrapper that spawns CSS-animated ripple circles at
 * the pointer-down coordinates, clipped by the button's `overflow: hidden`.
 *
 * Behaviours:
 * - When `prefers-reduced-motion` is active, renders a plain <button> with zero
 *   ripple logic (Property 18).
 * - Each `pointerdown` event appends a new ripple at the relative position
 *   computed via `getBoundingClientRect()` (Property 17).
 * - Multiple simultaneous ripples are supported: n rapid clicks → n ripple
 *   elements exist until each 600ms timer fires (Property 19).
 * - Timer IDs are stored in a `Set`; all are cleared on unmount to prevent
 *   memory leaks.
 * - The CSS `@keyframes rippleExpand` (defined in index.css) drives the
 *   40px → 160px diameter + opacity 0 transition over 600ms.
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7
 */

interface Ripple {
  id: number;
  x: number; // px from left of button
  y: number; // px from top of button
}

interface RippleButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  // All other standard button props passed through
  [key: string]: unknown;
}

export function RippleButton({
  children,
  className,
  onClick,
  ...rest
}: RippleButtonProps): JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // Keep track of pending timer IDs so we can clear them on unmount
  const timerIds = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Clean up all pending timers when the component unmounts
  useEffect(() => {
    return () => {
      timerIds.current.forEach(clearTimeout);
      timerIds.current.clear();
    };
  }, []);

  // Reduced-motion: plain button, no ripple logic
  if (prefersReducedMotion) {
    return (
      <button className={className} onClick={onClick} {...rest}>
        {children}
      </button>
    );
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();

    // Compute pointer position relative to the button's top-left corner
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Use Date.now() for a unique, monotonically increasing ID
    const id = Date.now() + Math.random(); // extra entropy for rapid clicks

    setRipples((prev) => [...prev, { id, x, y }]);

    // Remove this ripple after the animation completes (600ms)
    const timerId = setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
      timerIds.current.delete(timerId);
    }, 600);

    timerIds.current.add(timerId);
  };

  return (
    <button
      className={className}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      style={{ position: 'relative', overflow: 'hidden' }}
      {...rest}
    >
      {children}

      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            pointerEvents: 'none',
            animation: 'rippleExpand 600ms ease-out forwards',
          }}
        />
      ))}
    </button>
  );
}
