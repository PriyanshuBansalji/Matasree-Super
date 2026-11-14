/**
 * FeaturedCategoriesSection
 *
 * Displays a grid of product categories fetched from the API.
 * - Admin-set image → shown as the card photo
 * - No image set → branded gradient placeholder with first letter + "No image set" label
 * Links to /products?category={categoryName} (matched by name in ProductsPage).
 *
 * Requirements: 17.1, 17.3, 17.4
 */
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';

// Brand gradient palette — cycles per card when no admin image is set
const CARD_GRADIENTS = [
  { from: '#C0392B', to: '#E65C19' },
  { from: '#6B3A2A', to: '#A0522D' },
  { from: '#7B3F00', to: '#C47A2B' },
  { from: '#8B1A1A', to: '#C0392B' },
  { from: '#2C4A1E', to: '#5A8A3C' },
  { from: '#3B2A5E', to: '#7B5EA7' },
  { from: '#1A3A4A', to: '#2E7D8A' },
  { from: '#5A3E00', to: '#A07840' },
];

interface Category {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  description?: string;
}

const CategoryCardSkeleton = () => (
  <div
    className="rounded-2xl overflow-hidden bg-white border border-[#3E2314]/5 shadow-sm animate-pulse"
    aria-hidden="true"
  >
    <Skeleton className="aspect-[4/3] w-full rounded-none" />
    <div className="p-4">
      <Skeleton className="h-5 w-2/3 rounded-full" />
    </div>
  </div>
);

const getImageUrl = (path: string | null | undefined): string => {
  if (!path || !path.trim()) return '';
  // Already a full URL (http/https) or a data URI — use as-is
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
  return path.startsWith('/') ? `${BACKEND_URL}${path}` : `${BACKEND_URL}/${path}`;
};

const sectionVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const cardVariant = (index: number) => ({
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: index * 0.08,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
});

const FeaturedCategoriesSection = () => {
  const { data: categoriesData, isLoading } = useCategories();

  // The axios interceptor returns response.data directly.
  // Backend ApiResponse shape: { success, message, data: Category[] }
  // So categoriesData.data is the array.
  const rawCategories: Category[] = (() => {
    if (!categoriesData) return [];
    const d = (categoriesData as any);
    // Shape 1: { data: Category[] }
    if (Array.isArray(d?.data)) return d.data;
    // Shape 2: { data: { data: Category[] } } (nested)
    if (Array.isArray(d?.data?.data)) return d.data.data;
    // Shape 3: already an array
    if (Array.isArray(d)) return d;
    return [];
  })();

  const categories = rawCategories.slice(0, 8);

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={sectionVariant}
      className="py-20 md:py-28 bg-white relative overflow-hidden"
      aria-label="Featured Categories"
    >
      {/* Subtle dot grid background */}
      <div
        className="absolute inset-0 opacity-[0.018] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #3E2314 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="text-[#D63220] font-black tracking-[0.3em] uppercase text-sm mb-4 block">
            Browse by Category
          </span>
          <h2 className="font-serif text-4xl md:text-6xl font-black text-[#3E2314] mb-4 tracking-tight leading-tight">
            Explore Our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#8B4513] italic">
              Collections
            </span>
          </h2>
          <p className="text-lg text-[#3E2314]/50 max-w-2xl mx-auto font-medium">
            From fiery whole spices to fragrant blends — find the flavour that brings your recipe to life.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-8">
          {isLoading
            ? [...Array(4)].map((_, i) => <CategoryCardSkeleton key={i} />)
            : categories.map((category, index) => {
                const imgUrl = getImageUrl(category.image);
                const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

                return (
                  <motion.div
                    key={category._id}
                    variants={cardVariant(index)}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                  >
                    <Link
                      to={`/products?category=${encodeURIComponent(category.name)}`}
                      className="group block rounded-2xl overflow-hidden bg-white border border-[#3E2314]/5 hover:border-[#D63220]/20 shadow-sm hover:shadow-[0_20px_50px_rgba(62,35,20,0.1)] transition-all duration-500"
                      aria-label={`Browse ${category.name}`}
                    >
                      {/* Image area */}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {imgUrl ? (
                          /* ── Admin has set an image ── */
                          <>
                            <img
                              src={imgUrl}
                              alt={category.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#3E2314]/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          </>
                        ) : (
                          /* ── No image set — branded gradient placeholder ── */
                          <div
                            className="w-full h-full flex flex-col items-center justify-center gap-2"
                            style={{
                              background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                            }}
                          >
                            <span
                              className="font-serif font-black text-white/25 select-none leading-none"
                              style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)' }}
                            >
                              {category.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="text-white/30 text-[10px] font-medium tracking-widest uppercase">
                              No image set
                            </span>
                          </div>
                        )}

                        {/* Hover CTA */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <span className="text-white font-black text-sm drop-shadow-sm">
                            Shop {category.name} →
                          </span>
                        </div>
                      </div>

                      {/* Category info */}
                      <div className="p-4 md:p-5">
                        <h3 className="font-serif font-black text-[#3E2314] text-base md:text-lg group-hover:text-[#D63220] transition-colors leading-tight">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-xs text-[#3E2314]/40 mt-1 line-clamp-1 font-medium">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
        </div>

        {/* View All Categories link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-10 md:mt-14"
        >
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 text-[#D63220] font-black text-sm tracking-widest uppercase hover:gap-3 transition-all duration-300"
          >
            View All Categories
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default FeaturedCategoriesSection;
