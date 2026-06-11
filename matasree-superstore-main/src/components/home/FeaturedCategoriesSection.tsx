/**
 * FeaturedCategoriesSection
 *
 * Displays a grid of product categories fetched from the API.
 * Shows 4 skeleton cards while loading, then renders category cards
 * with an image (or gradient placeholder), category name, and a link
 * to /products?category={categoryId}.
 *
 * Requirements: 17.1, 17.3, 17.4
 */
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';

// Gradient placeholders — cycle through brand palette when no image
const PLACEHOLDERS = [
  'from-[#D63220] to-[#E65C19]',
  'from-[#8B4513] to-[#5A2D0E]',
  'from-[#E65C19] to-[#D63220]',
  'from-[#3E2314] to-[#8B4513]',
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
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const BACKEND_URL = 'http://localhost:5001';
  return path.startsWith('/') ? `${BACKEND_URL}${path}` : `${BACKEND_URL}/${path}`;
};

const sectionVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const cardVariant = (index: number) => ({
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
});

const FeaturedCategoriesSection = () => {
  const { data: categoriesData, isLoading } = useCategories();

  // Normalise to array regardless of API response shape
  const rawCategories: Category[] =
    (categoriesData as { data?: Category[] | { categories?: Category[] } })?.data
      ? Array.isArray((categoriesData as { data: Category[] }).data)
        ? (categoriesData as { data: Category[] }).data
        : ((categoriesData as { data: { categories?: Category[] } }).data?.categories ?? [])
      : [];

  const categories = rawCategories.slice(0, 8); // Show at most 8 on homepage

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
                const gradient = PLACEHOLDERS[index % PLACEHOLDERS.length];

                return (
                  <motion.div
                    key={category._id}
                    variants={cardVariant(index)}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                  >
                    <Link
                      to={`/products?category=${category._id}`}
                      className="group block rounded-2xl overflow-hidden bg-white border border-[#3E2314]/5 hover:border-[#D63220]/20 shadow-sm hover:shadow-[0_20px_50px_rgba(62,35,20,0.1)] transition-all duration-500"
                      aria-label={`Browse ${category.name}`}
                    >
                      {/* Image / Placeholder */}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                            loading="lazy"
                            onError={(e) => {
                              // Fallback to gradient when image fails
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                              (e.currentTarget.nextSibling as HTMLElement | null)?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        {/* Gradient fallback — visible when no image or image errors */}
                        <div
                          className={`${imgUrl ? 'hidden' : ''} absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}
                        >
                          <span className="text-white font-serif font-black text-3xl md:text-4xl opacity-30 select-none">
                            {category.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {/* Hover tint */}
                        <div className="absolute inset-0 bg-[#3E2314]/0 group-hover:bg-[#3E2314]/10 transition-colors duration-500" />
                      </div>

                      {/* Category name */}
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
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default FeaturedCategoriesSection;
