import { Link } from 'react-router-dom';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { toast } from 'sonner';
import { Heart, ShoppingCart, Trash2, ArrowRight, Star } from 'lucide-react';
import PageHelmet from '@/components/PageHelmet';

const WishlistPage = () => {
    const { items, removeItem, clearWishlist } = useWishlistStore();
    const { addItem } = useCartStore();

    const getImageUrl = (path: string | null | undefined): string => {
        if (!path) return 'https://via.placeholder.com/300';
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        const BACKEND_URL = 'http://localhost:5001';
        return path.startsWith('/') ? `${BACKEND_URL}${path}` : `${BACKEND_URL}/${path}`;
    };

    const handleAddToCart = (item: any) => {
        addItem({
            id: item.id,
            name: item.name,
            price: item.price,
            image: getImageUrl(item.image),
            quantity: 1,
        } as any);
        toast.success(`${item.name} added to cart!`);
    };

    const handleRemove = (id: string, name: string) => {
        removeItem(id);
        toast.success(`${name} removed from wishlist`);
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
                        <Button variant="outline" size="sm" onClick={() => { clearWishlist(); toast.success('Wishlist cleared'); }} className="text-red-500 border-red-200 hover:bg-red-50">
                            Clear All
                        </Button>
                    )}
                </div>

                {items.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((item) => (
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

                                    {/* Price */}
                                    <div className="flex items-baseline gap-2 mt-3">
                                        <span className="font-serif text-xl font-bold">₹{(item.price || 0).toFixed(0)}</span>
                                        {item.originalPrice && item.originalPrice > item.price && (
                                            <span className="text-sm text-muted-foreground line-through">₹{item.originalPrice.toFixed(0)}</span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 mt-4">
                                        <Button onClick={() => handleAddToCart(item)} className="flex-1 bg-gradient-spice text-white rounded-xl text-sm font-bold hover:shadow-md transition-all">
                                            <ShoppingCart className="w-4 h-4 mr-1" /> Add to Cart
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleRemove(item.id, item.name)}
                                            className="rounded-xl w-10 h-10 text-red-500 border-red-200 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
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
