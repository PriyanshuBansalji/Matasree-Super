/**
 * PageTransition
 *
 * Wraps a page with a Framer Motion fade + vertical slide animation.
 * Used inside AnimatePresence in App.tsx for route-level transitions.
 *
 * Requirements: 17.2
 */
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
