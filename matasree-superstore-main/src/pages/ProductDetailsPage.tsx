import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useProduct, useProducts } from '@/hooks/useApi';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { toast } from 'sonner';
import {
    Star, ShoppingCart, Heart, Minus, Plus, Truck, Shield, RotateCcw,
    ChevronRight, Package, ArrowLeft, Leaf
} from 'lucide-react';

const ProductDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: productData, isLoading } = useProduct(id || '');
    const { addItem } = useCartStore();
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [isWishlisted, setIsWishlisted] = useState(false);

    // Extract product
    const product = useMemo(() => {
        if (!productData) return null;
        return productData.data?.data || productData.data || productData;
    }, [productData]);

    // Get related products
    const categoryId = product?.category?._id || product?.category;
    const { data: relatedData } = useProducts({ category: categoryId, limit: 4 });
    const relatedProducts = useMemo(() => {
        if (!relatedData) return [];
        const arr = relatedData.data?.data?.products || relatedData.data?.products || relatedData.data || [];
        return Array.isArray(arr) ? arr.filter((p: any) => p._id !== id).slice(0, 4) : [];
    }, [relatedData, id]);

    const getImageUrl = (path: string | null | undefined): string => {
        if (!path) return 'https://via.placeholder.com/600';
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        const BACKEND_URL = 'http://localhost:5001';
        return path.startsWith('/') ? `${BACKEND_URL}${path}` : `${BACKEND_URL}/${path}`;
    };

    const handleAddToCart = () => {
        if (!product) return;
        for (let i = 0; i < quantity; i++) {
            addItem({
                id: product._id,
                name: product.name,
                price: product.price,
                image: getImageUrl(product.image),
                quantity: 1,
            } as any);
        }
        toast.success(`${product.name} added to cart!`, { description: `${quantity} item(s) added` });
    };

    const handleWishlist = () => {
        setIsWishlisted(!isWishlisted);
        toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    };

    const allImages = useMemo(() => {
        if (!product) return [];
        const imgs = [product.image];
        if (product.images && Array.isArray(product.images)) {
            imgs.push(...product.images);
        }
        return imgs.filter(Boolean);
    }, [product]);

    const discount = product?.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 pt-24 pb-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <Skeleton className="aspect-square rounded-2xl" />
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-14 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 pt-24 pb-12 text-center">
                    <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="font-serif text-2xl font-bold mb-2">Product Not Found</h2>
                    <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
                    <Button onClick={() => navigate('/products')} className="bg-gradient-spice text-white">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="page-enter">
                {/* Breadcrumb */}
                <div className="container mx-auto px-4 pt-24 pb-4">
                    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
                    </nav>
                </div>

                {/* Product Details */}
                <div className="container mx-auto px-4 pb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

                        {/* Left: Image Gallery */}
                        <div className="space-y-4">
                            {/* Main Image */}
                            <div className="relative aspect-square rounded-3xl overflow-hidden bg-secondary/20 shadow-card group">
                                <img
                                    src={getImageUrl(allImages[selectedImage])}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/600'; }}
                                />
                                {discount > 0 && (
                                    <Badge className="absolute top-6 left-6 bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                                        {discount}% OFF
                                    </Badge>
                                )}
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className={`absolute top-6 right-6 rounded-full w-12 h-12 shadow-lg transition-all ${isWishlisted ? 'bg-red-50 text-red-500' : 'bg-white/90 text-gray-600 hover:bg-white'}`}
                                    onClick={handleWishlist}
                                >
                                    <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                                </Button>
                            </div>

                            {/* Thumbnail Gallery */}
                            {allImages.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {allImages.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedImage(i)}
                                            className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-primary shadow-md scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                        >
                                            <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Product Info */}
                        <div className="flex flex-col">
                            {/* Category & Badges */}
                            <div className="flex items-center gap-3 mb-4">
                                {product.category && (
                                    <Link to={`/products?category=${typeof product.category === 'string' ? product.category : product.category.name}`}>
                                        <Badge variant="secondary" className="text-primary font-bold uppercase tracking-wider text-xs hover:bg-primary/10 transition-colors">
                                            {typeof product.category === 'string' ? product.category : product.category.name}
                                        </Badge>
                                    </Link>
                                )}
                                {product.isBestseller && <Badge className="bg-gradient-spice text-white">⭐ Bestseller</Badge>}
                                {product.isNewProduct && <Badge className="bg-green-600 text-white">✨ New</Badge>}
                            </div>

                            {/* Title */}
                            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight capitalize">
                                {product.name}
                            </h1>

                            {/* Rating */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-5 h-5 ${i < Math.round(product.rating || 0) ? 'fill-primary text-primary' : 'fill-gray-200 text-gray-200'}`} />
                                    ))}
                                </div>
                                <span className="text-sm text-muted-foreground font-medium">
                                    {product.rating || 0} ({product.reviews || 0} reviews)
                                </span>
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline gap-4 mb-6 pb-6 border-b border-border">
                                <span className="font-serif text-4xl font-bold text-foreground">₹{(product.price || 0).toFixed(0)}</span>
                                {product.originalPrice && product.originalPrice > product.price && (
                                    <>
                                        <span className="text-xl text-muted-foreground line-through">₹{product.originalPrice.toFixed(0)}</span>
                                        <Badge className="bg-green-100 text-green-800 font-bold">Save ₹{(product.originalPrice - product.price).toFixed(0)}</Badge>
                                    </>
                                )}
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Description</h3>
                                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                            </div>

                            {/* Product Meta */}
                            <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-border">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Package className="w-4 h-4 text-primary" />
                                    <span>Weight: <strong className="text-foreground">{product.weight}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Leaf className="w-4 h-4 text-green-600" />
                                    <span>Stock: <strong className="text-foreground">{product.stock > 0 ? `${product.stock} available` : 'Out of Stock'}</strong></span>
                                </div>
                            </div>

                            {/* Quantity & Add to Cart */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
                                <div className="flex items-center border-2 border-border rounded-xl overflow-hidden">
                                    <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="rounded-none h-14 w-14">
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                    <span className="w-16 h-14 flex items-center justify-center font-bold text-lg border-x-2 border-border">{quantity}</span>
                                    <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)} className="rounded-none h-14 w-14">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={product.stock <= 0}
                                    className="flex-1 bg-gradient-spice hover:opacity-90 text-white font-bold py-7 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all group"
                                >
                                    <ShoppingCart className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                    {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                </Button>
                            </div>

                            {/* Trust badges */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { icon: Truck, label: 'Free Delivery', sub: 'Orders over ₹499' },
                                    { icon: Shield, label: 'Quality Assured', sub: '100% Pure' },
                                    { icon: RotateCcw, label: 'Easy Returns', sub: '7-day policy' },
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col items-center text-center p-3 bg-secondary/50 rounded-xl">
                                        <item.icon className="w-5 h-5 text-primary mb-1" />
                                        <span className="text-xs font-bold text-foreground">{item.label}</span>
                                        <span className="text-[10px] text-muted-foreground">{item.sub}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Related Products */}
                    {relatedProducts.length > 0 && (
                        <section className="mt-20 pt-12 border-t border-border">
                            <h2 className="font-serif text-3xl font-bold text-foreground mb-8">
                                You May Also <span className="text-gradient-spice">Like</span>
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                {relatedProducts.map((rp: any) => (
                                    <Link key={rp._id} to={`/product/${rp._id}`} className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/40 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                                        <div className="aspect-square overflow-hidden bg-secondary/20">
                                            <img src={getImageUrl(rp.image)} alt={rp.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                                        </div>
                                        <div className="p-3">
                                            <h4 className="font-serif font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors capitalize">{rp.name}</h4>
                                            <p className="font-serif font-bold text-lg mt-1">₹{(rp.price || 0).toFixed(0)}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>
            <Footer />
            <CartDrawer />
        </div>
    );
};

export default ProductDetailsPage;
