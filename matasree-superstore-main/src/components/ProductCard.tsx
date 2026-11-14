import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Heart, Eye, BarChart2, Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProductImage from '@/components/ProductImage';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { useComparisonStore } from '@/store/comparisonStore';
import type { ComparisonProduct } from '@/store/comparisonStore';
import type { ProductVariant } from '@/types';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';

// ─── Types ─────────────────────────────────────────────────────────────────────

type AddToCartState = 'idle' | 'loading' | 'success';

interface ProductCardProps {
  product: any;
  onQuickView?: (productId: string, triggerRef: React.RefObject<HTMLElement>) => void;
}

// ─── Helper ────────────────────────────────────────────────────────────────────

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return `${BACKEND_URL}${path}`;
  return path;
};

// ─── Component ─────────────────────────────────────────────────────────────────

const ProductCard = ({ product, onQuickView }: ProductCardProps) => {
  const navigate = useNavigate();
  const { addItem: addToCart } = useCartStore();
  const { isWishlisted, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const { addProduct } = useComparisonStore();

  const wishlisted = isWishlisted(product._id);
  const [addToCartState, setAddToCartState] = useState<AddToCartState>('idle');

  // ── Variant selection ──────────────────────────────────────────────────────
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

  // Build "effective" variant list: if variants exist use them,
  // otherwise treat the base fields as the single option
  const variantList: ProductVariant[] = hasVariants
    ? product.variants
    : [{ weight: product.weight, price: product.price, originalPrice: product.originalPrice, stock: product.stock }];

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(variantList[0]);

  // Sync selected variant when product changes
  useEffect(() => {
    if (variantList.length > 0) {
      setSelectedVariant(variantList[0]);
    }
  }, [product._id, product.variants]);

  // Derived price / stock from selected variant
  const activePrice = selectedVariant?.price ?? product.price;
  const activeOriginalPrice = selectedVariant?.originalPrice ?? product.originalPrice;
  const activeStock = selectedVariant?.stock ?? product.stock;

  // ── Discount ──────────────────────────────────────────────────────────────
  const discount =
    activeOriginalPrice && activeOriginalPrice > activePrice
      ? Math.round(((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100)
      : 0;

  // ── Stock helpers ─────────────────────────────────────────────────────────
  const isOutOfStock = activeStock === 0;
  const isLowStock = activeStock > 0 && activeStock <= 10;

  const renderStockBadge = () => {
    if (isOutOfStock)
      return <Badge variant="destructive" className="text-xs">Out of Stock</Badge>;
    if (isLowStock)
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs">Low Stock</Badge>;
    return <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">In Stock</Badge>;
  };

  // Ref passed to onQuickView
  const quickViewRef = useRef<HTMLButtonElement>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (addToCartState !== 'idle') return;
    setAddToCartState('loading');

    addToCart({
      _id: product._id,
      id: product._id,
      name: product.name,
      price: activePrice,
      image: getImageUrl(product.image),
      quantity: 1,
      weight: selectedVariant.weight,
      description: product.description,
    } as any);

    setTimeout(() => {
      setAddToCartState('success');
      setTimeout(() => setAddToCartState('idle'), 1500);
    }, 200);

    toast.success(`${product.name} (${selectedVariant.weight}) added to cart!`, {
      description: 'View your cart to checkout',
    });
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please log in to add to wishlist');
      return;
    }

    const wishlistItem = {
      id: product._id,
      name: product.name,
      price: activePrice,
      originalPrice: activeOriginalPrice,
      image: product.image,
      category: typeof product.category === 'string' ? product.category : product.category?.name,
      rating: product.rating,
    };

    if (wishlisted) {
      removeFromWishlist(product._id);
      toast.success('Removed from wishlist');
      try {
        await apiClient.delete(`/wishlist/${product._id}`);
      } catch {
        addToWishlist(wishlistItem);
        toast.error('Failed to update wishlist');
      }
    } else {
      addToWishlist(wishlistItem);
      toast.success('Added to wishlist');
      try {
        await apiClient.post(`/wishlist/${product._id}`);
      } catch {
        removeFromWishlist(product._id);
        toast.error('Failed to update wishlist');
      }
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product._id, quickViewRef as React.RefObject<HTMLElement>);
    } else {
      navigate(`/product/${product._id}`);
    }
  };

  const handleAddToComparison = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const compProduct: ComparisonProduct = {
      id: product._id,
      name: product.name,
      price: activePrice,
      originalPrice: activeOriginalPrice,
      rating: product.rating ?? 0,
      weight: selectedVariant.weight ?? '',
      category: typeof product.category === 'string' ? product.category : product.category?.name ?? '',
      stock: activeStock,
      description: product.description ?? '',
      image: getImageUrl(product.image),
    };
    addProduct(compProduct);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="group card-ornate bg-card overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-elevated h-full flex flex-col relative text-left border border-border hover:border-primary/50 rounded-2xl">
      {/* Decorative corner flourishes */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/0 group-hover:border-primary/40 transition-colors duration-300 z-10" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary/0 group-hover:border-primary/40 transition-colors duration-300 z-10" />

      {/* ── Image Container ──────────────────────────────────────────────── */}
      <div className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden bg-gradient-to-br from-secondary/30 to-background">
        <Link to={`/product/${product._id}`} className="block w-full h-full">
          <ProductImage
            src={getImageUrl(product.images?.[0] || product.image) || 'https://via.placeholder.com/400'}
            alt={product.name}
            isAboveFold={false}
            aspectRatio="3/4"
            fallbackSrc="https://via.placeholder.com/400"
            className="w-full h-full transition-transform duration-200 group-hover:scale-[1.1]"
          />
        </Link>

        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* ── Badges ──────────────────────────────────────────────────────── */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {product.isNew && (
            <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-600 to-coriander text-white text-xs font-bold rounded-full shadow-lg border border-white/30 backdrop-blur-sm">
              <Sparkles className="w-3 h-3" /> NEW
            </div>
          )}
          {product.isBestseller && (
            <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-spice text-white text-xs font-bold rounded-full shadow-lg border border-white/30 backdrop-blur-sm">
              <Star className="w-3 h-3 fill-white" /> BESTSELLER
            </div>
          )}
          {discount > 0 && (
            <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-600 to-chili text-white text-xs font-bold rounded-full shadow-lg border border-white/30 backdrop-blur-sm">
              {discount}% OFF
            </div>
          )}
        </div>

        {/* ── Action buttons ──────────────────────────────────────────────── */}
        <div className="absolute top-4 right-4 flex flex-col gap-3 z-10 opacity-0 group-hover:opacity-100 translate-x-10 group-hover:translate-x-0 transition-all duration-300">
          <Button
            variant="secondary"
            size="icon"
            className={`rounded-full shadow-lg w-10 h-10 backdrop-blur-sm transition-all duration-300 ${
              wishlisted ? 'bg-white/80 text-chili hover:bg-red-50/90' : 'bg-white/70 hover:bg-white/90 text-gray-700'
            }`}
            onClick={handleWishlist}
            aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          >
            <motion.div animate={{ scale: wishlisted ? [1, 1.4, 1] : 1 }} transition={{ duration: 0.3 }}>
              <Heart className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} />
            </motion.div>
          </Button>

          <Button
            ref={quickViewRef}
            variant="secondary"
            size="icon"
            className="rounded-full shadow-lg w-10 h-10 backdrop-blur-sm transition-all duration-300 delay-75 bg-white/70 hover:bg-white/90 text-gray-700"
            onClick={handleQuickView}
            aria-label={`Quick view ${product.name}`}
          >
            <Eye className="w-5 h-5" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="rounded-full shadow-lg w-10 h-10 backdrop-blur-sm transition-all duration-300 delay-100 bg-white/70 hover:bg-white/90 text-gray-700"
            onClick={handleAddToComparison}
            aria-label="Add to comparison"
          >
            <BarChart2 className="w-5 h-5" />
          </Button>
        </div>

        {/* ── Quick Add Button - Desktop ────────────────────────────────── */}
        <div className="absolute inset-x-0 bottom-0 p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 hidden sm:block bg-gradient-to-t from-black/70 to-transparent pt-16">
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock || addToCartState !== 'idle'}
            aria-label={`Add ${product.name} to cart`}
            className="w-full bg-gradient-spice text-white hover:opacity-90 font-serif font-bold tracking-wide py-6 rounded-xl shadow-lg border-none transition-all duration-300"
          >
            {addToCartState === 'loading' && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {addToCartState === 'success' && <Check className="w-5 h-5 mr-2" />}
            {addToCartState === 'idle' && <ShoppingCart className="w-5 h-5 mr-2" />}
            {addToCartState === 'loading' ? 'Adding…' : addToCartState === 'success' ? 'Added!' : 'Add to Cart'}
          </Button>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="p-3 sm:p-5 flex flex-col flex-1 relative bg-card border-t border-primary/10">
        {/* Category */}
        <div className="mb-2">
          {product.category && (
            <Link
              to={`/categories?category=${typeof product.category === 'string' ? product.category : product.category._id}`}
              className="inline-block"
            >
              <span className="text-[10px] font-bold tracking-[0.2em] text-saffron uppercase hover:text-primary transition-colors">
                · {typeof product.category === 'string' ? product.category : product.category.name}
              </span>
            </Link>
          )}
        </div>

        {/* Name */}
        <h3 className="font-serif font-bold text-lg sm:text-xl text-foreground mb-1 sm:mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors capitalize">
          <Link to={`/product/${product._id}`}>{product.name}</Link>
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 sm:gap-2 mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 sm:w-4 sm:h-4 ${i < Math.round(product.rating || 0) ? 'fill-saffron text-saffron' : 'fill-gray-100 text-gray-200'}`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-muted-foreground">({product.reviews || 0})</span>
        </div>

        {/* ── Variant Weight Selector ──────────────────────────────────── */}
        {variantList.length > 1 && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Select Weight</p>
            <div className="flex flex-wrap gap-1.5">
              {variantList.map((v) => {
                const isSelected = v.weight === selectedVariant.weight;
                const isOOS = v.stock === 0;
                return (
                  <button
                    key={v.weight}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!isOOS) setSelectedVariant(v); }}
                    disabled={isOOS}
                    title={isOOS ? 'Out of stock' : `${v.weight} — ₹${v.price}`}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all duration-200 ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : isOOS
                        ? 'border-border text-muted-foreground/40 line-through cursor-not-allowed bg-muted/30'
                        : 'border-border text-foreground hover:border-primary/60 hover:bg-primary/5 cursor-pointer'
                    }`}
                  >
                    {v.weight}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Single weight display (no variants) */}
        {variantList.length === 1 && selectedVariant.weight && (
          <p className="text-xs text-muted-foreground mb-2">
            <span className="font-medium text-foreground">Weight:</span> {selectedVariant.weight}
          </p>
        )}

        {/* Stock badge */}
        <div className="mb-1">{renderStockBadge()}</div>
        {activeStock >= 1 && activeStock <= 9 && (
          <p className="text-xs font-semibold text-amber-600 mb-1">Only {activeStock} left!</p>
        )}

        {/* ── Price row ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-auto pt-4">
          {/* Ornate divider */}
          <div className="absolute left-3 right-3 sm:left-5 sm:right-5" style={{ bottom: 'calc(3.5rem + 1px)' }}>
            <div className="divider-ornate" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-lg sm:text-2xl font-bold text-primary">
                ₹{activePrice.toFixed(0)}
              </span>
              {activeOriginalPrice && activeOriginalPrice > activePrice && (
                <span className="text-sm text-muted-foreground line-through decoration-destructive/60">
                  ₹{activeOriginalPrice.toFixed(0)}
                </span>
              )}
            </div>
            {discount > 0 && (
              <span className="text-[10px] font-bold text-green-600">Save ₹{(activeOriginalPrice! - activePrice).toFixed(0)} ({discount}% off)</span>
            )}
          </div>

          {/* Mobile Cart Button */}
          <Button
            variant="default"
            size="sm"
            className="rounded-full w-10 h-10 p-0 shadow-md bg-gradient-spice hover:opacity-90 text-white sm:hidden"
            onClick={handleAddToCart}
            disabled={isOutOfStock || addToCartState !== 'idle'}
            aria-label={`Add ${product.name} to cart`}
          >
            {addToCartState === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
            {addToCartState === 'success' && <Check className="w-5 h-5" />}
            {addToCartState === 'idle' && <ShoppingCart className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
