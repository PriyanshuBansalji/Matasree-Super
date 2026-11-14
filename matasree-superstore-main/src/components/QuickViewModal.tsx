import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ShoppingCart, Plus, Minus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCartStore } from '@/store/cartStore';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';
import type { ProductVariant } from '@/types';

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
  variants?: ProductVariant[];
}

interface QuickViewModalProps {
  productId: string | null;
  triggerRef: React.RefObject<HTMLElement>;
  onClose: () => void;
  onAddToCart: (productId: string, quantity: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return `${BACKEND_URL}${path}`;
  return path;
};

const FOCUSABLE_SELECTORS = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(', ');

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const QuickViewSkeleton = () => (
  <div className="flex flex-col sm:flex-row gap-6 p-6">
    <div className="w-full sm:w-2/5 flex-shrink-0">
      <Skeleton className="w-full aspect-square rounded-lg bg-secondary/50 animate-pulse" />
    </div>
    <div className="flex-1 space-y-4 pt-2">
      <Skeleton className="h-7 w-3/4 rounded bg-secondary/50 animate-pulse" />
      <Skeleton className="h-9 w-1/3 rounded bg-secondary/50 animate-pulse" />
      <Skeleton className="h-5 w-1/2 rounded bg-secondary/50 animate-pulse" />
      <div className="flex gap-2">
        {[1,2,3].map(i => <Skeleton key={i} className="h-8 w-16 rounded-full bg-secondary/50 animate-pulse" />)}
      </div>
      <Skeleton className="h-12 w-full rounded-xl bg-secondary/50 animate-pulse" />
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const QuickViewModal = ({ productId, triggerRef, onClose, onAddToCart }: QuickViewModalProps) => {
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<BackendProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  // ── Fetch product ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!productId) { setProduct(null); setError(null); return; }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setQuantity(1);
    setSelectedVariant(null);

    (async () => {
      try {
        const data = await apiClient.getProductById(productId) as any;
        if (cancelled) return;
        const prod: BackendProduct = data?.data ?? data;
        setProduct(prod);
        setActiveImage(getImageUrl(prod.image));

        // Set default variant
        const hasVariants = Array.isArray(prod.variants) && prod.variants.length > 0;
        if (hasVariants) {
          setSelectedVariant(prod.variants![0]);
        } else {
          setSelectedVariant({ weight: prod.weight ?? '', price: prod.price, originalPrice: prod.originalPrice, stock: prod.stock ?? 0 });
        }
      } catch {
        if (!cancelled) setError('Failed to load product. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [productId]);

  // ── Focus trap ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!productId) return;
    previousFocusRef.current = document.activeElement;
    const raf = requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTORS)?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [productId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
    if (e.key === 'Tab') {
      const container = dialogRef.current;
      if (!container) return;
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS))
        .filter(el => !el.closest('[aria-hidden="true"]'));
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
    }
  }, [onClose]);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      if (triggerRef.current) triggerRef.current.focus();
      else if (previousFocusRef.current instanceof HTMLElement) previousFocusRef.current.focus();
    }, 0);
  }, [onClose, triggerRef]);

  // ── Add to cart ──────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(() => {
    if (!product || !selectedVariant) return;
    addItem({
      id: product._id,
      name: product.name,
      price: selectedVariant.price,
      image: getImageUrl(product.image),
      quantity,
      weight: selectedVariant.weight,
      description: product.description ?? '',
    } as any);
    onAddToCart(product._id, quantity);
    toast.success(`${product.name} (${selectedVariant.weight}) added to cart!`, { description: 'View your cart to checkout' });
    handleClose();
  }, [product, selectedVariant, quantity, addItem, onAddToCart, handleClose]);

  if (productId === null) return null;

  // ── Derived values ───────────────────────────────────────────────────────
  const activePrice = selectedVariant?.price ?? product?.price ?? 0;
  const activeOriginalPrice = selectedVariant?.originalPrice;
  const activeStock = selectedVariant?.stock ?? product?.stock ?? 0;
  const discount = activeOriginalPrice && activeOriginalPrice > activePrice
    ? Math.round(((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100) : 0;
  const isOutOfStock = activeStock === 0;
  const maxQty = Math.min(activeStock, 10);

  const hasVariants = product && Array.isArray(product.variants) && product.variants.length > 0;

  const allImages: string[] = [];
  if (product) {
    allImages.push(getImageUrl(product.image));
    product.images?.forEach(img => {
      const url = getImageUrl(img);
      if (url && !allImages.includes(url)) allImages.push(url);
    });
  }

  const renderStockBadge = () => {
    if (isOutOfStock) return <Badge variant="destructive">Out of Stock</Badge>;
    if (activeStock <= 10) return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Low Stock ({activeStock} left)</Badge>;
    return <Badge className="bg-green-600 hover:bg-green-700 text-white"><Package className="w-3 h-3 mr-1" /> In Stock</Badge>;
  };

  const dialogLabel = loading ? 'Loading…' : product ? `Quick view: ${product.name}` : 'Quick view';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-hidden="true">
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }} onClick={handleClose}
        />
        <motion.div
          ref={dialogRef} role="dialog" aria-modal="true" aria-label={dialogLabel}
          className="relative z-10 w-full max-w-2xl bg-background rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }} onKeyDown={handleKeyDown} tabIndex={-1}
        >
          <button
            type="button" aria-label="Close quick view" onClick={handleClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-background/80 hover:bg-secondary border border-border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>

          {loading && <QuickViewSkeleton />}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <p className="text-destructive font-medium mb-4">{error}</p>
              <Button variant="outline" onClick={handleClose}>Close</Button>
            </div>
          )}

          {!loading && !error && product && selectedVariant && (
            <div className="flex flex-col sm:flex-row gap-0">
              {/* ── Left: Image gallery ─────────────────────────────────── */}
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
                        key={idx} type="button" onClick={() => setActiveImage(url)}
                        className={`w-14 h-14 rounded-md overflow-hidden border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeImage === url ? 'border-primary' : 'border-border hover:border-primary/50'}`}
                        aria-label={`View image ${idx + 1}`} aria-pressed={activeImage === url}
                      >
                        <img src={url} alt={`${product.name} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Right: Product details ───────────────────────────────── */}
              <div className="flex-1 p-6 flex flex-col gap-3">
                {/* Name */}
                <h2 className="font-serif font-bold text-2xl text-foreground leading-tight capitalize">{product.name}</h2>

                {/* Price — with strikethrough original */}
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-serif text-3xl font-bold text-primary">₹{activePrice.toFixed(0)}</span>
                  {activeOriginalPrice && activeOriginalPrice > activePrice && (
                    <>
                      <span className="text-base text-muted-foreground line-through decoration-destructive/60">₹{activeOriginalPrice.toFixed(0)}</span>
                      <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{discount}% off</span>
                      <span className="text-xs text-green-700 font-medium">Save ₹{(activeOriginalPrice - activePrice).toFixed(0)}</span>
                    </>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating ?? 0) ? 'fill-saffron text-saffron' : 'fill-gray-100 text-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">({product.reviews ?? 0} reviews)</span>
                </div>

                {/* ── Variant weight selector ──────────────────────────── */}
                {hasVariants ? (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Select Weight</p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants!.map((v) => {
                        const isSelected = v.weight === selectedVariant.weight;
                        const isOOS = v.stock === 0;
                        return (
                          <button
                            key={v.weight}
                            onClick={() => { if (!isOOS) setSelectedVariant(v); }}
                            disabled={isOOS}
                            title={isOOS ? 'Out of stock' : `${v.weight} — ₹${v.price}`}
                            className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 transition-all duration-200 ${
                              isSelected
                                ? 'bg-primary text-white border-primary shadow-md'
                                : isOOS
                                ? 'border-border text-muted-foreground/40 line-through cursor-not-allowed bg-muted/30'
                                : 'border-border text-foreground hover:border-primary hover:bg-primary/5 cursor-pointer'
                            }`}
                          >
                            {v.weight}
                            {!isOOS && v.price && (
                              <span className={`ml-1.5 text-xs font-normal ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                                ₹{v.price}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  product.weight && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Weight:</span> {product.weight}
                    </p>
                  )
                )}

                {/* Stock badge */}
                <div>{renderStockBadge()}</div>

                {/* Short description */}
                {product.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {product.description}
                  </p>
                )}

                {/* Qty + Add to Cart */}
                <div className="mt-auto pt-2 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">Quantity:</span>
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                        className="px-3 py-2 hover:bg-secondary disabled:opacity-40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-2 text-sm font-semibold min-w-[2.5rem] text-center border-x border-border"
                        aria-live="polite" aria-label={`Quantity: ${quantity}`}>{quantity}</span>
                      <button type="button" onClick={() => setQuantity(q => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty || isOutOfStock}
                        aria-label="Increase quantity"
                        className="px-3 py-2 hover:bg-secondary disabled:opacity-40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleAddToCart} disabled={isOutOfStock}
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
