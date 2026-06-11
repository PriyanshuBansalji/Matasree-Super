import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useProduct } from '@/hooks/useApi';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import StickyAddToCartBar from '@/components/StickyAddToCartBar';
import TrustBadges from '@/components/TrustBadges';
import WhatsAppButton from '@/components/WhatsAppButton';
import RecentlyViewedSection from '@/components/RecentlyViewedSection';
import ProductImage from '@/components/ProductImage';
import PageHelmet from '@/components/PageHelmet';
import JsonLd, {
    buildProductSchema,
    buildBreadcrumbSchema,
} from '@/components/JsonLd';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';
import {
    Star, ShoppingCart, Heart, Minus, Plus,
    ChevronRight, Package, ArrowLeft, Share2
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const BACKEND_URL = 'http://localhost:5001';
const STORAGE_KEY = 'matasree-recently-viewed';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return 'https://via.placeholder.com/600';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return path.startsWith('/') ? `${BACKEND_URL}${path}` : `${BACKEND_URL}/${path}`;
};

/** Update the guest recently-viewed list in localStorage (max 10, deduplicated) */
const updateGuestRecentlyViewed = (productId: string) => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        let list: { productId: string; timestamp: number }[] = raw ? JSON.parse(raw) : [];
        // Remove existing entry for this product (dedup)
        list = list.filter((v) => v.productId !== productId);
        // Prepend most recent
        list.unshift({ productId, timestamp: Date.now() });
        // Sliding window of 10
        if (list.length > 10) list = list.slice(0, 10);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
        // ignore
    }
};

// ─── Component ────────────────────────────────────────────────────────────────

const ProductDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: productData, isLoading } = useProduct(id || '');
    const { addItem } = useCartStore();
    const { isAuthenticated, user } = useAuthStore();
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const primaryAddToCartRef = useRef<HTMLButtonElement>(null);

    // Related products state (lazy-loaded)
    const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
    const [relatedLoading, setRelatedLoading] = useState(false);

    // Frequently Bought Together state (lazy-loaded)
    const [fbtProducts, setFbtProducts] = useState<any[]>([]);

    // Reviews state
    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [reviewsTotal, setReviewsTotal] = useState(0);
    const REVIEWS_PER_PAGE = 10;

    // Review submission form state
    const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    // Extract product from API response
    const product = useMemo(() => {
        if (!productData) return null;
        return (productData as any).data?.data || (productData as any).data || productData;
    }, [productData]);

    const categoryId: string | undefined = product?.category?._id ?? (typeof product?.category === 'string' ? product?.category : undefined);

    // ── Record product view ────────────────────────────────────────────────────
    useEffect(() => {
        if (!product || !id) return;

        if (isAuthenticated) {
            // Fire-and-forget
            apiClient.addToRecentlyViewed(id).catch(() => {/* ignore */});
        } else {
            updateGuestRecentlyViewed(id);
        }
    }, [product, id, isAuthenticated]);

    // ── Lazy-load related products ─────────────────────────────────────────────
    const loadRelatedProducts = useCallback(async () => {
        if (!categoryId) return;
        setRelatedLoading(true);
        try {
            const res = await apiClient.getProducts({ category: categoryId, limit: 8 });
            const raw: any = res;
            const arr: any[] = raw?.data?.data?.products ?? raw?.data?.products ?? raw?.data ?? [];
            const filtered = Array.isArray(arr)
                ? arr.filter((p: any) => p._id !== id).slice(0, 8)
                : [];
            setRelatedProducts(filtered);

            // FBT: top-selling in same category (excluding current), need ≥2
            const resBest = await apiClient.getProducts({ category: categoryId, sort: 'sold', limit: 4 });
            const rawBest: any = resBest;
            const arrBest: any[] = rawBest?.data?.data?.products ?? rawBest?.data?.products ?? rawBest?.data ?? [];
            const fbt = Array.isArray(arrBest)
                ? arrBest.filter((p: any) => p._id !== id).slice(0, 3)
                : [];
            setFbtProducts(fbt.length >= 2 ? fbt : []);
        } catch {
            // ignore
        } finally {
            setRelatedLoading(false);
        }
    }, [categoryId, id]);

    useEffect(() => {
        if (!product) return;
        // Defer until after main content renders
        const timer = setTimeout(() => loadRelatedProducts(), 0);
        return () => clearTimeout(timer);
    }, [product, loadRelatedProducts]);

    // ── Load approved reviews ──────────────────────────────────────────────────
    const loadReviews = useCallback(async () => {
        if (!id) return;
        setReviewsLoading(true);
        try {
            const res: any = await apiClient.get('/reviews/approved', {
                params: { productId: id, page: reviewsPage, limit: REVIEWS_PER_PAGE },
            });
            const data = res?.data ?? res;
            const arr: any[] = data?.reviews ?? data?.data ?? [];
            const total: number = data?.total ?? data?.pagination?.total ?? arr.length;
            setReviews(Array.isArray(arr) ? arr : []);
            setReviewsTotal(total);
        } catch {
            setReviews([]);
        } finally {
            setReviewsLoading(false);
        }
    }, [id, reviewsPage]);

    useEffect(() => {
        if (!id) return;
        loadReviews();
    }, [id, reviewsPage, loadReviews]);

    // ── Image list ─────────────────────────────────────────────────────────────
    const allImages = useMemo(() => {
        if (!product) return [];
        const imgs: string[] = [product.image];
        if (product.images && Array.isArray(product.images)) {
            imgs.push(...product.images);
        }
        return imgs.filter(Boolean).slice(0, 8);
    }, [product]);

    const discount = product?.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    // ── Stock helpers ──────────────────────────────────────────────────────────
    const stock: number = product?.stock ?? 0;

    const renderStockIndicator = () => {
        if (stock === 0) {
            return <Badge variant="destructive">Out of Stock</Badge>;
        }
        if (stock <= 9) {
            return (
                <p className="text-sm font-semibold text-amber-600">
                    Only {stock} left in stock!
                </p>
            );
        }
        return <Badge className="bg-green-600 hover:bg-green-700 text-white">In Stock</Badge>;
    };

    // ── Handlers ──────────────────────────────────────────────────────────────
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

    const handleAddRelatedToCart = (rp: any) => {
        addItem({
            id: rp._id,
            name: rp.name,
            price: rp.price,
            image: getImageUrl(rp.image),
            quantity: 1,
        } as any);
        toast.success(`${rp.name} added to cart!`);
    };

    const handleAddAllFbt = () => {
        fbtProducts.forEach((rp: any) => {
            addItem({
                id: rp._id,
                name: rp.name,
                price: rp.price,
                image: getImageUrl(rp.image),
                quantity: 1,
            } as any);
        });
        toast.success(`${fbtProducts.length} items added to cart!`);
    };

    const handleWishlist = () => {
        setIsWishlisted(!isWishlisted);
        toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        if (reviewForm.rating === 0) {
            toast.error('Please select a star rating.');
            return;
        }
        if (reviewForm.comment.length < 10) {
            toast.error('Comment must be at least 10 characters.');
            return;
        }
        setReviewSubmitting(true);
        try {
            await apiClient.post('/reviews/submit', {
                productId: id,
                name: user?.name || 'Customer',
                rating: reviewForm.rating,
                comment: reviewForm.comment,
            });
            toast.success('Review submitted! It will be visible after approval.');
            setReviewForm({ rating: 0, comment: '' });
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 403) {
                toast.error('You must purchase this product before reviewing it.');
            } else if (status === 409) {
                toast.error('You have already reviewed this product.');
            } else {
                const msg = err?.response?.data?.message || err?.message || 'Failed to submit review.';
                toast.error(msg);
            }
        } finally {
            setReviewSubmitting(false);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title: product?.name, url });
            } catch {
                // user cancelled — no action needed
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                toast.success('Link copied to clipboard!');
            } catch {
                toast.error('Unable to copy link');
            }
        }
    };

    // ─── Loading skeleton ──────────────────────────────────────────────────────
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

    const fbtTotal = fbtProducts.reduce((sum: number, p: any) => sum + (p.price || 0), 0);

    return (
        <div className="min-h-screen bg-background">
            <PageHelmet
                title={`${product.name}${product.weight ? ` ${product.weight}` : ''} | Matasree Super Masale`}
                description={product.description || `Buy ${product.name} online from Matasree Super Masale — authentic premium Indian spices.`}
                ogImage={getImageUrl(product.images?.[0] ?? product.image)}
                ogType="product"
                canonicalUrl={`https://matasreesuper.com/product/${product._id}`}
            />
            {/* Product JSON-LD structured data (Req 27.1) */}
            <JsonLd
                schema={buildProductSchema({
                    name: product.name,
                    description: product.description || `Buy ${product.name} online from Matasree Super Masale.`,
                    image: getImageUrl(product.images?.[0] ?? product.image),
                    sku: product._id,
                    price: product.price,
                    stock: product.stock ?? 0,
                    reviewCount: product.reviews ?? 0,
                    ratingValue: product.rating ?? 0,
                    url: `https://matasreesuper.com/product/${product._id}`,
                })}
            />
            {/* BreadcrumbList JSON-LD structured data (Req 27.3) */}
            <JsonLd
                schema={buildBreadcrumbSchema([
                    { name: 'Home', url: 'https://matasreesuper.com/' },
                    { name: 'Products', url: 'https://matasreesuper.com/products' },
                    ...(product.category
                        ? [{
                            name: typeof product.category === 'string' ? product.category : product.category.name,
                            url: `https://matasreesuper.com/products?category=${encodeURIComponent(typeof product.category === 'string' ? product.category : product.category.name)}`,
                        }]
                        : []),
                    {
                        name: product.name,
                        url: `https://matasreesuper.com/product/${product._id}`,
                    },
                ])}
            />
            <Navbar />
            <main id="main-content" className="page-enter">
                {/* Breadcrumb */}
                <div className="container mx-auto px-4 pt-24 pb-4">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
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
                                <ProductImage
                                    src={getImageUrl(allImages[selectedImage])}
                                    alt={product.name}
                                    isAboveFold={true}
                                    aspectRatio="1/1"
                                    fallbackSrc="https://via.placeholder.com/600"
                                    className="w-full h-full group-hover:scale-105 transition-transform duration-700"
                                />
                                {discount > 0 && (
                                    <Badge className="absolute top-6 left-6 bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                                        {discount}% OFF
                                    </Badge>
                                )}
                                {/* Wishlist + Share buttons */}
                                <div className="absolute top-6 right-6 flex flex-col gap-2">
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className={`rounded-full w-12 h-12 shadow-lg transition-all ${isWishlisted ? 'bg-red-50 text-red-500' : 'bg-white/90 text-gray-600 hover:bg-white'}`}
                                        onClick={handleWishlist}
                                        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                                    >
                                        <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="rounded-full w-12 h-12 shadow-lg bg-white/90 text-gray-600 hover:bg-white transition-all"
                                        onClick={handleShare}
                                        aria-label="Share product"
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Thumbnail Gallery */}
                            {allImages.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {allImages.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedImage(i)}
                                            className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-primary shadow-md scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                            aria-label={`View image ${i + 1}`}
                                        >
                                            <ProductImage
                                                src={getImageUrl(img)}
                                                alt="" aria-hidden="true"
                                                isAboveFold={false}
                                                aspectRatio="1/1"
                                                className="w-full h-full"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Product Info */}
                        <div className="flex flex-col">
                            {/* Category & Badges */}
                            <div className="flex items-center gap-3 mb-4 flex-wrap">
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

                            {/* Star Rating */}
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
                            <div className="flex items-baseline gap-4 mb-6 pb-6 border-b border-border flex-wrap">
                                <span className="font-serif text-4xl font-bold text-foreground">₹{(product.price || 0).toFixed(0)}</span>
                                {product.originalPrice && product.originalPrice > product.price && (
                                    <>
                                        <span className="text-xl text-muted-foreground line-through">₹{product.originalPrice.toFixed(0)}</span>
                                        <Badge className="bg-red-100 text-red-700 font-bold">{discount}% off</Badge>
                                        <Badge className="bg-green-100 text-green-800 font-bold">Save ₹{(product.originalPrice - product.price).toFixed(0)}</Badge>
                                    </>
                                )}
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Description</h3>
                                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                            </div>

                            {/* Weight & Stock */}
                            <div className="flex flex-col gap-3 mb-6 pb-6 border-b border-border">
                                {product.weight && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground font-medium">Weight:</span>
                                        <span className="inline-flex items-center px-3 py-1 bg-secondary/60 rounded-full text-sm font-semibold text-foreground">
                                            {product.weight}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground font-medium">Availability:</span>
                                    {renderStockIndicator()}
                                </div>
                                {/* Social proof */}
                                {product.sold > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        🔥 <strong className="text-foreground">{product.sold}</strong> people bought this in the last 30 days
                                    </p>
                                )}
                            </div>

                            {/* Quantity & Add to Cart */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
                                <div className="flex items-center border-2 border-border rounded-xl overflow-hidden">
                                    <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="rounded-none h-14 w-14" aria-label="Decrease quantity">
                                        <Minus className="w-4 h-4" aria-hidden="true" />
                                    </Button>
                                    <span className="w-16 h-14 flex items-center justify-center font-bold text-lg border-x-2 border-border" aria-live="polite" aria-label={`Quantity: ${quantity}`}>{quantity}</span>
                                    <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)} className="rounded-none h-14 w-14" aria-label="Increase quantity">
                                        <Plus className="w-4 h-4" aria-hidden="true" />
                                    </Button>
                                </div>
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={stock <= 0}
                                    ref={primaryAddToCartRef}
                                    className="flex-1 bg-gradient-spice hover:opacity-90 text-white font-bold py-7 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all group"
                                >
                                    <ShoppingCart className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                    {stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                </Button>
                            </div>

                            {/* WhatsApp Button */}
                            <div className="mb-6">
                                <WhatsAppButton
                                    variant="product"
                                    productName={product.name}
                                    price={product.price}
                                    quantity={quantity}
                                />
                            </div>

                            {/* Trust Badges */}
                            <TrustBadges />
                        </div>
                    </div>

                    {/* Related Products */}
                    <section className="mt-20 pt-12 border-t border-border">
                        <h2 className="font-serif text-3xl font-bold text-foreground mb-8">
                            Related <span className="text-gradient-spice">Products</span>
                        </h2>
                        {relatedLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="aspect-square rounded-xl" />
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-5 w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : relatedProducts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                {relatedProducts.map((rp: any) => (
                                    <div key={rp._id} className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/40 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col">
                                        <Link to={`/product/${rp._id}`} className="block">
                                            <div className="aspect-square overflow-hidden bg-secondary/20">
                                                <ProductImage
                                                    src={getImageUrl(rp.image)}
                                                    alt={rp.name}
                                                    isAboveFold={false}
                                                    aspectRatio="1/1"
                                                    className="w-full h-full group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                        </Link>
                                        <div className="p-3 flex flex-col flex-1">
                                            <Link to={`/product/${rp._id}`}>
                                                <h4 className="font-serif font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors capitalize">
                                                    {rp.name}
                                                </h4>
                                            </Link>
                                            <p className="font-serif font-bold text-lg mt-1">₹{(rp.price || 0).toFixed(0)}</p>
                                            <Button
                                                size="sm"
                                                className="mt-2 bg-gradient-spice text-white text-xs rounded-lg hover:opacity-90"
                                                onClick={() => handleAddRelatedToCart(rp)}
                                            >
                                                <ShoppingCart className="w-3 h-3 mr-1" /> Add to Cart
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No related products found.</p>
                        )}
                    </section>

                    {/* Frequently Bought Together */}
                    {fbtProducts.length >= 2 && (
                        <section className="mt-16 pt-10 border-t border-border">
                            <h2 className="font-serif text-3xl font-bold text-foreground mb-8">
                                Frequently Bought <span className="text-gradient-spice">Together</span>
                            </h2>
                            <div className="bg-secondary/30 rounded-2xl p-6">
                                <div className="flex flex-wrap items-center gap-4 mb-6">
                                    {fbtProducts.map((rp: any, idx: number) => (
                                        <div key={rp._id} className="flex items-center gap-4">
                                            <div className="flex flex-col items-center w-28 group">
                                                <Link to={`/product/${rp._id}`}>
                                                    <div className="w-28 h-28 rounded-xl overflow-hidden bg-secondary/30 border border-border group-hover:border-primary/40 transition-all">
                                                        <ProductImage
                                                            src={getImageUrl(rp.image)}
                                                            alt={rp.name}
                                                            isAboveFold={false}
                                                            aspectRatio="1/1"
                                                            className="w-full h-full"
                                                        />
                                                    </div>
                                                </Link>
                                                <p className="text-xs font-semibold text-center mt-2 line-clamp-2 capitalize">{rp.name}</p>
                                                <p className="text-sm font-bold">₹{(rp.price || 0).toFixed(0)}</p>
                                            </div>
                                            {idx < fbtProducts.length - 1 && (
                                                <span className="text-2xl font-bold text-muted-foreground">+</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-4 flex-wrap">
                                    <p className="text-sm text-muted-foreground">
                                        Total: <strong className="text-foreground text-lg">₹{fbtTotal.toFixed(0)}</strong>
                                    </p>
                                    <Button
                                        className="bg-gradient-spice text-white font-bold rounded-xl px-6 hover:opacity-90"
                                        onClick={handleAddAllFbt}
                                    >
                                        <ShoppingCart className="w-4 h-4 mr-2" />
                                        Add All to Cart
                                    </Button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Customer Reviews */}
                    <section className="mt-16 pt-10 border-t border-border">
                        <h2 className="font-serif text-3xl font-bold text-foreground mb-6">
                            Customer <span className="text-gradient-spice">Reviews</span>{' '}
                            <span className="text-muted-foreground text-xl font-normal">({product.reviews || 0})</span>
                        </h2>

                        {/* Rating summary row */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-7 h-7 ${i < Math.round(product.rating || 0) ? 'fill-primary text-primary' : 'fill-gray-200 text-gray-200'}`}
                                    />
                                ))}
                            </div>
                            <span className="text-2xl font-bold text-foreground">{(product.rating || 0).toFixed(1)}</span>
                            <span className="text-muted-foreground text-sm">based on {product.reviews || 0} review{(product.reviews || 0) !== 1 ? 's' : ''}</span>
                        </div>

                        {/* Review list */}
                        {reviewsLoading ? (
                            <div className="space-y-4">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="space-y-2 bg-card rounded-xl p-4 border border-border">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-12 w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                                <Star className="w-10 h-10 text-muted-foreground/40" />
                                <p className="text-base">Be the first to review this product</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reviews.map((review: any, idx: number) => (
                                    <div key={review._id ?? idx} className="bg-card rounded-xl p-5 border border-border shadow-sm">
                                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                            <span className="font-semibold text-foreground">{review.name || 'Customer'}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-4 h-4 ${i < (review.rating || 0) ? 'fill-primary text-primary' : 'fill-gray-200 text-gray-200'}`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                                    </div>
                                ))}

                                {/* Pagination */}
                                {reviewsTotal > REVIEWS_PER_PAGE && (
                                    <div className="flex items-center justify-center gap-4 pt-4">
                                        <Button
                                            variant="outline"
                                            disabled={reviewsPage <= 1}
                                            onClick={() => setReviewsPage((p) => Math.max(1, p - 1))}
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-sm text-muted-foreground">Page {reviewsPage}</span>
                                        <Button
                                            variant="outline"
                                            disabled={reviewsPage * REVIEWS_PER_PAGE >= reviewsTotal}
                                            onClick={() => setReviewsPage((p) => p + 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Write a Review form — only for authenticated users */}
                        {isAuthenticated && (
                            <div className="mt-10 pt-8 border-t border-border">
                                <h3 className="font-serif text-xl font-bold text-foreground mb-6">Write a Review</h3>
                                <form onSubmit={handleReviewSubmit} className="space-y-5 max-w-xl">
                                    {/* Star rating selector */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Your Rating</label>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setReviewForm((f) => ({ ...f, rating: star }))}
                                                    aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                                                    className="focus:outline-none"
                                                >
                                                    <Star
                                                        className={`w-8 h-8 transition-colors ${star <= reviewForm.rating ? 'fill-primary text-primary' : 'fill-gray-200 text-gray-200 hover:fill-primary/50 hover:text-primary/50'}`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Comment textarea */}
                                    <div>
                                        <label htmlFor="review-comment" className="block text-sm font-medium text-foreground mb-2">
                                            Your Review
                                        </label>
                                        <textarea
                                            id="review-comment"
                                            value={reviewForm.comment}
                                            onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                                            minLength={10}
                                            maxLength={1000}
                                            rows={4}
                                            placeholder="Share your experience with this product (min 10 characters)..."
                                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1 text-right">{reviewForm.comment.length}/1000</p>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={reviewSubmitting || reviewForm.rating === 0 || reviewForm.comment.length < 10}
                                        className="bg-gradient-spice text-white font-bold rounded-xl px-8 hover:opacity-90"
                                    >
                                        {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
                                    </Button>
                                </form>
                            </div>
                        )}
                    </section>

                    {/* Recently Viewed */}
                    <RecentlyViewedSection currentProductId={id} />
                </div>
            </main>
            <Footer />
            <CartDrawer />
            <StickyAddToCartBar
                productName={product.name}
                price={product.price || 0}
                stock={product.stock || 0}
                onAddToCart={handleAddToCart}
                primaryButtonRef={primaryAddToCartRef}
            />
        </div>
    );
};

export default ProductDetailsPage;
