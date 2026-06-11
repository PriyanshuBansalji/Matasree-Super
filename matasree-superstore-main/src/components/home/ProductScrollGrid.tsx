import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion';
import { ShoppingBag, Star, Eye, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/useApi';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { ProductCardSkeleton } from '@/components/skeletons/ProductCardSkeleton';

export interface CategoryProps {
  name: string;
}

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

const ProductCard = ({ product, index, sectionProgress }: { product: ProductType, index: number, sectionProgress: MotionValue<number> }) => {
  const { addItem } = useCartStore();
  
  const colIndex = index % 3;
  const rowIndex = Math.floor(index / 3);
  
  // Staggered parallax: each column + row creates unique depth
  const yRanges: [string, string][] = [
    ['8%', '-8%'],    // Left column
    ['18%', '-18%'],  // Middle column — moves most
    ['12%', '-12%'],  // Right column
  ];
  
  const smoothProgress = useSpring(sectionProgress, { damping: 25, stiffness: 80 });
  const parallaxY = useTransform(smoothProgress, [0, 1], yRanges[colIndex]);
  const parallaxRotate = useTransform(smoothProgress, [0, 1], [colIndex === 1 ? -2 : 2, colIndex === 1 ? 2 : -2]);
  // Scale shrinks slightly as you scroll past
  const parallaxScale = useTransform(smoothProgress, [0, 0.5, 1], [0.98, 1, 0.96]);
  
  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return 'https://via.placeholder.com/300';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const BACKEND_URL = 'http://localhost:5001';
    return path.startsWith('/') ? `${BACKEND_URL}${path}` : `${BACKEND_URL}/${path}`;
  };

  const handleAddToCart = () => {
    const cartItem = {
      id: product._id,
      name: product.name,
      price: product.price,
      image: getImageUrl(product.image),
      quantity: 1,
    };
    addItem(cartItem as unknown as never);
    toast.success(`${product.name} added to cart!`);
  };

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div style={{ y: parallaxY, rotate: parallaxRotate, scale: parallaxScale }} className="h-full z-10 hover:z-50 relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.82, y: 120 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, delay: (colIndex) * 0.15 + rowIndex * 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="group relative flex flex-col h-full bg-white border border-[#3E2314]/5 rounded-[2.5rem] overflow-hidden hover:border-[#3E2314]/20 transition-all duration-700 shadow-[0_15px_50px_rgba(62,35,20,0.06)] hover:shadow-[0_40px_80px_rgba(62,35,20,0.14)]"
      >
        {/* Image Area */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-[#FAF7F2] to-white p-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9),transparent)] pointer-events-none" />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[#3E2314]/5 transition-opacity duration-700 pointer-events-none" />

          <motion.img
            src={getImageUrl(product.image)}
            alt={product.name}
            className="w-[85%] h-[85%] object-contain drop-shadow-[0_40px_60px_rgba(62,35,20,0.15)] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.15] group-hover:-translate-y-4 group-hover:rotate-3"
            loading="lazy"
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { e.currentTarget.src = 'https://via.placeholder.com/300'; }}
          />

          {/* Badges */}
          <div className="absolute top-6 left-6 right-6 flex justify-between z-10 pointer-events-none">
            {discount > 0 && (
              <span className="bg-[#D63220] text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
                {discount}% Off
              </span>
            )}
            {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
              <span className="bg-[#3E2314] text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-widest ml-auto">
                Only {product.stock} Left
              </span>
            )}
          </div>

          {/* Hover overlay — Quick actions */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 bg-white/50 backdrop-blur-sm transition-all duration-500">
            <motion.div className="translate-y-6 group-hover:translate-y-0 transition-all duration-300 delay-75">
              <button 
                onClick={(e) => { e.preventDefault(); handleAddToCart(); }}
                className="flex items-center gap-2 bg-gradient-to-r from-[#D63220] to-[#E65C19] text-white px-8 py-4 rounded-full font-bold hover:shadow-[0_20px_40px_rgba(214,50,32,0.4)] transition-all hover:scale-105 active:scale-95"
              >
                <ShoppingBag className="w-5 h-5" />
                Add to Cart
              </button>
            </motion.div>
            <motion.div className="translate-y-6 group-hover:translate-y-0 transition-all duration-300 delay-150">
              <Link to={`/product/${product._id}`}>
                <button className="flex items-center gap-2 bg-white text-[#3E2314] border-2 border-[#3E2314]/10 px-8 py-4 rounded-full font-bold hover:border-[#3E2314]/30 transition-all hover:shadow-lg">
                  <Eye className="w-5 h-5" />
                  Quick View
                </button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-8 relative z-10 bg-white flex flex-col flex-1 border-t border-[#3E2314]/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating || 5) ? 'fill-[#E65C19] text-[#E65C19] drop-shadow-sm' : 'fill-gray-100 text-gray-100'}`} />
              ))}
              <span className="text-xs font-bold text-[#3E2314]/50 ml-1">{(product.rating || 5).toFixed(1)}</span>
            </div>
            <span className="text-[10px] font-bold text-[#3E2314]/40 uppercase tracking-[0.2em]">
              {typeof product.category === 'string' ? product.category : product.category?.name || 'Spice'}
            </span>
          </div>
          
          <Link to={`/product/${product._id}`} className="mt-auto">
            <h3 className="font-serif text-2xl lg:text-3xl font-black text-[#3E2314] mb-6 line-clamp-2 group-hover:text-[#D63220] transition-colors leading-tight">
              {product.name}
            </h3>
          </Link>
          
          <div className="flex items-end justify-between mt-auto">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#3E2314]/30 uppercase tracking-widest mb-1">Price</span>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-black text-[#D63220]">₹{product.price}</p>
                {product.originalPrice && product.originalPrice > product.price && (
                    <p className="text-lg text-[#3E2314]/30 line-through font-bold">₹{product.originalPrice}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const ProductScrollGrid = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const { data: productsData, isLoading } = useProducts({ limit: 8, sort: '-sold' });
  const products = productsData?.data?.products || productsData?.data || [];
  const arrayProducts = Array.isArray(products) ? products.slice(0, 8) : [];

  const titleY = useTransform(scrollYProgress, [0, 0.4], ["40%", "0%"]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <section ref={sectionRef} className="py-32 lg:py-48 bg-[#FAF7F2] relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-[-5%] right-[-5%] w-[800px] h-[800px] bg-[#E65C19]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[800px] h-[800px] bg-[#D63220]/3 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <motion.div 
          style={{ y: titleY, opacity: titleOpacity }}
          className="text-center mb-24 lg:mb-32"
        >
          <span className="text-[#D63220] font-black tracking-[0.3em] uppercase text-sm mb-6 block">Our Heritage</span>
          <h2 className="font-serif text-6xl md:text-8xl font-black text-[#3E2314] mb-8 tracking-tight leading-[1.1]">
            Curated <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#8B4513] italic pr-4">Selections</span>
          </h2>
          <p className="text-xl md:text-2xl text-[#3E2314]/60 max-w-3xl mx-auto font-medium leading-relaxed">
            Hand-ground in small batches to preserve volatile natural oils, ensuring restaurant-quality flavor in every pinch.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-14">
          {isLoading ? (
            [...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          ) : arrayProducts.length > 0 ? (
             arrayProducts.map((product: ProductType, index: number) => (
              <ProductCard key={product._id} product={product} index={index} sectionProgress={scrollYProgress} />
            ))
          ) : (
             <div className="col-span-full text-center py-20 font-serif text-3xl text-[#3E2314]/40">No Bestsellers found</div>
          )}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center mt-20"
        >
          <Link to="/products">
            <button className="group inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold text-lg border-2 border-[#3E2314]/10 text-[#3E2314] hover:border-[#D63220]/40 hover:bg-[#D63220]/5 transition-all duration-300 bg-white shadow-sm hover:shadow-lg">
              View All Products
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
