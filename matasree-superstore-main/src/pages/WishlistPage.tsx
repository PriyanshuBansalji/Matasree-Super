import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { toast } from 'sonner';
import { Heart, ShoppingCart, Trash2, ArrowRight, Star, Loader2 } from 'lucide-react';
import PageHelmet from '@/components/PageHelmet';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return 'https://via.placeholder.com/300';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return path.startsWith('/') ? `${BACKEND_URL}${path}` : `${BACKEND_URL}/${path}`;
};

const WishlistPage = () => {
    const { items, removeItem, clearWishlist, setItems } = useWishlistStore();
    const { addItem, setCartOpen } = useCartStore();
    const { isAuthenticated } = useAuthStore();

    const [isLoading, setIsLoading] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);

    // Load wishlist from backend on mount
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchWishlist = async () => {
            setIsLoading(true);
            try {
                const response: any = await apiClient.getWishlist();
                const backendItems = (response?.data?.items ?? []).map((entry: any) => ({
                    id: entry.productId,
                    name: entry.product?.name ?? '',
                    price: entry.product?.price ?? 0,
                    originalPrice: entry.product?.originalPrice,
                    image: getImageUrl(entry.product?.image ?? ''),
                    category: entry.product?.category,
                    rating: entry.product?.rating,
                    weight: entry.product?.weight,
                    variants: entry.product?.variants ?? [],
                    stock: entry.product?.stock ?? 0,
                }));
                setItems(backendItems);
            } catch {
                // Fall back to local store silently
            } finally {
                setIsLoading(false);
            }
        };

        fetchWishlist();
    }, [isAuthenticated]);

    // Get default variant: first in-stock variant, or first variant, or base product
    const getDefaultVariant = (item: any) => {
        if (Array.isArray(item.variants) && item.variants.length > 0) {
            const inStock = item.variants.find((v: any) => v.stock > 0);
            return inStock ?? item.variants[0];
        }
        return { weight: item.weight, price: item.price, originalPrice: item.originalPrice, stock: item.stock };
    };

    const handleAddToCart = (item: any) => {
        const variant = getDefaultVariant(item);
        const product = {
            id: item.id,
            name: item.name || 'Product',
            description: item.description || '',
            price: variant.price ?? item.price ?? 0,
            originalPrice: variant.originalPrice ?? item.originalPrice,
            image: getImageUrl(item.image),
            category: item.category || '',
            rating: item.rating ?? 0,
            reviews: item.reviews ?? 0,
            inStock: typeof item.inStock === 'boolean' ? item.inStock : true,
            weight: variant.weight ?? item.weight ?? '',
            isNew: item.isNew || false,
            isBestseller: item.isBestseller || false,
            quantity: 1,
        } as any;

        addItem(product);
        try {
            setCartOpen(true);
        } catch {
            // ignore
        }

        const weightLabel = variant.weight ? ` (${variant.weight})` : '';
        toast.success(`${item.name}${weightLabel} added to cart!`);
    };

    const handleRemove = async (id: string, name: string) => {
        // Optimistic remove
        removeItem(id);
        setRemovingId(id);
        try {
            await apiClient.removeFromWishlist(id);
            toast.success(`${name} removed from wishlist`);
        } catch {
            toast.error('Failed to remove from wishlist');
        } finally {
            setRemovingId(null);
        }
    };

    const handleClearAll = async () => {
        const snapshot = [...items];
        clearWishlist();
        try {
            // Remove all items from backend in parallel
            await Promise.all(snapshot.map((item) => apiClient.removeFromWishlist(item.id)));
            toast.success('Wishlist cleared');
        } catch {
            // Restore on failure
            setItems(snapshot);
            toast.error('Failed to clear wishlist');
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <PageHelmet
                title="My Wishlist | Matasree Super Masale"
                description="View your saved spices and masalas on Matasree Super Masale."
                canonicalUrl="https://matasreesuper.com/wishlist"
                noIndex={true}
            />
            <Navbar />
            <main className="page-enter container mx-auto px-4 pt-24 pb-16">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
                            <Heart className="w-8 h-8 text-red-500 fill-red-500" /> My Wishlist
                        </h1>
                        <p className="text-muted-foreground mt-1">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
                    </div>
                    {items.length > 0 && (
                        <Button variant="outline" size="sm" onClick={handleClearAll} className="text-red-500 border-red-200 hover:bg-red-50">
                            Clear All
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-80 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : items.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((item) => {
                            const variant = getDefaultVariant(item);
                            const displayPrice = variant.price ?? item.price ?? 0;
                            const displayOriginalPrice = variant.originalPrice ?? item.originalPrice;
                            const displayWeight = variant.weight ?? item.weight;
                            return (
                            <div key={item.id} className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                                {/* Image */}
                                <Link to={`/product/${item.id}`} className="block relative aspect-square overflow-hidden bg-secondary/20">
                                    <img
                                        src={getImageUrl(item.image)}
                                        alt={item.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>

                                {/* Content */}
                                <div className="p-4">
                                    {item.category && (
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{item.category}</span>
                                    )}
                                    <Link to={`/product/${item.id}`}>
                                        <h3 className="font-serif font-bold text-lg text-foreground line-clamp-2 mt-1 group-hover:text-primary transition-colors capitalize">
                                            {item.name}
                                        </h3>
                                    </Link>

                                    {/* Rating */}
                                    <div className="flex items-center gap-1 mt-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(item.rating || 0) ? 'fill-primary text-primary' : 'fill-gray-200 text-gray-200'}`} />
                                        ))}
                                    </div>

                                    {/* Price with strikethrough */}
                                    <div className="flex items-baseline gap-2 mt-3">
                                        <span className="font-serif text-xl font-bold text-primary">₹{displayPrice.toFixed(0)}</span>
                                        {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                                            <>
                                                <span className="text-sm text-muted-foreground line-through">₹{displayOriginalPrice.toFixed(0)}</span>
                                                <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                                                    {Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)}% off
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    {displayWeight && (
                                        <p className="text-xs text-muted-foreground mt-1">{displayWeight}</p>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 mt-4">
                                        <Button onClick={() => handleAddToCart(item)} className="flex-1 bg-gradient-spice text-white rounded-xl text-sm font-bold hover:shadow-md transition-all">
                                            <ShoppingCart className="w-4 h-4 mr-1" /> Add to Cart
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleRemove(item.id, item.name)}
                                            disabled={removingId === item.id}
                                            className="rounded-xl w-10 h-10 text-red-500 border-red-200 hover:bg-red-50"
                                            aria-label={`Remove ${item.name} from wishlist`}
                                        >
                                            {removingId === item.id
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Trash2 className="w-4 h-4" />
                                            }
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                            <Heart className="w-12 h-12 text-red-300" />
                        </div>
                        <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Your Wishlist is Empty</h2>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            Save your favorite products here! Browse our collection and tap the heart icon to add items to your wishlist.
                        </p>
                        <Button asChild className="bg-gradient-spice text-white px-8 py-6 rounded-xl text-lg font-bold">
                            <Link to="/products" className="flex items-center gap-2">
                                Explore Products <ArrowRight className="w-5 h-5" />
                            </Link>
                        </Button>
                    </div>
                )}
            </main>
            <Footer />
            <CartDrawer />
        </div>
    );
};

export default WishlistPage;
