import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ShoppingCart, Plus, Minus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCartStore } from '@/store/cartStore';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BackendProduct {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  stock?: number;
  weight?: string;
  description?: string;
  rating?: number;
  reviews?: number;
  category?: string | { _id: string; name: string };
}

interface QuickViewModalProps {
  productId: string | null;
  triggerRef: React.RefObject<HTMLElement>;
  onClose: () => void;
  onAddToCart: (productId: string, quantity: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BACKEND_URL = 'http://localhost:5001';

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return `${BACKEND_URL}${path}`;
  return path;
};

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

const QuickViewSkeleton = () => (
  <div className="flex flex-col sm:flex-row gap-6 p-6">
    {/* Left – image placeholder */}
    <div className="w-full sm:w-2/5 flex-shrink-0">
      <Skeleton className="w-full aspect-square rounded-lg bg-secondary/50 animate-pulse" />
      <div className="flex gap-2 mt-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="w-16 h-16 rounded-md bg-secondary/50 animate-pulse" />
        ))}
      </div>
    </div>
    {/* Right – text placeholders */}
    <div className="flex-1 space-y-4 pt-2">
      <Skeleton className="h-7 w-3/4 rounded bg-secondary/50 animate-pulse" />
      <Skeleton className="h-5 w-1/3 rounded bg-secondary/50 animate-pulse" />
      <Skeleton className="h-5 w-1/2 rounded bg-secondary/50 animate-pulse" />
      <Skeleton className="h-4 w-full rounded bg-secondary/50 animate-pulse" />
      <Skeleton className="h-4 w-5/6 rounded bg-secondary/50 animate-pulse" />
      <Skeleton className="h-10 w-1/3 rounded bg-secondary/50 animate-pulse" />
      <Skeleton className="h-12 w-full rounded-xl bg-secondary/50 animate-pulse" />
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const QuickViewModal = ({
  productId,
  triggerRef,
  onClose,
  onAddToCart,
}: QuickViewModalProps) => {
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<BackendProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  // ── Fetch product when modal opens ──────────────────────────────────────────
  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setQuantity(1);

    (async () => {
      try {
        const data = await apiClient.getProductById(productId) as any;
        if (cancelled) return;
        // apiClient response interceptor returns response.data directly
        const prod: BackendProduct = data?.data ?? data;
        setProduct(prod);
        setActiveImage(getImageUrl(prod.image));
      } catch {
        if (!cancelled) setError('Failed to load product. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  // ── Focus trap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!productId) return;

    // Save the element that had focus before we opened
    previousFocusRef.current = document.activeElement;

    // Focus first focusable element inside dialog after paint
    const raf = requestAnimationFrame(() => {
      const el = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
      el?.focus();
    });

    return () => cancelAnimationFrame(raf);
  }, [productId]);

  // ── Keyboard handler (Escape + Tab trap) ────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const container = dialogRef.current;
        if (!container) return;
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
        ).filter((el) => !el.closest('[aria-hidden="true"]'));

        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose]
  );

  // ── Restore focus on close ───────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    onClose();
    // Restore focus after the modal has unmounted (next tick)
    setTimeout(() => {
      if (triggerRef.current) {
        triggerRef.current.focus();
      } else if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    }, 0);
  }, [onClose, triggerRef]);

  // ── Add to cart ──────────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(() => {
    if (!product) return;

    const cartItem = {
      id: product._id,
      name: product.name,
      price: product.price,
      image: getImageUrl(product.image),
      quantity,
      weight: product.weight ?? '',
      description: product.description ?? '',
      category:
        typeof product.category === 'string'
          ? product.category
          : product.category?.name ?? '',
      rating: product.rating ?? 0,
      reviews: product.reviews ?? 0,
      inStock: (product.stock ?? 0) > 0,
    };

    addItem(cartItem as any);
    onAddToCart(product._id, quantity);
    toast.success(`${product.name} added to cart!`, {
      description: 'View your cart to checkout',
    });
    handleClose();
  }, [product, quantity, addItem, onAddToCart, handleClose]);

  // ── Quantity helpers ─────────────────────────────────────────────────────────
  const maxQty = product ? Math.min(product.stock ?? 10, 10) : 10;

  const decrementQty = () => setQuantity((q) => Math.max(1, q - 1));
  const incrementQty = () => setQuantity((q) => Math.min(maxQty, q + 1));

  // ── Stock badge ───────────────────────────────────────────────────────────────
  const renderStockBadge = () => {
    const stock = product?.stock ?? 0;
    if (stock === 0)
      return <Badge variant="destructive">Out of Stock</Badge>;
    if (stock <= 10)
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
          Low Stock ({stock} left)
        </Badge>
      );
    return (
      <Badge className="bg-green-600 hover:bg-green-700 text-white">
        <Package className="w-3 h-3 mr-1" /> In Stock
      </Badge>
    );
  };

  // ── Don't render when closed ─────────────────────────────────────────────────
  if (productId === null) return null;

  const isOutOfStock = (product?.stock ?? 0) === 0;
  const shortDescription = product?.description
    ? product.description.length > 150
      ? product.description.slice(0, 150) + '…'
      : product.description
    : '';

  const allImages: string[] = [];
  if (product) {
    allImages.push(getImageUrl(product.image));
    if (product.images?.length) {
      product.images.forEach((img) => {
        const url = getImageUrl(img);
        if (url && !allImages.includes(url)) allImages.push(url);
      });
    }
  }

  const dialogLabel = loading ? 'Loading…' : product ? `Quick view: ${product.name}` : 'Quick view';

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        aria-hidden="true"
      >
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleClose}
        />

        {/* Modal panel */}
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={dialogLabel}
          className="relative z-10 w-full max-w-2xl bg-background rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          {/* Close button */}
          <button
            type="button"
            aria-label="Close quick view"
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-background/80 hover:bg-secondary border border-border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>

          {/* ── Content ──────────────────────────────────────────────────────── */}
          {loading && <QuickViewSkeleton />}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <p className="text-destructive font-medium mb-4">{error}</p>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </div>
          )}

          {!loading && !error && product && (
            <div className="flex flex-col sm:flex-row gap-0">
              {/* ── Left: Image gallery ───────────────────────────────────────── */}
              <div className="w-full sm:w-2/5 flex-shrink-0 bg-secondary/10 p-6">
                <div className="aspect-square rounded-lg overflow-hidden bg-secondary/20 mb-3">
                  <img
                    src={activeImage || getImageUrl(product.image) || 'https://via.placeholder.com/400'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {allImages.length > 1 && (
                  <div className="flex gap-2 flex-wrap">
                    {allImages.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImage(url)}
                        className={`w-14 h-14 rounded-md overflow-hidden border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          activeImage === url
                            ? 'border-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                        aria-label={`View image ${idx + 1}`}
                        aria-pressed={activeImage === url}
                      >
                        <img
                          src={url}
                          alt={`${product.name} thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Right: Product details ────────────────────────────────────── */}
              <div className="flex-1 p-6 flex flex-col gap-4">
                {/* Name */}
                <h2 className="font-serif font-bold text-2xl text-foreground leading-tight capitalize">
                  {product.name}
                </h2>

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-3xl font-bold text-foreground">
                    ₹{product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-base text-muted-foreground line-through decoration-destructive/40">
                      ₹{product.originalPrice.toFixed(2)}
                    </span>
                  )}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm font-semibold text-green-600">
                      {Math.round(
                        ((product.originalPrice - product.price) / product.originalPrice) * 100
                      )}% off
                    </span>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(product.rating ?? 0)
                            ? 'fill-saffron text-saffron'
                            : 'fill-gray-100 text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({product.reviews ?? 0} reviews)
                  </span>
                </div>

                {/* Weight */}
                {product.weight && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Weight:</span>{' '}
                    {product.weight}
                  </p>
                )}

                {/* Stock badge */}
                <div>{renderStockBadge()}</div>

                {/* Short description */}
                {shortDescription && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {shortDescription}
                  </p>
                )}

                {/* Quantity + Add to Cart */}
                <div className="mt-auto pt-2 flex flex-col gap-3">
                  {/* Quantity selector */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">Quantity:</span>
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={decrementQty}
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                        className="px-3 py-2 hover:bg-secondary disabled:opacity-40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span
                        className="px-4 py-2 text-sm font-semibold min-w-[2.5rem] text-center border-x border-border"
                        aria-live="polite"
                        aria-label={`Quantity: ${quantity}`}
                      >
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={incrementQty}
                        disabled={quantity >= maxQty || isOutOfStock}
                        aria-label="Increase quantity"
                        className="px-3 py-2 hover:bg-secondary disabled:opacity-40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Add to Cart button */}
                  <Button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-serif font-bold tracking-wide py-6 rounded-xl transition-all duration-300"
                    size="lg"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickViewModal;
