import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

/**
 * TextReveal — animates a string of text by revealing each word individually
 * using a clip-path wipe from right to left, triggered once on scroll entry.
 *
 * Behaviours:
 * - Splits `children` on whitespace into word tokens at render time.
 * - Each word animates from `clipPath: inset(0 100% 0 0)` to fully visible
 *   when the container enters the viewport (≥20% threshold, once: true).
 * - Words are staggered 60ms apart; the first word starts at 0ms delay.
 * - `duration` prop (0.1–5.0s, default 0.6s) controls per-word transition length.
 * - Uses cubic-bezier `[0.76, 0, 0.24, 1]` as the easing curve.
 * - When `prefers-reduced-motion` is active: all words render immediately visible
 *   with no Framer Motion animation or stagger — accessibility first.
 * - The `as` prop allows rendering as h1–h4, p, or span (default: p).
 * - Animation fires at most once per page load (`once: true` on useInView).
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';

interface TextRevealProps {
  /** The text content to animate word by word. */
  children: string;
  /**
   * Per-word animation duration in seconds. Range 0.1–5.0.
   * @default 0.6
   */
  duration?: number;
  /** Optional CSS class applied to the container element. */
  className?: string;
  /**
   * HTML element to render as.
   * @default 'p'
   */
  as?: HeadingTag;
}

export function TextReveal({
  children,
  duration = 0.6,
  className,
  as: Tag = 'p',
}: TextRevealProps): JSX.Element {
  const containerRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Fire once when ≥20% of the container enters the viewport (req 3.7)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  // Split on whitespace into word tokens (req 3.1)
  const words = children.split(/\s+/).filter(Boolean);

  // Clamp duration to the allowed range
  const clampedDuration = Math.min(5.0, Math.max(0.1, duration));

  // Reduced-motion path: render all words visible immediately, no animation (req 3.5)
  if (prefersReducedMotion) {
    return (
      <Tag ref={containerRef as React.RefObject<HTMLElement & HTMLHeadingElement>} className={className}>
        {words.map((word, index) => (
          <span
            key={index}
            style={{
              display: 'inline-block',
              clipPath: 'inset(0 0% 0 0)',
              marginRight: index < words.length - 1 ? '0.25em' : undefined,
            }}
          >
            {word}
          </span>
        ))}
      </Tag>
    );
  }

  // Full animated path
  return (
    <Tag ref={containerRef as React.RefObject<HTMLElement & HTMLHeadingElement>} className={className}>
      {words.map((word, index) => (
        // Outer span clips overflow so the wipe looks clean (req 3.2)
        <span
          key={index}
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            marginRight: index < words.length - 1 ? '0.25em' : undefined,
          }}
        >
          <motion.span
            style={{ display: 'inline-block' }}
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={isInView ? { clipPath: 'inset(0 0% 0 0)' } : { clipPath: 'inset(0 100% 0 0)' }}
            transition={{
              duration: clampedDuration,
              ease: [0.76, 0, 0.24, 1],
              // Stagger: each word delays 60ms after the previous (req 3.3)
              delay: index * 0.06,
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
