import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useProduct } from '@/hooks/useApi';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
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
import JsonLd, { buildProductSchema, buildBreadcrumbSchema } from '@/components/JsonLd';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';
import type { ProductVariant } from '@/types';
import {
    Star, ShoppingCart, Heart, Minus, Plus,
    ChevronRight, Package, ArrowLeft, Share2, Sparkles, Flame, ZoomIn
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
const STORAGE_KEY = 'matasree-recently-viewed';

const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return 'https://via.placeholder.com/600';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return path.startsWith('/') ? `${BACKEND_URL}${path}` : `${BACKEND_URL}/${path}`;
};

const updateGuestRecentlyViewed = (productId: string) => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        let list: { productId: string; timestamp: number }[] = raw ? JSON.parse(raw) : [];
        list = list.filter((v) => v.productId !== productId);
        list.unshift({ productId, timestamp: Date.now() });
        if (list.length > 10) list = list.slice(0, 10);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch { /* ignore */ }
};

const SectionDivider = () => (
    <div className="relative my-16">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-4 text-muted-foreground font-bold tracking-widest">···</span>
        </div>
    </div>
);

const ProductDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: productData, isLoading } = useProduct(id || '');
    const { addItem } = useCartStore();
    const { isAuthenticated, user } = useAuthStore();
    const { isWishlisted: isWishlistedFn, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const primaryAddToCartRef = useRef<HTMLButtonElement>(null);

    // Variant selection state
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

    const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
    const [relatedLoading, setRelatedLoading] = useState(false);
    const [fbtProducts, setFbtProducts] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [reviewsTotal, setReviewsTotal] = useState(0);
    const REVIEWS_PER_PAGE = 10;
    const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const product = useMemo(() => {
        if (!productData) return null;
        return (productData as any).data?.data || (productData as any).data || productData;
    }, [productData]);

    // Build variant list from product
    const variantList: ProductVariant[] = useMemo(() => {
        if (!product) return [];
        if (Array.isArray(product.variants) && product.variants.length > 0) return product.variants;
        return [{ weight: product.weight, price: product.price, originalPrice: product.originalPrice, stock: product.stock }];
    }, [product]);

    // Initialize selectedVariant when product loads
    useEffect(() => {
        if (variantList.length > 0) {
            setSelectedVariant(variantList[0]);
        }
    }, [product?._id, variantList]);

    // Derived values from selected variant
    const activePrice = selectedVariant?.price ?? product?.price ?? 0;
    const activeOriginalPrice = selectedVariant?.originalPrice ?? product?.originalPrice;
    const activeStock = selectedVariant?.stock ?? product?.stock ?? 0;
    const activeWeight = selectedVariant?.weight ?? product?.weight ?? '';
    const discount = activeOriginalPrice && activeOriginalPrice > activePrice
        ? Math.round(((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100) : 0;

    const categoryId: string | undefined = product?.category?._id ?? (typeof product?.category === 'string' ? product?.category : undefined);
    const isWishlisted = product ? isWishlistedFn(product._id) : false;

    useEffect(() => {
        if (!product || !id) return;
        if (isAuthenticated) { apiClient.addToRecentlyViewed(id).catch(() => {}); }
        else { updateGuestRecentlyViewed(id); }
    }, [product, id, isAuthenticated]);

    const loadRelatedProducts = useCallback(async () => {
        if (!categoryId) return;
        setRelatedLoading(true);
        try {
            const res = await apiClient.getProducts({ category: categoryId, limit: 8 });
            const arr: any[] = (res as any)?.data?.data?.products ?? (res as any)?.data?.products ?? (res as any)?.data ?? [];
            setRelatedProducts(Array.isArray(arr) ? arr.filter((p: any) => p._id !== id).slice(0, 8) : []);
            const resBest = await apiClient.getProducts({ category: categoryId, sort: 'sold', limit: 4 });
            const arrBest: any[] = (resBest as any)?.data?.data?.products ?? (resBest as any)?.data?.products ?? (resBest as any)?.data ?? [];
            const fbt = Array.isArray(arrBest) ? arrBest.filter((p: any) => p._id !== id).slice(0, 3) : [];
            setFbtProducts(fbt.length >= 2 ? fbt : []);
        } catch { /* ignore */ }
        finally { setRelatedLoading(false); }
    }, [categoryId, id]);

    useEffect(() => {
        if (!product) return;
        const timer = setTimeout(() => loadRelatedProducts(), 0);
        return () => clearTimeout(timer);
    }, [product, loadRelatedProducts]);

    const loadReviews = useCallback(async () => {
        if (!id) return;
        setReviewsLoading(true);
        try {
            const res: any = await apiClient.get('/reviews/approved', { params: { productId: id, page: reviewsPage, limit: REVIEWS_PER_PAGE } });
            const data = res?.data ?? res;
            const arr: any[] = data?.reviews ?? data?.data ?? [];
            setReviews(Array.isArray(arr) ? arr : []);
            setReviewsTotal(data?.total ?? data?.pagination?.total ?? arr.length);
        } catch { setReviews([]); }
        finally { setReviewsLoading(false); }
    }, [id, reviewsPage]);

    useEffect(() => { if (!id) return; loadReviews(); }, [id, reviewsPage, loadReviews]);

    const allImages = useMemo(() => {
        if (!product) return [];
        const imgs: string[] = [product.image];
        if (product.images && Array.isArray(product.images)) imgs.push(...product.images);
        return imgs.filter(Boolean).slice(0, 8);
    }, [product]);

    const renderStockIndicator = () => {
        if (activeStock === 0) return <Badge variant="destructive">Out of Stock</Badge>;
        if (activeStock <= 9) return <p className="text-sm font-semibold text-amber-600">Only {activeStock} left in stock!</p>;
        return <Badge className="bg-green-600 hover:bg-green-700 text-white">In Stock</Badge>;
    };

    const handleAddToCart = () => {
        if (!product || !selectedVariant) return;
        addItem({
            _id: product._id,
            id: product._id,
            name: product.name,
            price: activePrice,
            image: getImageUrl(product.image),
            quantity: quantity,
            weight: activeWeight,
            description: product.description,
        } as any);
        toast.success(`${product.name} (${activeWeight}) added to cart!`, { description: `${quantity} item(s) added` });
    };

    // Helper: get default variant (first available, fallback to first)
    const getDefaultVariant = (rp: any) => {
        if (Array.isArray(rp.variants) && rp.variants.length > 0) {
            const inStock = rp.variants.find((v: any) => v.stock > 0);
            return inStock ?? rp.variants[0];
        }
        return { weight: rp.weight, price: rp.price, originalPrice: rp.originalPrice, stock: rp.stock };
    };

    const handleAddRelatedToCart = (rp: any) => {
        const variant = getDefaultVariant(rp);
        addItem({
            id: rp._id,
            name: rp.name,
            price: variant.price ?? rp.price,
            image: getImageUrl(rp.image),
            quantity: 1,
            weight: variant.weight ?? rp.weight,
        } as any);
        toast.success(`${rp.name}${variant.weight ? ` (${variant.weight})` : ''} added to cart!`);
    };

    const handleAddAllFbt = () => {
        fbtProducts.forEach((rp: any) => {
            const variant = getDefaultVariant(rp);
            addItem({
                id: rp._id,
                name: rp.name,
                price: variant.price ?? rp.price,
                image: getImageUrl(rp.image),
                quantity: 1,
                weight: variant.weight ?? rp.weight,
            } as any);
        });
        toast.success(`${fbtProducts.length} items added to cart!`);
    };

    const handleWishlist = async () => {
        if (!isAuthenticated) { toast.error('Please log in to add to wishlist'); return; }
        if (!product) return;
        // Use getImageUrl to store a fully resolved URL — prevents stale local-path vs CDN mismatch
        const wishlistItem = {
            id: product._id,
            name: product.name,
            price: activePrice,
            originalPrice: activeOriginalPrice,
            image: getImageUrl(product.image),
            category: typeof product.category === 'string' ? product.category : product.category?.name,
            rating: product.rating,
            weight: activeWeight,
            variants: product.variants ?? [],
            stock: activeStock,
        };
        if (isWishlisted) {
            removeFromWishlist(product._id); toast.success('Removed from wishlist');
            try { await apiClient.removeFromWishlist(product._id); } catch { addToWishlist(wishlistItem); toast.error('Failed to update wishlist'); }
        } else {
            addToWishlist(wishlistItem); toast.success('Added to wishlist');
            try { await apiClient.addToWishlist(product._id); } catch { removeFromWishlist(product._id); toast.error('Failed to update wishlist'); }
        }
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        if (reviewForm.rating === 0) { toast.error('Please select a star rating.'); return; }
        if (reviewForm.comment.length < 10) { toast.error('Comment must be at least 10 characters.'); return; }
        setReviewSubmitting(true);
        try {
            await apiClient.post('/reviews/submit', { productId: id, name: user?.name || 'Customer', rating: reviewForm.rating, comment: reviewForm.comment });
            toast.success('Review submitted! It will be visible after approval.');
            setReviewForm({ rating: 0, comment: '' });
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 403) toast.error('You must purchase this product before reviewing it.');
            else if (status === 409) toast.error('You have already reviewed this product.');
            else toast.error(err?.response?.data?.message || err?.message || 'Failed to submit review.');
        } finally { setReviewSubmitting(false); }
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) { try { await navigator.share({ title: product?.name, url }); } catch { /* cancelled */ } }
        else { try { await navigator.clipboard.writeText(url); toast.success('Link copied to clipboard!'); } catch { toast.error('Unable to copy link'); } }
    };

    const fbtTotal = fbtProducts.reduce((sum: number, p: any) => {
        const variant = getDefaultVariant(p);
        return sum + (variant.price ?? p.price ?? 0);
    }, 0);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background"><Navbar />
                <div className="container mx-auto px-4 pt-24 pb-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <Skeleton className="aspect-square rounded-3xl" />
                        <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-12 w-full" /><Skeleton className="h-6 w-32" /><Skeleton className="h-24 w-full" /><Skeleton className="h-14 w-full" /></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-background"><Navbar />
                <div className="container mx-auto px-4 pt-24 pb-12 text-center">
                    <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="font-serif text-2xl font-bold mb-2">Product Not Found</h2>
                    <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
                    <Button onClick={() => navigate('/products')} className="bg-gradient-spice text-white"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Products</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <PageHelmet
                title={`${product.name}${activeWeight ? ` ${activeWeight}` : ''} | Matasree Super Masale`}
                description={product.description || `Buy ${product.name} online from Matasree Super Masale.`}
                ogImage={getImageUrl(product.images?.[0] ?? product.image)}
                ogType="product"
                canonicalUrl={`https://matasreesuper.com/product/${product._id}`}
            />
            <JsonLd schema={buildProductSchema({ name: product.name, description: product.description || `Buy ${product.name}.`, image: getImageUrl(product.images?.[0] ?? product.image), sku: product._id, price: activePrice, stock: activeStock, reviewCount: product.reviews ?? 0, ratingValue: product.rating ?? 0, url: `https://matasreesuper.com/product/${product._id}` })} />
            <JsonLd schema={buildBreadcrumbSchema([{ name: 'Home', url: 'https://matasreesuper.com/' }, { name: 'Products', url: 'https://matasreesuper.com/products' }, ...(product.category ? [{ name: typeof product.category === 'string' ? product.category : product.category.name, url: `https://matasreesuper.com/products?category=${encodeURIComponent(typeof product.category === 'string' ? product.category : product.category.name)}` }] : []), { name: product.name, url: `https://matasreesuper.com/product/${product._id}` }])} />
            <Navbar />
            <main id="main-content" className="page-enter">
                <div className="container mx-auto px-4 pt-24 pb-4">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
                    </nav>
                </div>

                <div className="container mx-auto px-4 pb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16">

                        {/* ── Left: Image Gallery ────────────────────────────────── */}
                        <div className="space-y-3">
                            <div className="relative aspect-[4/3] sm:aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-secondary/40 to-background shadow-card ring-1 ring-border group">
                                <div key={selectedImage} className="w-full h-full animate-fade-in">
                                    <ProductImage src={getImageUrl(allImages[selectedImage])} alt={product.name} isAboveFold={true} aspectRatio="1/1" fallbackSrc="https://via.placeholder.com/600" enableZoom={true} className="w-full h-full group-hover:scale-105 transition-transform duration-700" />
                                </div>
                                {discount > 0 && (
                                    <Badge className="absolute top-3 left-3 sm:top-6 sm:left-6 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs sm:text-sm font-bold px-2.5 sm:px-4 py-1 sm:py-2 rounded-full shadow-lg pointer-events-none">
                                        {discount}% OFF
                                    </Badge>
                                )}
                                <div className="hidden sm:flex absolute bottom-4 right-4 items-center gap-1.5 px-3 py-1.5 bg-card/80 backdrop-blur-sm rounded-full shadow-card border border-border/60 text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                    <ZoomIn className="w-3.5 h-3.5 text-primary" /><span className="text-[10px] tracking-wide">Scroll to zoom</span>
                                </div>
                                <div className="absolute top-3 right-3 sm:top-6 sm:right-6 flex flex-col gap-1.5 sm:gap-2">
                                    <Button variant="secondary" size="icon" className={`rounded-full w-9 h-9 sm:w-12 sm:h-12 shadow-lg backdrop-blur-sm transition-all ${isWishlisted ? 'bg-red-50/90 text-red-500' : 'bg-white/80 text-gray-600 hover:bg-white'}`} onClick={handleWishlist} aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
                                        <Heart className={`w-4 h-4 sm:w-6 sm:h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                                    </Button>
                                    <Button variant="secondary" size="icon" className="rounded-full w-9 h-9 sm:w-12 sm:h-12 shadow-lg bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white transition-all" onClick={handleShare} aria-label="Share product">
                                        <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </Button>
                                </div>
                            </div>
                            {allImages.length > 1 && (
                                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1">
                                    {allImages.map((img, i) => (
                                        <button key={i} onClick={() => setSelectedImage(i)} className={`flex-shrink-0 rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-primary ring-2 ring-primary shadow-md opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`} aria-label={`View image ${i + 1}`} style={{ width: '3.5rem', height: '3.5rem' }}>
                                            <ProductImage src={getImageUrl(img)} alt="" aria-hidden="true" isAboveFold={false} aspectRatio="1/1" className="w-full h-full" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Right: Product Info ───────────────────────────────── */}
                        <div className="flex flex-col">

                            {/* Badges */}
                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                                {product.category && (
                                    <Link to={`/products?category=${typeof product.category === 'string' ? product.category : product.category.name}`}>
                                        <Badge variant="secondary" className="text-primary font-bold uppercase tracking-wider text-xs px-3 py-1.5 hover:bg-primary/10 transition-colors gap-2">
                                            {typeof product.category === 'string' ? product.category : product.category.name}
                                        </Badge>
                                    </Link>
                                )}
                                {product.isBestseller && <Badge className="bg-gradient-spice text-white flex items-center gap-1"><Star className="w-3 h-3 fill-white" /> Bestseller</Badge>}
                                {product.isNewProduct && <Badge className="bg-green-600 text-white flex items-center gap-1"><Sparkles className="w-3 h-3" /> New</Badge>}
                            </div>

                            {/* Title */}
                            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight capitalize text-shadow-traditional">{product.name}</h1>

                            {/* Rating */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (<Star key={i} className={`w-5 h-5 ${i < Math.round(product.rating || 0) ? 'fill-primary text-primary' : 'fill-gray-200 text-gray-200'}`} />))}
                                </div>
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold text-sm">{(product.rating || 0).toFixed(1)}</span>
                                <span className="text-sm text-muted-foreground font-medium">({product.reviews || 0} reviews)</span>
                            </div>

                            {/* ── Price section (variant-aware) ─────────────────── */}
                            <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-2xl px-4 py-3 mb-5">
                                <div className="flex items-baseline gap-3 flex-wrap">
                                    <span className="font-serif text-4xl sm:text-5xl font-bold text-primary">₹{activePrice.toFixed(0)}</span>
                                    {activeOriginalPrice && activeOriginalPrice > activePrice && (
                                        <>
                                            <span className="text-xl text-muted-foreground line-through decoration-destructive/60">₹{activeOriginalPrice.toFixed(0)}</span>
                                            <Badge className="bg-primary/15 text-primary font-bold">{discount}% off</Badge>
                                            <Badge className="bg-green-100 text-green-800 font-bold">Save ₹{(activeOriginalPrice - activePrice).toFixed(0)}</Badge>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* ── Variant Weight Selector ───────────────────────── */}
                            {variantList.length > 1 && (
                                <div className="mb-5">
                                    <p className="text-sm font-semibold text-muted-foreground mb-2">Select Weight</p>
                                    <div className="flex flex-wrap gap-2">
                                        {variantList.map((v) => {
                                            const isSelected = v.weight === selectedVariant?.weight;
                                            const isOOS = v.stock === 0;
                                            const variantDiscount = v.originalPrice && v.originalPrice > v.price ? Math.round(((v.originalPrice - v.price) / v.originalPrice) * 100) : 0;
                                            return (
                                                <button key={v.weight} onClick={() => { if (!isOOS) { setSelectedVariant(v); setQuantity(1); } }} disabled={isOOS}
                                                    className={`relative px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all duration-200 flex flex-col items-center min-w-[72px] ${
                                                        isSelected ? 'bg-primary text-white border-primary shadow-md scale-105' :
                                                        isOOS ? 'border-border text-muted-foreground/40 cursor-not-allowed bg-muted/30' :
                                                        'border-border text-foreground hover:border-primary/60 hover:bg-primary/5 cursor-pointer'
                                                    }`}>
                                                    <span>{v.weight}</span>
                                                    <span className={`text-xs font-normal mt-0.5 ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>₹{v.price}</span>
                                                    {variantDiscount > 0 && !isOOS && (
                                                        <span className={`absolute -top-2 -right-1 text-[9px] font-bold px-1 py-0.5 rounded-full ${isSelected ? 'bg-white text-primary' : 'bg-green-100 text-green-700'}`}>{variantDiscount}%</span>
                                                    )}
                                                    {isOOS && <span className="text-[9px] text-destructive font-medium mt-0.5">Out of stock</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div className="mb-5">
                                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Description</h3>
                                <p className="text-muted-foreground leading-relaxed border-l-4 border-primary/30 pl-4">{product.description}</p>
                            </div>

                            {/* Weight + Stock */}
                            <div className="flex flex-col gap-3 mb-5 pb-5 border-b border-border">
                                {variantList.length === 1 && activeWeight && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground font-medium">Weight:</span>
                                        <span className="inline-flex items-center bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-sm font-semibold">{activeWeight}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground font-medium">Availability:</span>
                                    {renderStockIndicator()}
                                </div>
                                {product.sold > 0 && (
                                    <p className="text-sm text-muted-foreground"><Flame className="w-4 h-4 text-orange-500 inline mr-1" /><strong className="text-foreground">{product.sold}</strong> people bought this in the last 30 days</p>
                                )}
                            </div>

                            {/* Qty + Add to Cart */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
                                <div className="flex items-center bg-secondary rounded-2xl overflow-hidden border-none">
                                    <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="rounded-none h-14 w-14 text-primary hover:bg-primary/10" aria-label="Decrease quantity">
                                        <Minus className="w-4 h-4" aria-hidden="true" />
                                    </Button>
                                    <span className="w-16 h-14 flex items-center justify-center font-bold text-lg" aria-live="polite" aria-label={`Quantity: ${quantity}`}>{quantity}</span>
                                    <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.min(activeStock, quantity + 1))} disabled={quantity >= activeStock} className="rounded-none h-14 w-14 text-primary hover:bg-primary/10" aria-label="Increase quantity">
                                        <Plus className="w-4 h-4" aria-hidden="true" />
                                    </Button>
                                </div>
                                <Button onClick={handleAddToCart} disabled={activeStock <= 0} ref={primaryAddToCartRef} className="flex-1 bg-gradient-spice hover:opacity-90 text-white font-bold py-4 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all group overflow-hidden relative">
                                    <ShoppingCart className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                    {activeStock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                </Button>
                            </div>

                            {/* WhatsApp */}
                            <div className="mb-6">
                                <WhatsAppButton variant="product" productName={product.name} price={activePrice} quantity={quantity} />
                            </div>

                            <TrustBadges />
                        </div>
                    </div>

                    {/* ── Related Products ──────────────────────────────────────── */}
                    <SectionDivider />
                    <section>
                        <h2 className="font-serif text-3xl font-bold text-foreground mb-8">Related <span className="text-gradient-spice">Products</span></h2>
                        {relatedLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="space-y-2"><Skeleton className="aspect-square rounded-xl" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-5 w-1/2" /></div>))}</div>
                        ) : relatedProducts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                {relatedProducts.map((rp: any) => (
                                    <div key={rp._id} className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/40 shadow-sm hover:shadow-card transition-all hover:-translate-y-1 flex flex-col">
                                        <Link to={`/product/${rp._id}`} className="block">
                                            <div className="aspect-square overflow-hidden bg-gradient-to-br from-secondary/30 to-background">
                                                <ProductImage src={getImageUrl(rp.image)} alt={rp.name} isAboveFold={false} aspectRatio="1/1" className="w-full h-full group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                        </Link>
                                        <div className="p-3 flex flex-col flex-1">
                                            <Link to={`/product/${rp._id}`}><h4 className="font-serif font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors capitalize">{rp.name}</h4></Link>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <p className="font-serif font-bold text-lg text-primary">₹{(rp.price || 0).toFixed(0)}</p>
                                                {rp.originalPrice && rp.originalPrice > rp.price && <span className="text-xs text-muted-foreground line-through">₹{rp.originalPrice.toFixed(0)}</span>}
                                            </div>
                                            <Button size="sm" className="mt-2 bg-gradient-spice text-white text-xs rounded-lg hover:opacity-90" onClick={() => handleAddRelatedToCart(rp)}>
                                                <ShoppingCart className="w-3 h-3 mr-1" /> Add to Cart
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-muted-foreground">No related products found.</p>}
                    </section>

                    {/* ── Frequently Bought Together ───────────────────────────── */}
                    {fbtProducts.length >= 2 && (
                        <>
                            <SectionDivider />
                            <section>
                                <h2 className="font-serif text-3xl font-bold text-foreground mb-8">Frequently Bought <span className="text-gradient-spice">Together</span></h2>
                                <div className="bg-secondary/30 rounded-2xl p-6">
                                    <div className="flex flex-wrap items-center gap-4 mb-6">
                                        {fbtProducts.map((rp: any, idx: number) => {
                                            const variant = getDefaultVariant(rp);
                                            return (
                                            <div key={rp._id} className="flex items-center gap-4">
                                                <div className="flex flex-col items-center w-28 group">
                                                    <Link to={`/product/${rp._id}`}>
                                                        <div className="w-28 h-28 rounded-xl overflow-hidden bg-gradient-to-br from-secondary/30 to-background border border-border group-hover:border-primary/40 transition-all">
                                                            <ProductImage src={getImageUrl(rp.image)} alt={rp.name} isAboveFold={false} aspectRatio="1/1" className="w-full h-full" />
                                                        </div>
                                                    </Link>
                                                    <p className="text-xs font-semibold text-center mt-2 line-clamp-2 capitalize">{rp.name}</p>
                                                    {variant.weight && <p className="text-[10px] text-muted-foreground font-medium">{variant.weight}</p>}
                                                    <p className="text-sm font-bold text-primary">₹{(variant.price ?? rp.price ?? 0).toFixed(0)}</p>
                                                </div>
                                                {idx < fbtProducts.length - 1 && <span className="text-2xl font-bold text-muted-foreground">+</span>}
                                            </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <p className="text-sm text-muted-foreground">Total: <strong className="text-foreground text-lg">₹{fbtTotal.toFixed(0)}</strong></p>
                                        <Button className="bg-gradient-spice text-white font-bold rounded-xl px-6 hover:opacity-90" onClick={handleAddAllFbt}><ShoppingCart className="w-4 h-4 mr-2" />Add All to Cart</Button>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}

                    {/* ── Customer Reviews ─────────────────────────────────────── */}
                    <SectionDivider />
                    <section>
                        <h2 className="font-serif text-3xl font-bold text-foreground mb-6">Customer <span className="text-gradient-spice">Reviews</span> <span className="text-muted-foreground text-xl font-normal">({product.reviews || 0})</span></h2>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex items-center gap-1">{[...Array(5)].map((_, i) => (<Star key={i} className={`w-7 h-7 ${i < Math.round(product.rating || 0) ? 'fill-primary text-primary' : 'fill-gray-200 text-gray-200'}`} />))}</div>
                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold text-lg">{(product.rating || 0).toFixed(1)}</span>
                            <span className="text-muted-foreground text-sm">based on {product.reviews || 0} review{(product.reviews || 0) !== 1 ? 's' : ''}</span>
                        </div>
                        {reviewsLoading ? (
                            <div className="space-y-4">{[0, 1, 2].map(i => (<div key={i} className="space-y-2 bg-card rounded-2xl p-5 border border-border/60"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /><Skeleton className="h-12 w-full" /></div>))}</div>
                        ) : reviews.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3"><Star className="w-10 h-10 text-muted-foreground/40" /><p className="text-base">Be the first to review this product</p></div>
                        ) : (
                            <div className="space-y-4">
                                {reviews.map((review: any, idx: number) => (
                                    <div key={review._id ?? idx} className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-card transition-shadow">
                                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                            <span className="font-semibold text-foreground">{review.name || 'Customer'}</span>
                                            <span className="text-xs text-muted-foreground">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</span>
                                        </div>
                                        <div className="flex items-center gap-1 mb-2">{[...Array(5)].map((_, i) => (<Star key={i} className={`w-4 h-4 ${i < (review.rating || 0) ? 'fill-primary text-primary' : 'fill-gray-200 text-gray-200'}`} />))}</div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                                    </div>
                                ))}
                                {reviewsTotal > REVIEWS_PER_PAGE && (
                                    <div className="flex items-center justify-center gap-4 pt-4">
                                        <Button variant="outline" disabled={reviewsPage <= 1} onClick={() => setReviewsPage(p => Math.max(1, p - 1))}>Previous</Button>
                                        <span className="text-sm text-muted-foreground">Page {reviewsPage}</span>
                                        <Button variant="outline" disabled={reviewsPage * REVIEWS_PER_PAGE >= reviewsTotal} onClick={() => setReviewsPage(p => p + 1)}>Next</Button>
                                    </div>
                                )}
                            </div>
                        )}
                        {isAuthenticated && (
                            <div className="mt-10 pt-8 border-t border-border">
                                <h3 className="font-serif text-xl font-bold text-foreground mb-6">Write a Review</h3>
                                <form onSubmit={handleReviewSubmit} className="space-y-5 max-w-xl">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Your Rating</label>
                                        <div className="flex items-center gap-1">
                                            {[1,2,3,4,5].map(star => (
                                                <button key={star} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: star }))} aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`} className="focus:outline-none">
                                                    <Star className={`w-8 h-8 transition-colors ${star <= reviewForm.rating ? 'fill-primary text-primary' : 'fill-gray-200 text-gray-200 hover:fill-primary/50 hover:text-primary/50'}`} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="review-comment" className="block text-sm font-medium text-foreground mb-2">Your Review</label>
                                        <textarea id="review-comment" value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} minLength={10} maxLength={1000} rows={4} placeholder="Share your experience (min 10 characters)..." className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                                        <p className="text-xs text-muted-foreground mt-1 text-right">{reviewForm.comment.length}/1000</p>
                                    </div>
                                    <Button type="submit" disabled={reviewSubmitting || reviewForm.rating === 0 || reviewForm.comment.length < 10} className="bg-gradient-spice text-white font-bold rounded-2xl px-8 py-4 text-lg hover:opacity-90">
                                        {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
                                    </Button>
                                </form>
                            </div>
                        )}
                    </section>

                    <RecentlyViewedSection currentProductId={id} />
                </div>
            </main>
            <Footer />
            <CartDrawer />
            <StickyAddToCartBar
                productName={product.name}
                price={activePrice}
                originalPrice={activeOriginalPrice}
                selectedWeight={activeWeight}
                stock={activeStock}
                onAddToCart={handleAddToCart}
                primaryButtonRef={primaryAddToCartRef}
            />
        </div>
    );
};

export default ProductDetailsPage;
