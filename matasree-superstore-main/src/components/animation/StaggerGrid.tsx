import React, { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * StaggerGrid — wraps a grid of children in a Framer Motion stagger container
 * so each child animates in sequentially when the container enters the viewport.
 *
 * Behaviours:
 * - Each direct child slides up from y:40 and fades in from opacity:0 to opacity:1
 *   using a spring transition (stiffness: 260, damping: 20). (Req 6.1, 6.2)
 * - Children are staggered by `staggerDelay` seconds (default 0.07). (Req 6.3)
 * - Animation triggers once when ≥15% of the container enters the viewport. (Req 6.4)
 * - When `prefers-reduced-motion` is set, children are rendered immediately
 *   visible with no stagger or animation. (Req 6.5)
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

interface StaggerGridProps {
  children: ReactNode;
  className?: string;
  /** Delay between each child's animation start in seconds. Default: 0.07 */
  staggerDelay?: number;
}

const containerVariants = (staggerDelay: number) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerDelay,
    },
  },
});

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 20 },
  },
};

export function StaggerGrid({
  children,
  className,
  staggerDelay = 0.07,
}: StaggerGridProps): JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    // Render children immediately visible — no stagger, no motion (Req 6.5)
    return (
      <motion.div className={className}>
        {React.Children.map(children, (child, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 1, y: 0, scale: 1 }}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={containerVariants(staggerDelay)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
