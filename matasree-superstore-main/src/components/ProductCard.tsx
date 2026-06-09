import { Star, ShoppingCart, Heart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: any;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCartStore();
  const { isWishlisted, toggleWishlist } = useWishlistStore();
  const wishlisted = isWishlisted(product._id);

  // Helper function to construct proper image URL
  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // Hardcoded backend URL to ensure it works
    const BACKEND_URL = 'http://localhost:5001';
    if (path.startsWith('/')) {
      return `${BACKEND_URL}${path}`;
    }
    return path;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if clicking the button
    e.stopPropagation();

    // Convert backend product to cart item format
    const cartItem = {
      id: product._id,
      name: product.name,
      price: product.price,
      image: getImageUrl(product.image),
      quantity: 1,
    };
    addItem(cartItem as any);
    toast.success(`${product.name} added to cart!`, {
      description: 'View your cart to checkout',
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      id: product._id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      category: typeof product.category === 'string' ? product.category : product.category?.name,
      rating: product.rating,
    });
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group card-ornate bg-card overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:shadow-elevated h-full flex flex-col relative text-left border-2 border-primary/20 hover:border-primary/60">
      {/* Decorative corner flourish - top left */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/0 group-hover:border-primary/40 transition-colors duration-300 z-10" />
      {/* Decorative corner flourish - top right */}
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary/0 group-hover:border-primary/40 transition-colors duration-300 z-10" />

      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary/10">
        <Link to={`/product/${product._id}`} className="block w-full h-full">
          <img
            src={getImageUrl(product.image) || 'https://via.placeholder.com/400'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />
        </Link>

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Badges */}
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

        {/* Action buttons - Right side */}
        <div className="absolute top-4 right-4 flex flex-col gap-3 z-10 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
          <Button
            variant="secondary"
            size="icon"
            className={`rounded-full shadow-lg w-10 h-10 transition-all duration-300 ${wishlisted ? 'bg-white text-chili hover:bg-red-50' : 'bg-white/90 hover:bg-white text-gray-700'
              }`}
            onClick={handleWishlist}
          >
            <Heart className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full shadow-lg w-10 h-10 transition-all duration-300 delay-75 bg-white/90 hover:bg-white text-gray-700"
            asChild
          >
            <Link to={`/product/${product._id}`}>
              <Eye className="w-5 h-5" />
            </Link>
          </Button>
        </div>

        {/* Quick Add Button - Bottom (Desktop) */}
        <div className="absolute inset-x-0 bottom-0 p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 hidden sm:block bg-gradient-to-t from-black/70 to-transparent pt-16">
          <Button
            onClick={handleAddToCart}
            className="w-full bg-white text-foreground hover:bg-primary hover:text-white font-serif font-bold tracking-wide py-6 rounded-xl shadow-lg border-none transition-all duration-300"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 relative bg-card">
        {/* Category */}
        <div className="mb-2">
          {product.category && (
            <Link
              to={`/categories?category=${typeof product.category === 'string' ? product.category : product.category._id}`}
              className="inline-block"
            >
              <span className="text-[10px] font-bold tracking-[0.2em] text-saffron uppercase hover:text-primary transition-colors">
                {typeof product.category === 'string' ? product.category : product.category.name}
              </span>
            </Link>
          )}
        </div>

        {/* Name */}
        <h3 className="font-serif font-bold text-xl text-foreground mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors capitalize">
          <Link to={`/product/${product._id}`}>
            {product.name}
          </Link>
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < Math.round(product.rating || 0)
                  ? 'fill-saffron text-saffron'
                  : 'fill-gray-100 text-gray-200'
                  }`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-muted-foreground">({product.reviews || 0} reviews)</span>
        </div>

        {/* Price & Original Price */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-dashed border-border/60">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-foreground">₹{(product.price || 0).toFixed(2)}</span>
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
          >
            <ShoppingCart className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;