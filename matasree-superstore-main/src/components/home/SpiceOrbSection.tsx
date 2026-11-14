/**
 * SpiceOrbSection
 *
 * Implements two highly premium sections:
 * 1. Spice Mixing Scroll Animation: Haldi (left) & Mirch (right) merging into Matasree Super logo.
 * 2. Category Wheel Browser: Rotating snapped wheel selecting Garam, Kitchen King, Meat, and Chaat masalas.
 *
 * Requirements: 6 (Spice Mixing), 7 (Category Wheel Browser)
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Flame, Sun, Leaf, Sparkles, ShoppingCart, Check, RotateCcw } from 'lucide-react';
import { useProducts } from '@/hooks/useApi';
import { useCartStore } from '@/store/cartStore';
import logo from '@/assets/matasree-logo.png';
import { toast } from 'sonner';
import type { Product } from '@/types';

// ━━━━ SPICE MIXING SCROLL ANIMATION ━━━━

const SpiceMixingScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll position of the mixing segment
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Scroll animations mapping
  // 1. Translation: meet in center at progress 0.45
  const haldiX = useTransform(scrollYProgress, [0, 0.45], ['-35vw', '0vw']);
  const mirchX = useTransform(scrollYProgress, [0, 0.45], ['35vw', '0vw']);
  
  // 2. Convergence effect (glow flash when they meet)
  const flashScale = useTransform(scrollYProgress, [0.42, 0.45, 0.48], [0, 2.5, 0]);
  const flashOpacity = useTransform(scrollYProgress, [0.42, 0.45, 0.48], [0, 0.9, 0]);

  // 3. Logo appearance: starts scaling up right after merge (0.45 -> 0.7)
  const logoScale = useTransform(scrollYProgress, [0.45, 0.65, 0.8], [0.4, 1.1, 1]);
  const logoOpacity = useTransform(scrollYProgress, [0.45, 0.58], [0, 1]);
  const logoRotate = useTransform(scrollYProgress, [0.45, 0.75], [-180, 0]);

  // 4. Tagline / text fades in after logo stabilizes
  const textOpacity = useTransform(scrollYProgress, [0.65, 0.78], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.65, 0.78], [30, 0]);

  // 5. Powders fade out as logo merges and takes over
  const powderOpacity = useTransform(scrollYProgress, [0.43, 0.52], [1, 0]);

  // Particle bursts at the collision point
  const particlePositions = useMemo(() => {
    return Array.from({ length: 24 }).map((_, idx) => {
      const angle = (idx / 24) * 2 * Math.PI;
      const distance = Math.random() * 120 + 60;
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        color: idx % 2 === 0 ? '#F5A623' : '#D63220', // Haldi vs Mirch
        size: Math.random() * 8 + 4,
      };
    });
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[180vh] bg-[#0A0502]">
      {/* Sticky container */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        
        {/* Subtle background spice mandala pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none mandala-pattern" 
          aria-hidden="true" 
        />

        {/* Ambient radial glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#F5A623]/10 blur-[120px]" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#D63220]/10 blur-[120px]" />
        </div>

        {/* Sticky section header */}
        <div className="absolute top-12 text-center px-4 pointer-events-none z-10">
          <span className="text-xs font-black tracking-[0.3em] uppercase text-[#D63220] block mb-2">
            Brand Storytelling
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-black text-white">
            The Golden Blending
          </h2>
          <p className="text-white/40 text-sm mt-2 font-medium">
            Scroll down to watch the spices mix
          </p>
        </div>

        {/* ── MIXING ARENA ── */}
        <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">

          {/* Haldi Cloud (Left side) */}
          <motion.div
            style={{ x: haldiX, opacity: powderOpacity }}
            className="absolute z-20 flex flex-col items-center"
          >
            {/* Glowing powder core */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FFE57F] via-[#F5A623] to-[#D4AC0D] shadow-[0_0_50px_rgba(245,166,35,0.6)] flex flex-col items-center justify-center relative">
              <span className="text-xs font-black text-[#6E2C00] tracking-wider uppercase">Haldi</span>
              {/* Outer floating clouds */}
              <div className="absolute -inset-4 rounded-full border border-[#F5A623]/30 animate-pulse-slow" />
            </div>
            <p className="text-xs text-[#F5A623] font-bold tracking-widest uppercase mt-3">Turmeric</p>
          </motion.div>

          {/* Mirch Cloud (Right side) */}
          <motion.div
            style={{ x: mirchX, opacity: powderOpacity }}
            className="absolute z-20 flex flex-col items-center"
          >
            {/* Glowing powder core */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FFA07A] via-[#D63220] to-[#922B21] shadow-[0_0_50px_rgba(214,50,32,0.6)] flex flex-col items-center justify-center relative">
              <span className="text-xs font-black text-white tracking-wider uppercase">Mirch</span>
              {/* Outer floating clouds */}
              <div className="absolute -inset-4 rounded-full border border-[#D63220]/30 animate-pulse-slow" style={{ animationDelay: '1s' }} />
            </div>
            <p className="text-xs text-[#D63220] font-bold tracking-widest uppercase mt-3">Red Chili</p>
          </motion.div>

          {/* Merge Collision Flash */}
          <motion.div
            style={{ scale: flashScale, opacity: flashOpacity }}
            className="absolute w-32 h-32 rounded-full bg-white blur-md z-30"
          />

          {/* Merge Explosive Particles */}
          {particlePositions.map((p, i) => {
            // Animating particles expanding radially outward from progress 0.45 to 0.65
            const pX = useTransform(scrollYProgress, [0.45, 0.65], [0, p.x]);
            const pY = useTransform(scrollYProgress, [0.45, 0.65], [0, p.y]);
            const pOpacity = useTransform(scrollYProgress, [0.45, 0.52, 0.62], [0, 1, 0]);

            return (
              <motion.div
                key={i}
                style={{
                  x: pX,
                  y: pY,
                  opacity: pOpacity,
                  backgroundColor: p.color,
                  width: p.size,
                  height: p.size,
                }}
                className="absolute rounded-full z-25 pointer-events-none"
              />
            );
          })}

          {/* Resulting Matasree Logo */}
          <motion.div
            style={{
              scale: logoScale,
              opacity: logoOpacity,
              rotate: logoRotate,
            }}
            className="absolute z-40 flex flex-col items-center"
          >
            <div className="relative group p-8 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
              {/* Gold glow outline */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF9933] to-[#128807] rounded-[2.5rem] blur-2xl opacity-20" />
              <img
                src={logo}
                alt="Matasree Super Logo"
                className="w-44 md:w-52 object-contain drop-shadow-[0_15px_30px_rgba(244,208,63,0.3)]"
              />
            </div>
          </motion.div>
        </div>

        {/* Story details / Brand slogan */}
        <motion.div
          style={{ opacity: textOpacity, y: textY }}
          className="absolute bottom-16 text-center max-w-md px-6 z-10 pointer-events-none"
        >
          <h3 className="font-serif text-xl font-bold text-white mb-2">
            Matasree Super Masale
          </h3>
          <p className="text-white/60 text-sm leading-relaxed font-medium">
            Merging pure, golden turmeric with the vibrant heat of hand-selected chilies. Rooted in tradition, stone-ground for absolute flavor integrity.
          </p>
        </motion.div>

        {/* Scroll hint line */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-30">
          <div className="w-1 h-8 rounded bg-gradient-to-b from-white to-transparent" />
        </div>
      </div>
    </div>
  );
};

// ━━━━ CATEGORY WHEEL BROWSER ━━━━

interface CategoryNode {
  name: string;
  tag: string;
  description: string;
  icon: React.ElementType;
  color: string;
  angle: number;
}

const CATEGORIES: CategoryNode[] = [
  {
    name: 'Garam Masala',
    tag: 'garam masala',
    description: 'A traditional warm heritage blend of 17 whole spices, stone-ground at low temperatures to lock in rich, intense aromas.',
    icon: Flame,
    color: '#D63220',
    angle: 0, // Top
  },
  {
    name: 'Kitchen King',
    tag: 'kitchen king',
    description: 'The ultimate all-purpose seasoning that elevates any vegetable, paneer, or curry dish with a royal blend of premium herbs.',
    icon: Sun,
    color: '#F5A623',
    angle: 90, // Right
  },
  {
    name: 'Meat Masala',
    tag: 'meat masala',
    description: 'A robust, slow-roasted blend engineered to penetrate deeply into meat proteins, delivering authentic dhaba-style richness.',
    icon: Leaf,
    color: '#8B4513',
    angle: 180, // Bottom
  },
  {
    name: 'Chaat Masala',
    tag: 'chaat masala',
    description: 'A tangy, zesty seasoning loaded with black salt, dry mango, and cumin — perfect for fruits, snacks, and street food.',
    icon: Sparkles,
    color: '#27AE60',
    angle: 270, // Left
  },
];

// ── Wheel Product Row (Variant & Add to Cart Support) ────────

const WheelProductRow = ({ product, cartItems, addItem }: { product: any; cartItems: any[]; addItem: any }) => {
  const productId = product.id ?? product._id;
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

  const normalize = (w: string) => w.toLowerCase().replace(/\s+/g, '').replace(/gms?/g, 'g');
  const getDefaultVariantIndex = (variants: any[], baseWeight?: string) => {
    if (!baseWeight || !variants || variants.length === 0) return 0;
    const normalizedBase = normalize(baseWeight);
    const index = variants.findIndex(v => normalize(v.weight) === normalizedBase);
    return index !== -1 ? index : 0;
  };

  const defaultIndex = getDefaultVariantIndex(product.variants || [], product.weight);
  const [selectedVariant, setSelectedVariant] = useState<any>(
    hasVariants ? product.variants[defaultIndex] : { weight: product.weight, price: product.price, originalPrice: product.originalPrice, stock: product.stock }
  );

  // Sync selected variant when product changes
  useEffect(() => {
    const hasVars = Array.isArray(product.variants) && product.variants.length > 0;
    const defIdx = getDefaultVariantIndex(product.variants || [], product.weight);
    setSelectedVariant(
      hasVars ? product.variants[defIdx] : { weight: product.weight, price: product.price, originalPrice: product.originalPrice, stock: product.stock }
    );
  }, [product._id, product.variants]);

  const activePrice = selectedVariant?.price ?? product.price;
  const activeWeight = selectedVariant?.weight ?? product.weight;
  
  // Check if this specific variant is in cart
  const inCart = cartItems.some(
    (item) => item.productId === productId && normalize(item.weight || '') === normalize(activeWeight || '')
  );

  const handleAddToCart = () => {
    addItem({
      ...product,
      price: activePrice,
      weight: activeWeight,
      quantity: 1,
    });
    toast.success(`${product.name} (${activeWeight}) added to cart!`);
  };

  return (
    <div className="flex gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl items-center hover:border-white/20 transition duration-300">
      <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
      <div className="flex-1 min-w-0 text-left">
        <p className="text-xs font-bold text-white truncate">{product.name}</p>
        <p className="text-[10px] text-white/50 font-semibold">
          {activeWeight && `${activeWeight} · `}₹{activePrice}
        </p>
        {/* Render small variant selectors if more than 1 */}
        {hasVariants && product.variants.length > 1 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {product.variants.map((v: any) => {
              const isSelected = selectedVariant && v.weight === selectedVariant.weight;
              return (
                <button
                  key={v.weight}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border transition-all ${
                    isSelected
                      ? 'bg-white text-black border-white shadow-sm'
                      : 'border-white/20 text-white hover:bg-white/10 hover:border-white/50'
                  }`}
                >
                  {v.weight}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={inCart}
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition ${
          inCart
            ? 'bg-green-600/10 text-green-400 font-bold'
            : 'bg-white/10 text-white hover:bg-white hover:text-black'
        }`}
      >
        {inCart ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
      </button>
    </div>
  );
};

const CategoryWheelBrowser = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const { data: productsData } = useProducts();
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  // Horizontal drag gesture handler
  const handleDrag = (event: any, info: any) => {
    setRotation((prev) => prev + info.delta.x * 0.45);
  };

  const handleDragEnd = () => {
    // Snap to closest 90 degree step
    const nearest90 = Math.round(rotation / 90) * 90;
    setRotation(nearest90);

    // activeIndex = -nearest90 / 90
    const activeIdx = ((Math.round(-nearest90 / 90) % 4) + 4) % 4;
    setActiveIndex(activeIdx);
  };

  // Animate wheel to center the clicked category node at top (0 degrees)
  const selectCategory = (index: number) => {
    setActiveIndex(index);
    const targetRot = -index * 90;
    
    // Smooth scroll interpolation logic
    const currentRot = rotation;
    const diff = ((targetRot - currentRot + 180) % 360) - 180;
    const adjustedDiff = diff < -180 ? diff + 360 : diff;
    setRotation(currentRot + adjustedDiff);
  };

  // Match products associated with active category tag
  const matchingProducts = useMemo(() => {
    const rawProducts = (productsData as any)?.data?.data ?? (productsData as any)?.data?.products ?? (productsData as any)?.products ?? [];
    const normalized = Array.isArray(rawProducts) ? rawProducts : [];
    if (normalized.length === 0) return [];
    
    const activeTag = CATEGORIES[activeIndex].tag.toLowerCase();
    return normalized
      .filter((p: any) => p.name.toLowerCase().includes(activeTag) || p.description?.toLowerCase().includes(activeTag))
      .slice(0, 2);
  }, [productsData, activeIndex]);

  const activeCategory = CATEGORIES[activeIndex];
  const Icon = activeCategory.icon;

  return (
    <section className="relative w-full py-24 bg-[#0A0502] overflow-hidden border-t border-white/5">
      
      {/* Background glow orb */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-[130px] pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: activeCategory.color }}
      />

      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-black tracking-[0.25em] uppercase text-[#F5A623] block mb-2">
            Rotary Selector
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-black text-white mb-4">
            Browse Masala Categories
          </h2>
          <p className="text-white/40 text-sm max-w-md mx-auto">
            Drag the outer ring horizontally to spin, or click on a node directly to explore.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* ── WHEEL COLUMN ── */}
          <div className="flex justify-center items-center h-[360px] md:h-[450px] relative select-none">
            
            {/* Drag Area Overlay */}
            <motion.div
              drag="x"
              dragConstraints={{ left: -1, right: 1 }}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              className="absolute w-80 h-80 rounded-full cursor-grab active:cursor-grabbing z-30 flex items-center justify-center"
            >
              {/* Inner active focal point */}
              <div 
                className="w-24 h-24 rounded-full flex flex-col items-center justify-center bg-black/60 border-2 transition-all duration-700 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
                style={{ borderColor: activeCategory.color }}
              >
                <activeCategory.icon className="w-8 h-8 transition-colors duration-700" style={{ color: activeCategory.color }} />
                <span className="text-[9px] font-black tracking-widest text-white/50 uppercase mt-1">Spin</span>
              </div>
            </motion.div>

            {/* Rotating Outer Wheel Frame */}
            <motion.div
              animate={{ rotate: rotation }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="w-80 h-80 rounded-full border border-white/10 relative flex items-center justify-center"
            >
              {/* Ornate circular connector guide */}
              <div className="absolute inset-8 rounded-full border border-dashed border-white/5" />
              
              {/* Nodes (placed at 0, 90, 180, 270 offsets) */}
              {CATEGORIES.map((cat, idx) => {
                const isActive = activeIndex === idx;
                const Icon = cat.icon;
                
                // Angle placement: adjust position based on angle
                const rad = (cat.angle * Math.PI) / 180;
                const radius = 135; // placement distance from center
                const leftPos = `calc(50% + ${Math.sin(rad) * radius}px)`;
                const topPos = `calc(50% - ${Math.cos(rad) * radius}px)`;

                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => selectCategory(idx)}
                    className="absolute w-14 h-14 rounded-full flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 border transition-all duration-700 hover:scale-110 z-20 focus:outline-none"
                    style={{
                      left: leftPos,
                      top: topPos,
                      backgroundColor: isActive ? cat.color : '#160B06',
                      borderColor: isActive ? 'white' : 'rgba(255,255,255,0.15)',
                      boxShadow: isActive ? `0 0 25px ${cat.color}` : 'none',
                    }}
                  >
                    {/* Rotate node label back so text stays upright */}
                    <motion.div
                      animate={{ rotate: -rotation }}
                      transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                      className="flex items-center justify-center"
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white animate-pulse' : 'text-white/60'}`} />
                    </motion.div>
                  </button>
                );
              })}
            </motion.div>
          </div>

          {/* ── DETAILS COLUMN ── */}
          <div className="flex flex-col gap-6">
            
            {/* Category details card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: activeCategory.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <h3 className="font-serif text-2xl font-black text-white">
                    {activeCategory.name}
                  </h3>
                </div>

                <p className="text-white/70 text-base leading-relaxed mb-6 font-medium">
                  {activeCategory.description}
                </p>

                <div className="flex gap-4 items-center">
                  <Link
                      to={`/products?category=${activeCategory.tag}`}
                      className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-white text-sm transition hover:opacity-90"
                      style={{ backgroundColor: activeCategory.color }}
                    >
                      Explore Category
                    </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Showcase products associated with this category */}
            <div className="space-y-4">
              <h4 className="text-xs font-black tracking-widest text-white/40 uppercase">
                Featured Products
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
                {matchingProducts.length === 0 ? (
                  // Fallback loading skeletons if no products fetched yet
                  [1, 2].map((i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-3 rounded-2xl h-16 animate-pulse" />
                  ))
                ) : (
                  matchingProducts.map((product: any) => (
                    <WheelProductRow
                      key={product.id ?? product._id}
                      product={product}
                      cartItems={cartItems}
                      addItem={addItem}
                    />
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

// Main Export combining scroll mixing and category wheel
export const SpiceOrbSection = () => {
  return (
    <>
      <SpiceMixingScroll />
      <CategoryWheelBrowser />
    </>
  );
};

export default SpiceOrbSection;
