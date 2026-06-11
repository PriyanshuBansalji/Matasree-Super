import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StickyAddToCartBarProps {
  productName: string;          // shown truncated to 30 chars with ellipsis
  price: number;                // current price, kept in sync
  stock: number;                // disables button when <= 0
  onAddToCart: () => void;      // same action as the primary button
  isLoading?: boolean;          // shows spinner when true
  primaryButtonRef: React.RefObject<HTMLElement>; // used by IntersectionObserver
}

// ─── Component ────────────────────────────────────────────────────────────────

const StickyAddToCartBar = ({
  productName,
  price,
  stock,
  onAddToCart,
  isLoading = false,
  primaryButtonRef,
}: StickyAddToCartBarProps) => {
  const [visible, setVisible] = useState(false);

  // Truncate product name to 30 chars with ellipsis
  const truncatedName =
    productName.length > 30 ? productName.slice(0, 30) + '…' : productName;

  const isDisabled = stock <= 0 || isLoading;

  // ── IntersectionObserver — show bar when primary button leaves viewport ─────
  useEffect(() => {
    const target = primaryButtonRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When primary button scrolls OUT of view → show sticky bar
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [primaryButtonRef]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="sticky-add-to-cart-bar"
          className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-lg"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          aria-label="Sticky Add to Cart bar"
        >
          <div className="container mx-auto px-4 py-3 flex items-center gap-4">
            {/* Product name */}
            <p
              className="font-serif font-semibold text-foreground flex-1 truncate"
              title={productName}
            >
              {truncatedName}
            </p>

            {/* Price */}
            <span className="font-serif font-bold text-xl text-foreground whitespace-nowrap">
              ₹{price.toFixed(0)}
            </span>

            {/* Add to Cart button */}
            <Button
              onClick={onAddToCart}
              disabled={isDisabled}
              aria-label={stock <= 0 ? 'Out of stock' : `Add ${productName} to cart`}
              className="bg-gradient-spice hover:opacity-90 text-white font-bold rounded-xl px-6 py-5 shadow-lg transition-all group whitespace-nowrap"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Adding…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  {stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </span>
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyAddToCartBar;
