/**
 * ProductScrollGrid — "Bestsellers" section
 *
 * DESIGN PHILOSOPHY:
 *  - Mobile: Full-screen immersive card stack with a "peel" swipe animation.
 *            Each card fills the viewport height and shows a vivid spice-gradient backdrop.
 *  - Desktop: Asymmetric bento-grid layout — one hero card (large left), four smaller
 *             right cards, one wide bottom card. Hover reveals a 3D-tilt flip with full
 *             add-to-cart controls on the back face.
 *
 *  Extras:
 *   - Animated "rank ticker" that counts up to a random sold number
 *   - Marquee strip of real-time trust signals above the section header
 *   - Floating spice emoji particles on the section background
 *   - Scroll-driven section title with ink-bleed paint effect
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
  MotionValue,
} from 'framer-motion';
import {
  ShoppingBag,
  Star,
  Eye,
  ArrowRight,
  Flame,
  Award,
  Heart,
  TrendingUp,
  Zap,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/useApi';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore, WishlistItem } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';
import { ProductCardSkeleton } from '@/components/skeletons/ProductCardSkeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategoryProps { name: string; }

export interface ProductType {
  _id: string;
  name: string;
  price: number;
  image?: string;
  stock?: number;
  category?: string | CategoryProps;
  rating?: number;
  originalPrice?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return 'https://via.placeholder.com/400x400?text=Spice';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return path.startsWith('/') ? `${BACKEND_URL}${path}` : `${BACKEND_URL}/${path}`;
};

// Stable mock sales numbers (deterministic per index so they don't jump on re-render)
const MOCK_SALES = [1842, 976, 2301, 654, 1128, 789, 1450, 532];

// Spice emoji palette for floating particles
const SPICE_EMOJIS = ['🌶️', '🧄', '🫚', '✨', '🍃', '🔥', '⭐', '🌿'];

// Gradient palettes per product slot (wraps around if > 8 products)
const CARD_GRADIENTS = [
  'from-[#8B1A1A] via-[#C0392B] to-[#E74C3C]',
  'from-[#4A2C0A] via-[#8B4513] to-[#D4890A]',
  'from-[#1A4A1A] via-[#2D7D2D] to-[#4CAF50]',
  'from-[#1A1A4A] via-[#2D2D8B] to-[#5B5BD6]',
  'from-[#4A1A4A] via-[#8B2D8B] to-[#C84BC8]',
  'from-[#4A3A1A] via-[#8B6914] to-[#D4A017]',
  'from-[#1A3A4A] via-[#1C6B8B] to-[#22A6D4]',
  'from-[#3A1A1A] via-[#7A2D1E] to-[#B84132]',
];

// ─── Floating Particle Background ─────────────────────────────────────────────

const FloatingParticle = ({ emoji, delay, duration, x, y }: {
  emoji: string; delay: number; duration: number; x: number; y: number;
}) => (
  <motion.div
    className="absolute text-2xl select-none pointer-events-none opacity-10"
    style={{ left: `${x}%`, top: `${y}%` }}
    animate={{ y: [0, -30, 0], opacity: [0.05, 0.15, 0.05], rotate: [0, 10, -10, 0] }}
    transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
  >
    {emoji}
  </motion.div>
);

// ─── Rank Counter (animated number tick-up) ────────────────────────────────

const RankCounter = ({ target, label }: { target: number; label: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [started, target]);

  return (
    <motion.div
      ref={ref}
      onViewportEnter={() => setStarted(true)}
      className="flex items-center gap-1.5"
    >
      <Flame className="w-3.5 h-3.5 text-orange-400" />
      <span className="text-white/90 font-black text-sm tabular-nums">{count.toLocaleString()}</span>
      <span className="text-white/50 text-xs">{label}</span>
    </motion.div>
  );
};

// ─── Trust Signal Marquee ──────────────────────────────────────────────────

const TRUST_SIGNALS = [
  '🌶️ Hand-Ground Daily',
  '⭐ 4.9 Avg Rating',
  '📦 Free Shipping ₹499+',
  '🌿 100% Natural',
  '🏆 #1 Spice Brand',
  '✅ Lab Tested Quality',
  '🔥 20,000+ Happy Customers',
  '🇮🇳 Made in India',
];

const TrustMarquee = () => (
  <div className="overflow-hidden w-full py-3 bg-[#3E2314]/8 border-y border-[#3E2314]/10 mb-10 lg:mb-20">
    <motion.div
      className="flex gap-12 whitespace-nowrap"
      animate={{ x: ['0%', '-50%'] }}
      transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
    >
      {[...TRUST_SIGNALS, ...TRUST_SIGNALS].map((signal, i) => (
        <span key={i} className="text-[#3E2314]/60 font-bold text-xs uppercase tracking-widest">
          {signal}
        </span>
      ))}
    </motion.div>
  </div>
);

// ─── Desktop Bento Product Card (3D flip) ─────────────────────────────────

const DesktopCard = ({
  product,
  index,
  sectionProgress,
  size = 'normal',
}: {
  product: ProductType;
  index: number;
  sectionProgress: MotionValue<number>;
  size?: 'hero' | 'wide' | 'normal';
}) => {
  const [flipped, setFlipped] = useState(false);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCartStore();
  const { isWishlisted, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const wishlisted = isWishlisted(product._id);

  const hasVariants = Array.isArray((product as any).variants) && (product as any).variants.length > 0;
  const variantList = hasVariants
    ? (product as any).variants
    : [{ weight: (product as any).weight || '', price: product.price, originalPrice: product.originalPrice, stock: product.stock }];

  const [selectedVariant, setSelectedVariant] = useState<any>(variantList[0]);

  // Derived price / stock / discount from selected variant
  const activePrice = selectedVariant?.price ?? product.price;
  const activeOriginalPrice = selectedVariant?.originalPrice ?? product.originalPrice;
  const activeStock = selectedVariant?.stock ?? product.stock;
  const activeWeight = selectedVariant?.weight ?? (product as any).weight;

  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const sales = MOCK_SALES[index % MOCK_SALES.length];
  const discount = activeOriginalPrice && activeOriginalPrice > activePrice
    ? Math.round(((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100)
    : 0;
  const isTop3 = index < 3;

  // Sync selected variant when product changes
  useEffect(() => {
    if (variantList.length > 0) {
      setSelectedVariant(variantList[0]);
    }
  }, [product._id]);

  const smoothProgress = useSpring(sectionProgress, { damping: 30, stiffness: 60 });
  const yOffset = useTransform(smoothProgress, [0, 1], [index % 2 === 0 ? '6%' : '-6%', index % 2 === 0 ? '-6%' : '6%']);

  const handleAddToCart = useCallback(() => {
    addItem({
      _id: product._id,
      id: product._id,
      name: product.name,
      price: activePrice,
      image: getImageUrl(product.image),
      quantity: qty,
      weight: activeWeight,
    } as any);
    setAdded(true);
    toast.success(`${product.name} (${activeWeight}) added to cart!`);
    setTimeout(() => { setAdded(false); setQty(1); }, 2000);
  }, [product, qty, addItem, activePrice, activeWeight]);

  const toggleFav = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to add to wishlist');
      return;
    }

    const item: WishlistItem = {
      id: product._id,
      name: product.name,
      price: activePrice,
      originalPrice: activeOriginalPrice,
      image: getImageUrl(product.image),
      category: typeof product.category === 'string' ? product.category : product.category?.name,
      rating: product.rating,
      weight: activeWeight,
      stock: activeStock,
    };

    if (wishlisted) {
      removeFromWishlist(product._id);
      toast.success(`Removed ${product.name} from wishlist`);
      try {
        await apiClient.delete(`/wishlist/${product._id}`);
      } catch {
        addToWishlist(item);
        toast.error('Failed to update wishlist on server');
      }
    } else {
      addToWishlist(item);
      toast.success(`Added ${product.name} to wishlist ❤️`);
      try {
        await apiClient.post(`/wishlist/${product._id}`);
      } catch {
        removeFromWishlist(product._id);
        toast.error('Failed to update wishlist on server');
      }
    }
  }, [wishlisted, product, activePrice, activeOriginalPrice, activeWeight, activeStock, addToWishlist, removeFromWishlist, isAuthenticated]);

  return (
    <motion.div
      style={{ y: yOffset }}
      className="h-full"
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* 3-D flip container */}
      <div
        className="relative w-full h-full cursor-pointer"
        style={{ perspective: '1200px' }}
        onMouseEnter={() => setFlipped(true)}
        onMouseLeave={() => setFlipped(false)}
      >
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* ── FRONT ─────────────────────────────────────────── */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)]" />

            {/* Rank badge */}
            {isTop3 && (
              <motion.div
                className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Award className="w-3.5 h-3.5 text-yellow-300" />
                <span className="text-white font-black text-xs tracking-widest">
                  #{index + 1} SELLER
                </span>
              </motion.div>
            )}

            {/* Wishlist Button */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => { e.stopPropagation(); toggleFav(); }}
              className={`absolute top-4 ${discount > 0 ? 'right-16' : 'right-4'} z-30 bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-md text-white transition-colors shadow-md`}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </motion.button>

            {/* Discount badge */}
            {discount > 0 && (
              <div className="absolute top-4 right-4 z-20 bg-white text-[#D63220] font-black text-sm px-3 py-1 rounded-full shadow-lg">
                -{discount}%
              </div>
            )}

            {/* Stock warning */}
            {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
              <motion.div
                className="absolute top-4 right-4 z-20 bg-red-500 text-white font-black text-[10px] px-3 py-1 rounded-full"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Only {product.stock} left!
              </motion.div>
            )}

            {/* Product image */}
            <div className="absolute inset-0 flex items-center justify-center p-8 pt-16 cursor-pointer">
              <Link to={`/product/${product._id}`} className="w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()} title={`View ${product.name} details`}>
                <motion.img
                  src={getImageUrl(product.image)}
                  alt={product.name}
                  className="w-[70%] h-[60%] object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.4)] cursor-pointer"
                  style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))' }}
                  onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300'; }}
                />
              </Link>
            </div>

            {/* Bottom info strip */}
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-white font-black text-lg leading-tight line-clamp-2">
                    {product.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-yellow-300 font-black text-xl">₹{activePrice}</span>
                    {activeOriginalPrice && activeOriginalPrice > activePrice && (
                      <span className="text-white/40 line-through text-sm">₹{activeOriginalPrice}</span>
                    )}
                  </div>
                </div>
                <RankCounter target={sales} label="sold" />
              </div>
              {/* Stars */}
              <div className="flex items-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'fill-white/20 text-white/20'}`} />
                ))}
                <span className="text-white/60 text-xs ml-1">{(product.rating || 5).toFixed(1)}</span>
              </div>
            </div>

            {/* Hover hint */}
            <motion.div
              className="absolute bottom-20 right-5 text-white/30 text-xs font-medium"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              hover to buy →
            </motion.div>
          </div>

          {/* ── BACK ──────────────────────────────────────────── */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden flex flex-col"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            <div className={`relative z-10 flex flex-col h-full ${size === 'normal' ? 'p-4 gap-2' : 'p-6 gap-3'}`}>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-2">
                  <p className={`text-white font-black leading-tight line-clamp-2 ${size === 'normal' ? 'text-base' : 'text-xl'}`}>{product.name}</p>
                  <p className="text-white/60 text-xs mt-0.5">
                    {typeof product.category === 'string' ? product.category : product.category?.name || 'Spice'}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => { e.stopPropagation(); toggleFav(); }}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-sm shrink-0 transition-colors"
                  aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                </motion.button>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className={`text-yellow-300 font-black ${size === 'normal' ? 'text-2xl' : 'text-3xl'}`}>₹{activePrice}</span>
                {activeOriginalPrice && activeOriginalPrice > activePrice && (
                  <span className="text-white/40 line-through text-sm">₹{activeOriginalPrice}</span>
                )}
                {discount > 0 && (
                  <span className="bg-green-400/20 text-green-300 font-bold text-xs px-2 py-0.5 rounded-full">
                    -{discount}%
                  </span>
                )}
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`${size === 'normal' ? 'w-3 h-3' : 'w-4 h-4'} ${i < Math.round(product.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'fill-white/20 text-white/20'}`} />
                ))}
                <span className="text-white/60 text-xs ml-1">{(product.rating || 5).toFixed(1)} · {MOCK_SALES[index % MOCK_SALES.length].toLocaleString()} sold</span>
              </div>

              {/* Stock */}
              {activeStock !== undefined && (
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${activeStock > 5 ? 'bg-green-400' : activeStock > 0 ? 'bg-orange-400' : 'bg-red-400'}`} />
                  <span className="text-white/70 text-xs">
                    {activeStock > 5 ? 'In Stock' : activeStock > 0 ? `Only ${activeStock} left` : 'Out of Stock'}
                  </span>
                </div>
              )}

              {/* Weight Selector / Info */}
              {hasVariants && (product as any).variants.length > 1 ? (
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Select Weight</span>
                  <div className="flex flex-wrap gap-1">
                    {(product as any).variants.map((v: any) => {
                      const isSelected = v.weight === selectedVariant?.weight;
                      return (
                        <button
                          key={v.weight}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVariant(v);
                          }}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all duration-200 ${
                            isSelected
                              ? 'bg-white text-black border-white shadow-sm'
                              : 'border-white/20 text-white hover:border-white/50 hover:bg-white/5'
                          }`}
                        >
                          {v.weight}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                activeWeight && (
                  <p className="text-white/60 text-xs font-semibold text-left">
                    Weight: <span className="text-white">{activeWeight}</span>
                  </p>
                )
              )}

              {/* Hero-only: product image to fill space */}
              {size === 'hero' && (
                <div className="flex-1 flex items-center justify-center py-2">
                  <motion.img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    className="max-h-[200px] w-auto object-contain"
                    style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))' }}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300'; }}
                  />
                </div>
              )}

              {/* Qty selector */}
              <div className={`flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-2xl ${size === 'normal' ? 'p-2' : 'p-3'}`}>
                <span className="text-white/70 text-xs font-bold">Qty</span>
                <div className="flex items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => { e.stopPropagation(); setQty(q => Math.max(1, q - 1)); }}
                    className={`${size === 'normal' ? 'w-7 h-7 text-base' : 'w-8 h-8 text-lg'} rounded-full bg-white/20 text-white font-black flex items-center justify-center hover:bg-white/30`}
                  >−</motion.button>
                  <span className="text-white font-black text-base w-5 text-center">{qty}</span>
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => { e.stopPropagation(); setQty(q => q + 1); }}
                    className={`${size === 'normal' ? 'w-7 h-7 text-base' : 'w-8 h-8 text-lg'} rounded-full bg-white/20 text-white font-black flex items-center justify-center hover:bg-white/30`}
                  >+</motion.button>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-1.5">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
                  className={`w-full flex items-center justify-center gap-2 bg-white text-[#3E2314] font-black ${size === 'normal' ? 'py-2.5 text-sm' : 'py-3.5'} rounded-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all`}
                >
                  <AnimatePresence mode="wait">
                    {added ? (
                      <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Added!</span>
                      </motion.div>
                    ) : (
                      <motion.div key="cart" className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        Add to Cart — ₹{activePrice * qty}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
                <Link to={`/product/${product._id}`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full flex items-center justify-center gap-2 bg-white/15 text-white font-bold ${size === 'normal' ? 'py-2 text-sm' : 'py-3'} rounded-2xl border border-white/20 hover:bg-white/25 transition-all`}
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ─── Mobile Immersive Card ─────────────────────────────────────────────────

const MobileCard = ({
  product,
  index,
  isActive,
}: {
  product: ProductType;
  index: number;
  isActive: boolean;
}) => {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCartStore();
  const { isWishlisted, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const wishlisted = isWishlisted(product._id);

  const hasVariants = Array.isArray((product as any).variants) && (product as any).variants.length > 0;
  const variantList = hasVariants
    ? (product as any).variants
    : [{ weight: (product as any).weight || '', price: product.price, originalPrice: product.originalPrice, stock: product.stock }];

  const [selectedVariant, setSelectedVariant] = useState<any>(variantList[0]);

  // Derived price / stock / discount from selected variant
  const activePrice = selectedVariant?.price ?? product.price;
  const activeOriginalPrice = selectedVariant?.originalPrice ?? product.originalPrice;
  const activeStock = selectedVariant?.stock ?? product.stock;
  const activeWeight = selectedVariant?.weight ?? (product as any).weight;

  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const sales = MOCK_SALES[index % MOCK_SALES.length];
  const discount = activeOriginalPrice && activeOriginalPrice > activePrice
    ? Math.round(((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100)
    : 0;

  // Sync selected variant when product changes
  useEffect(() => {
    if (variantList.length > 0) {
      setSelectedVariant(variantList[0]);
    }
  }, [product._id]);

  const handleAddToCart = () => {
    addItem({
      _id: product._id,
      id: product._id,
      name: product.name,
      price: activePrice,
      image: getImageUrl(product.image),
      quantity: qty,
      weight: activeWeight,
    } as any);
    setAdded(true);
    if ('vibrate' in navigator) navigator.vibrate(50);
    toast.success(`${product.name} (${activeWeight}) added!`);
    setTimeout(() => { setAdded(false); setQty(1); }, 2000);
  };

  return (
    <div className={`relative w-full h-full rounded-[2rem] overflow-hidden flex flex-col`}>
      {/* Full bleed gradient bg */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(255,255,255,0.2),transparent_55%)]" />

      {/* Top badges */}
      <div className="relative z-10 flex items-center justify-between p-5">
        {index < 3 ? (
          <motion.div
            className="flex items-center gap-1.5 bg-white/25 backdrop-blur-md px-3 py-1.5 rounded-full"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <Award className="w-3.5 h-3.5 text-yellow-300" />
            <span className="text-white font-black text-xs">#{index + 1} Best Seller</span>
          </motion.div>
        ) : <div />}
        {discount > 0 && (
          <div className="bg-white text-[#D63220] font-black text-sm px-3 py-1 rounded-full shadow-lg">
            -{discount}%
          </div>
        )}
      </div>

      {/* Product image — centered hero */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-8 cursor-pointer">
        <Link to={`/product/${product._id}`} className="w-full h-full flex items-center justify-center" title={`View ${product.name} details`}>
          <motion.img
            src={getImageUrl(product.image)}
            alt={product.name}
            className="w-full max-w-[260px] aspect-square object-contain cursor-pointer"
            style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.5))' }}
            animate={isActive ? { y: [0, -12, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300'; }}
          />
        </Link>
      </div>

      {/* Floating stats pill */}
      <motion.div
        className="absolute top-1/2 right-5 bg-black/40 backdrop-blur-md px-3 py-2 rounded-2xl flex flex-col items-center gap-1"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <Flame className="w-4 h-4 text-orange-400" />
        <span className="text-white font-black text-xs">{(sales / 1000).toFixed(1)}k</span>
        <span className="text-white/50 text-[9px]">sold</span>
      </motion.div>

      {/* Bottom sheet */}
      <div className="relative z-10 bg-black/30 backdrop-blur-xl p-5 rounded-b-[2rem]">
        {/* Name + price */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 pr-3">
            <Link to={`/product/${product._id}`}>
              <h3 className="text-white font-black text-xl leading-tight line-clamp-2">{product.name}</h3>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < Math.round(product.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'fill-white/20 text-white/20'}`} />
                ))}
              </div>
              <span className="text-white/50 text-xs">{(product.rating || 5).toFixed(1)}</span>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => {
              if (wishlisted) {
                removeFromWishlist(product._id);
                toast.success(`Removed ${product.name} from wishlist`);
              } else {
                addToWishlist({
                  id: product._id,
                  name: product.name,
                  price: activePrice,
                  originalPrice: activeOriginalPrice,
                  image: getImageUrl(product.image),
                  category: typeof product.category === 'string' ? product.category : product.category?.name,
                  rating: product.rating,
                  weight: activeWeight,
                  stock: activeStock,
                });
                toast.success(`Added ${product.name} to wishlist ❤️`);
              }
            }}
            className="bg-white/20 p-2 rounded-full"
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </motion.button>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-yellow-300 font-black text-2xl">₹{activePrice}</span>
          {activeOriginalPrice && activeOriginalPrice > activePrice && (
            <span className="text-white/40 line-through">₹{activeOriginalPrice}</span>
          )}
        </div>

        {/* Weight selector */}
        {hasVariants && (product as any).variants.length > 1 ? (
          <div className="mb-3 text-left">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5">Select Weight</p>
            <div className="flex flex-wrap gap-1.5">
              {(product as any).variants.map((v: any) => {
                const isSelected = v.weight === selectedVariant?.weight;
                return (
                  <button
                    key={v.weight}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-white text-black border-white'
                        : 'border-white/15 text-white hover:bg-white/5'
                    }`}
                  >
                    {v.weight}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          activeWeight && (
            <p className="text-white/60 text-xs font-semibold mb-3 text-left">
              Weight: <span className="text-white">{activeWeight}</span>
            </p>
          )
        )}

        {/* Qty + Add to Cart */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-white/15 rounded-2xl px-4 py-2.5">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="text-white font-black text-xl w-6 text-center">−</button>
            <span className="text-white font-black">{qty}</span>
            <button onClick={() => setQty(q => q + 1)} className="text-white font-black text-xl w-6 text-center">+</button>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-[#3E2314] font-black py-3 rounded-2xl text-sm shadow-lg"
          >
            <AnimatePresence mode="wait">
              {added ? (
                <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" /> Added!
                </motion.span>
              ) : (
                <motion.span key="add" className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" /> Add to Cart
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Section Export ───────────────────────────────────────────────────

export const ProductScrollGrid = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [dragStart, setDragStart] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const { data: productsData, isLoading } = useProducts({ limit: 8, sort: '-sold' });
  const products = productsData?.data?.products || productsData?.data || [];
  const arrayProducts: ProductType[] = Array.isArray(products) ? products.slice(0, 8) : [];

  // Scroll-driven title
  const titleY = useTransform(scrollYProgress, [0, 0.35], ['60px', '0px']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.25], [0, 1]);

  // Responsive
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Auto-advance mobile carousel
  useEffect(() => {
    if (!isMobile || !autoPlay || arrayProducts.length === 0) return;
    const id = setInterval(() => setCurrentSlide(s => (s + 1) % arrayProducts.length), 4500);
    return () => clearInterval(id);
  }, [isMobile, autoPlay, arrayProducts.length]);

  // Re-enable autoplay after user inactivity
  useEffect(() => {
    if (autoPlay) return;
    const id = setTimeout(() => setAutoPlay(true), 8000);
    return () => clearTimeout(id);
  }, [autoPlay]);

  const prev = () => { setCurrentSlide(s => (s - 1 + arrayProducts.length) % arrayProducts.length); setAutoPlay(false); };
  const next = () => { setCurrentSlide(s => (s + 1) % arrayProducts.length); setAutoPlay(false); };

  // Determine bento layout slots
  // Layout: [0]=hero(tall-left), [1],[2],[3],[4]=right-column grid, [5],[6],[7]=bottom row
  const hero = arrayProducts[0];
  const sideCards = arrayProducts.slice(1, 5);
  const bottomCards = arrayProducts.slice(5, 8);

  // Stable particles (avoid recalculating on every render)
  const particles = useRef(
    Array.from({ length: 16 }, (_, i) => ({
      emoji: SPICE_EMOJIS[i % SPICE_EMOJIS.length],
      delay: i * 0.6,
      duration: 5 + (i % 5),
      x: (i * 6.25) % 100,
      y: (i * 11.3) % 90,
    }))
  ).current;

  return (
    <section
      ref={sectionRef}
      className="relative py-16 lg:py-32 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #FAF7F2 0%, #FFF5EC 40%, #FAF0E6 100%)' }}
    >
      {/* Ambient glow blobs */}
      <div className="absolute -top-32 -right-32 w-[700px] h-[700px] bg-[#E65C19]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[700px] h-[700px] bg-[#D63220]/6 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8B4513]/4 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating spice particles */}
      {particles.map((p, i) => <FloatingParticle key={i} {...p} />)}

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* ── Section Header ── */}
        <motion.div
          style={{ y: titleY, opacity: titleOpacity }}
          className="text-center mb-4 lg:mb-10"
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-[#D63220]/10 text-[#D63220] px-5 py-2 rounded-full mb-4 lg:mb-6"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="font-black tracking-[0.25em] uppercase text-xs">Bestsellers</span>
            <Zap className="w-3.5 h-3.5" />
          </motion.div>

          <h2 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-[#3E2314] leading-[1.05] tracking-tight">
            Customer{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #D63220 0%, #E65C19 40%, #8B4513 100%)' }}
            >
              Favourites
            </span>
          </h2>
          <p className="mt-4 text-base md:text-lg lg:text-xl text-[#3E2314]/55 max-w-2xl mx-auto font-medium leading-relaxed">
            Small-batch, hand-ground spices — as trusted by thousands of home cooks and professional chefs.
          </p>
        </motion.div>

        {/* ── Trust Marquee ── */}
        <TrustMarquee />

        {/* ══════════════════════════════════════════════════════
            MOBILE: Full-screen immersive carousel
        ══════════════════════════════════════════════════════ */}
        <div className="md:hidden">
          {isLoading ? (
            <ProductCardSkeleton />
          ) : arrayProducts.length > 0 ? (
            <div className="relative">
              {/* Card stage */}
              <div
                className="relative overflow-hidden"
                style={{ height: '58vh', minHeight: 440, maxHeight: 540 }}
                onPointerDown={(e) => setDragStart(e.clientX)}
                onPointerUp={(e) => {
                  const diff = dragStart - e.clientX;
                  if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); }
                }}
              >
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={currentSlide}
                    initial={{ x: '100%', opacity: 0, scale: 0.9 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    exit={{ x: '-100%', opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0"
                  >
                    <MobileCard
                      product={arrayProducts[currentSlide]}
                      index={currentSlide}
                      isActive={true}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Prev / Next arrows */}
                <button
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Dot indicators */}
              <div className="flex justify-center gap-2 mt-5">
                {arrayProducts.map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => { setCurrentSlide(i); setAutoPlay(false); }}
                    className={`h-2 rounded-full transition-all ${i === currentSlide ? 'w-8 bg-[#D63220]' : 'w-2 bg-[#3E2314]/20'}`}
                    whileTap={{ scale: 0.85 }}
                  />
                ))}
              </div>

              {/* Slide counter */}
              <p className="text-center mt-3 text-[#3E2314]/40 text-sm font-bold">
                <span className="text-[#3E2314]/80">{currentSlide + 1}</span> / {arrayProducts.length}
              </p>
            </div>
          ) : (
            <div className="text-center py-20 text-[#3E2314]/40 font-serif text-xl">No products found</div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
            DESKTOP: Asymmetric Bento Grid
        ══════════════════════════════════════════════════════ */}
        <div className="hidden md:block">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : arrayProducts.length > 0 ? (
            <div className="flex flex-col gap-6">
              {/* Row 1: Hero left (tall) + 4-card 2×2 right */}
              <div className="grid grid-cols-3 gap-6" style={{ gridTemplateColumns: '1.6fr 1fr 1fr' }}>
                {/* Hero card — spans 2 rows */}
                <div className="row-span-2" style={{ gridRow: 'span 2', minHeight: 560 }}>
                  {hero && (
                    <DesktopCard product={hero} index={0} sectionProgress={scrollYProgress} size="hero" />
                  )}
                </div>

                {/* 4 normal cards in a 2×2 on the right */}
                {sideCards.map((p, i) => (
                  <div key={p._id} style={{ minHeight: 380 }}>
                    <DesktopCard product={p} index={i + 1} sectionProgress={scrollYProgress} />
                  </div>
                ))}
              </div>

              {/* Row 2: Bottom 3 equal cards */}
              {bottomCards.length > 0 && (
                <div className={`grid gap-6 grid-cols-${bottomCards.length}`}>
                  {bottomCards.map((p, i) => (
                    <div key={p._id} style={{ minHeight: 380 }}>
                      <DesktopCard product={p} index={i + 5} sectionProgress={scrollYProgress} size="wide" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-[#3E2314]/40 font-serif text-2xl">No Bestsellers found</div>
          )}
        </div>

        {/* ── View All CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center mt-12 lg:mt-20"
        >
          <Link to="/products">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="group inline-flex items-center gap-3 px-8 lg:px-12 py-4 lg:py-5 rounded-full font-black text-base lg:text-lg bg-gradient-to-r from-[#D63220] to-[#E65C19] text-white shadow-[0_15px_40px_rgba(214,50,32,0.3)] hover:shadow-[0_25px_60px_rgba(214,50,32,0.45)] transition-all duration-300"
            >
              Explore All Products
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
