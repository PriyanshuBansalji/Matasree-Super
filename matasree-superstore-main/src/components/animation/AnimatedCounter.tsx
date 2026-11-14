import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

/**
 * AnimatedCounter — counts from 0 to a target value using an expo-out easing
 * curve, triggered once when the element enters the viewport.
 *
 * Behaviours:
 * - Counts from 0 → `to` over `duration` seconds (default 1.2s) using the
 *   expo-out cubic-bezier `[0.16, 1, 0.3, 1]` easing curve. (Req 7.1)
 * - Numbers ≥ 1000 are formatted with locale-aware comma separators via
 *   `Math.round(value).toLocaleString()`. (Req 7.2)
 * - `prefix` and `suffix` props wrap the formatted number (e.g. `₹5,000+`). (Req 7.3)
 * - Animation begins once ≥20% of the element enters the viewport, with a
 *   stagger delay of `min(index × 0.15s, 0.6s)`. Animation fires at most once
 *   per component mount due to `once: true`. (Req 7.4)
 * - When `prefers-reduced-motion` is active: displays the final formatted value
 *   immediately on mount with no counting animation. (Req 7.5)
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

interface AnimatedCounterProps {
  /** The target number to count up to. */
  to: number;
  /**
   * Animation duration in seconds.
   * @default 1.2
   */
  duration?: number;
  /** Optional string prepended to the formatted number (e.g. `₹`). */
  prefix?: string;
  /** Optional string appended to the formatted number (e.g. `+` or `%`). */
  suffix?: string;
  /**
   * Zero-based position in the grid. Used to compute stagger delay:
   * `min(index × 0.15s, 0.6s)`.
   * @default 0
   */
  index?: number;
  /** Optional CSS class applied to the container span. */
  className?: string;
}

export function AnimatedCounter({
  to,
  duration = 1.2,
  prefix = '',
  suffix = '',
  index = 0,
  className,
}: AnimatedCounterProps): JSX.Element {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Format a raw number value into the display string
  const formatValue = (value: number): string =>
    `${prefix}${Math.round(value).toLocaleString()}${suffix}`;

  // Initial display state — show final value immediately for reduced-motion (Req 7.5)
  const [display, setDisplay] = useState<string>(
    prefersReducedMotion ? formatValue(to) : formatValue(0)
  );

  // One-shot viewport trigger: fires when ≥20% of element is visible (Req 7.4)
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  useEffect(() => {
    // Reduced-motion: always show final value, never animate (Req 7.5)
    if (prefersReducedMotion) {
      setDisplay(formatValue(to));
      return;
    }

    // Only start the animation when the element enters the viewport
    if (!isInView) return;

    // Stagger delay capped at 0.6s (Req 7.4)
    const delay = Math.min(index * 0.15, 0.6);

    // Imperative Framer Motion value animation: animate(from, to, options)
    // Returns AnimationPlaybackControls — stop() cancels on unmount (Req 7.1)
    const controls = animate(0, to, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1], // expo-out curve (Req 7.1)
      onUpdate: (value) => {
        // Format on every frame tick — comma separators for ≥1000 (Req 7.2, 7.3)
        setDisplay(formatValue(value));
      },
      onComplete: () => {
        // Ensure the final value is displayed exactly (handles floating-point drift)
        setDisplay(formatValue(to));
      },
    });

    // Clean up animation on unmount
    return () => {
      controls.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView, prefersReducedMotion, to, duration, index, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
