import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Heart, Eye, BarChart2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProductImage from '@/components/ProductImage';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { useComparisonStore } from '@/store/comparisonStore';
import type { ComparisonProduct } from '@/store/comparisonStore';
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

const BACKEND_URL = 'http://localhost:5001';

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

  // Ref passed to onQuickView so the modal can return focus
  const quickViewRef = useRef<HTMLButtonElement>(null);

  // ── Stock helpers ─────────────────────────────────────────────────────────────
  const stock: number = product.stock ?? 0;
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 10;

  // ── Discount ──────────────────────────────────────────────────────────────────
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  // ── Stock badge ───────────────────────────────────────────────────────────────
  const renderStockBadge = () => {
    if (isOutOfStock)
      return (
        <Badge variant="destructive" className="text-xs">
          Out of Stock
        </Badge>
      );
    if (isLowStock)
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs">
          Low Stock
        </Badge>
      );
    return (
      <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">
        In Stock
      </Badge>
    );
  };

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (addToCartState !== 'idle') return;

    setAddToCartState('loading');

    const cartItem = {
      id: product._id,
      name: product.name,
      price: product.price,
      image: getImageUrl(product.image),
      quantity: 1,
    };
    addToCart(cartItem as any);

    // Brief pause to show spinner, then show checkmark for 1500ms
    setTimeout(() => {
      setAddToCartState('success');
      setTimeout(() => {
        setAddToCartState('idle');
      }, 1500);
    }, 200);

    toast.success(`${product.name} added to cart!`, {
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
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      category:
        typeof product.category === 'string' ? product.category : product.category?.name,
      rating: product.rating,
    };

    if (wishlisted) {
      // Optimistic remove
      removeFromWishlist(product._id);
      toast.success('Removed from wishlist');
      try {
        await apiClient.delete(`/wishlist/${product._id}`);
      } catch {
        // Revert on error
        addToWishlist(wishlistItem);
        toast.error('Failed to update wishlist');
      }
    } else {
      // Optimistic add
      addToWishlist(wishlistItem);
      toast.success('Added to wishlist');
      try {
        await apiClient.post(`/wishlist/${product._id}`);
      } catch {
        // Revert on error
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
      price: product.price,
      originalPrice: product.originalPrice,
      rating: product.rating ?? 0,
      weight: product.weight ?? '',
      category:
        typeof product.category === 'string'
          ? product.category
          : product.category?.name ?? '',
      stock: product.stock ?? 0,
      description: product.description ?? '',
      image: getImageUrl(product.image),
    };

    addProduct(compProduct);
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="group card-ornate bg-card overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:shadow-elevated h-full flex flex-col relative text-left border-2 border-primary/20 hover:border-primary/60">
      {/* Decorative corner flourish - top left */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/0 group-hover:border-primary/40 transition-colors duration-300 z-10" />
      {/* Decorative corner flourish - top right */}
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary/0 group-hover:border-primary/40 transition-colors duration-300 z-10" />

      {/* ── Image Container ────────────────────────────────────────────────────── */}
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary/10">
        <Link to={`/product/${product._id}`} className="block w-full h-full">
          <ProductImage
            src={getImageUrl(product.image) || 'https://via.placeholder.com/400'}
            alt={product.name}
            isAboveFold={false}
            aspectRatio="3/4"
            fallbackSrc="https://via.placeholder.com/400"
            className="w-full h-full transition-transform duration-200 group-hover:scale-[1.1]"
          />
        </Link>

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* ── Badges ──────────────────────────────────────────────────────────── */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {product.isNew && (
            <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-600 to-coriander text-white text-xs font-bold rounded-full shadow-lg border border-white/30 backdrop-blur-sm">
              <span>✨</span> NEW
            </div>
          )}
          {product.isBestseller && (
            <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-spice text-white text-xs font-bold rounded-full shadow-lg border border-white/30 backdrop-blur-sm">
              <span>⭐</span> BESTSELLER
            </div>
          )}
          {discount > 0 && (
            <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-600 to-chili text-white text-xs font-bold rounded-full shadow-lg border border-white/30 backdrop-blur-sm">
              {discount}% OFF
            </div>
          )}
        </div>

        {/* ── Action buttons - Right side ────────────────────────────────────── */}
        <div className="absolute top-4 right-4 flex flex-col gap-3 z-10 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
          {/* Wishlist button with Framer Motion heart animation */}
          <Button
            variant="secondary"
            size="icon"
            className={`rounded-full shadow-lg w-10 h-10 transition-all duration-300 ${
              wishlisted
                ? 'bg-white text-chili hover:bg-red-50'
                : 'bg-white/90 hover:bg-white text-gray-700'
            }`}
            onClick={handleWishlist}
            aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          >
            <motion.div
              animate={{ scale: wishlisted ? [1, 1.4, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} />
            </motion.div>
          </Button>

          {/* Quick View / Eye button */}
          <Button
            ref={quickViewRef}
            variant="secondary"
            size="icon"
            className="rounded-full shadow-lg w-10 h-10 transition-all duration-300 delay-75 bg-white/90 hover:bg-white text-gray-700"
            onClick={handleQuickView}
            aria-label={`Quick view ${product.name}`}
          >
            <Eye className="w-5 h-5" />
          </Button>

          {/* Compare button */}
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full shadow-lg w-10 h-10 transition-all duration-300 delay-100 bg-white/90 hover:bg-white text-gray-700"
            onClick={handleAddToComparison}
            aria-label="Add to comparison"
          >
            <BarChart2 className="w-5 h-5" />
          </Button>
        </div>

        {/* ── Quick Add Button - Bottom (Desktop) ───────────────────────────── */}
        <div className="absolute inset-x-0 bottom-0 p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 hidden sm:block bg-gradient-to-t from-black/70 to-transparent pt-16">
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock || addToCartState !== 'idle'}
            aria-label={`Add ${product.name} to cart`}
            className="w-full bg-white text-foreground hover:bg-primary hover:text-white font-serif font-bold tracking-wide py-6 rounded-xl shadow-lg border-none transition-all duration-300"
          >
            {addToCartState === 'loading' && (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            )}
            {addToCartState === 'success' && (
              <Check className="w-5 h-5 mr-2" />
            )}
            {addToCartState === 'idle' && (
              <ShoppingCart className="w-5 h-5 mr-2" />
            )}
            {addToCartState === 'loading'
              ? 'Adding…'
              : addToCartState === 'success'
              ? 'Added!'
              : 'Add to Cart'}
          </Button>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      <div className="p-5 flex flex-col flex-1 relative bg-card">
        {/* Category */}
        <div className="mb-2">
          {product.category && (
            <Link
              to={`/categories?category=${
                typeof product.category === 'string'
                  ? product.category
                  : product.category._id
              }`}
              className="inline-block"
            >
              <span className="text-[10px] font-bold tracking-[0.2em] text-saffron uppercase hover:text-primary transition-colors">
                {typeof product.category === 'string'
                  ? product.category
                  : product.category.name}
              </span>
            </Link>
          )}
        </div>

        {/* Name */}
        <h3 className="font-serif font-bold text-xl text-foreground mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors capitalize">
          <Link to={`/product/${product._id}`}>{product.name}</Link>
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(product.rating || 0)
                    ? 'fill-saffron text-saffron'
                    : 'fill-gray-100 text-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            ({product.reviews || 0} reviews)
          </span>
        </div>

        {/* Weight */}
        {product.weight && (
          <p className="text-xs text-muted-foreground mb-2">
            <span className="font-medium text-foreground">Weight:</span> {product.weight}
          </p>
        )}

        {/* Stock status badge */}
        <div className="mb-2">{renderStockBadge()}</div>

        {/* Low-stock indicator */}
        {stock >= 1 && stock <= 9 && (
          <p className="text-xs font-semibold text-amber-600 mb-2">
            Only {stock} left in stock!
          </p>
        )}

        {/* ── Price row ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-dashed border-border/60">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-foreground">
                ₹{(product.price || 0).toFixed(2)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-muted-foreground line-through decoration-destructive/40">
                  ₹{product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Mobile Cart Button */}
          <Button
            variant="default"
            size="sm"
            className="rounded-full w-10 h-10 p-0 shadow-md bg-primary hover:bg-primary/90 text-white sm:hidden"
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
