import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { ArrowRight, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCategories, useProducts } from '@/hooks/useApi';
import ProductCard from '@/components/ProductCard';
import PageHelmet from '@/components/PageHelmet';
import JsonLd, { buildBreadcrumbSchema } from '@/components/JsonLd';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt?: string;
}

/**
 * Curated fallback images from Unsplash — matched by keywords in category name.
 * If the admin has set a custom image on the category, that takes priority.
 */
const CATEGORY_FALLBACK_IMAGES: Array<{ keywords: string[]; url: string; credit: string }> = [
  {
    keywords: ['garam masala', 'garam', 'masala blend', 'blend', 'blended'],
    url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80',
    credit: 'Unsplash — mixed spices',
  },
  {
    keywords: ['chilli', 'chili', 'red chilli', 'red pepper', 'mirch'],
    url: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=800&q=80',
    credit: 'Unsplash — red chillies',
  },
  {
    keywords: ['turmeric', 'haldi'],
    url: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800&q=80',
    credit: 'Unsplash — turmeric powder',
  },
  {
    keywords: ['cumin', 'jeera'],
    url: 'https://images.unsplash.com/photo-1599909631396-6bb862f96e9b?w=800&q=80',
    credit: 'Unsplash — cumin seeds',
  },
  {
    keywords: ['coriander', 'dhania'],
    url: 'https://images.unsplash.com/photo-1568453565736-5b0c2de5f5dc?w=800&q=80',
    credit: 'Unsplash — coriander',
  },
  {
    keywords: ['whole spice', 'whole', 'seed', 'seeds', 'sabut'],
    url: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=800&q=80',
    credit: 'Unsplash — whole spices',
  },
  {
    keywords: ['herb', 'herbs', 'seasoning', 'seasonings', 'green'],
    url: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=800&q=80',
    credit: 'Unsplash — herbs and seasonings',
  },
  {
    keywords: ['pepper', 'black pepper', 'kali mirch'],
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    credit: 'Unsplash — black pepper',
  },
  {
    keywords: ['cardamom', 'elaichi', 'clove', 'laung', 'cinnamon', 'dalchini'],
    url: 'https://images.unsplash.com/photo-1567645297096-4e7c9b1e5d80?w=800&q=80',
    credit: 'Unsplash — aromatic spices',
  },
  {
    keywords: ['biryani', 'pulao', 'rice'],
    url: 'https://images.unsplash.com/photo-1563379091339-03246963d651?w=800&q=80',
    credit: 'Unsplash — biryani spices',
  },
  {
    keywords: ['curry', 'sabji', 'vegetable'],
    url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
    credit: 'Unsplash — curry spices',
  },
  {
    keywords: ['spice', 'spices', 'ground', 'powder', 'masala'],
    url: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=800&q=80',
    credit: 'Unsplash — ground spices',
  },
];

/** Generic fallback when no keyword matches */
const GENERIC_SPICE_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80',
  'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=800&q=80',
  'https://images.unsplash.com/photo-1599909631396-6bb862f96e9b?w=800&q=80',
  'https://images.unsplash.com/photo-1568453565736-5b0c2de5f5dc?w=800&q=80',
  'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=800&q=80',
];

/**
 * Returns the best-matching image URL for a category.
 * Admin-set image always wins; otherwise falls back to keyword-matched Unsplash photo.
 */
function getCategoryImage(category: Category, index: number): string {
  if (category.image && category.image.trim()) return category.image;

  const nameLower = category.name.toLowerCase();
  for (const entry of CATEGORY_FALLBACK_IMAGES) {
    if (entry.keywords.some((kw) => nameLower.includes(kw))) {
      return entry.url;
    }
  }

  // Round-robin from generic pool
  return GENERIC_SPICE_IMAGES[index % GENERIC_SPICE_IMAGES.length];
}

const CategoriesPage = () => {
  const { data: categoriesData, isLoading: catLoading, error } = useCategories();
  const { data: productsData, isLoading: prodLoading } = useProducts();

  const categories = useMemo(() => {
    console.log('📦 Categories Data:', categoriesData);

    // Handle different API response structures
    let cats = [];

    if (categoriesData?.data?.data && Array.isArray(categoriesData.data.data)) {
      cats = categoriesData.data.data;
    } else if (categoriesData?.data && Array.isArray(categoriesData.data)) {
      cats = categoriesData.data;
    } else if (Array.isArray(categoriesData)) {
      cats = categoriesData;
    }

    console.log('✅ Extracted categories:', cats);
    return Array.isArray(cats) ? (cats as Category[]) : [];
  }, [categoriesData]);

  const allProducts = useMemo(() => {
    console.log('📦 Products Data:', productsData);

    // Robust checking for products data structure
    if (!productsData) return [];

    let products = [];

    if (productsData.data?.data?.products && Array.isArray(productsData.data.data.products)) {
      products = productsData.data.data.products;
    } else if (productsData.data?.products && Array.isArray(productsData.data.products)) {
      products = productsData.data.products;
    } else if ((productsData as any).products && Array.isArray((productsData as any).products)) {
      products = (productsData as any).products;
    } else if (Array.isArray(productsData)) {
      products = productsData;
    } else if (Array.isArray(productsData.data)) {
      products = productsData.data;
    }

    console.log('✅ Extracted products:', products);
    return products;
  }, [productsData]);

  const getCategoryProducts = (categoryName: string) => {
    const products = allProducts.filter((p: any) => {
      const cat = typeof p.category === 'string' ? p.category : p.category?.name;
      return cat === categoryName;
    });
    console.log(`🔍 Products for "${categoryName}":`, products.length);
    return products;
  };

  const isLoading = catLoading || prodLoading;

  return (
    <div className="min-h-screen bg-background">
      <PageHelmet
        title="Categories | Matasree Super Masale"
        description="Explore all spice categories at Matasree Super Masale — from everyday kitchen staples to regional specialties and masala blends."
        canonicalUrl="https://matasreesuper.com/categories"
        ogType="website"
      />
      {/* BreadcrumbList JSON-LD structured data (Req 27.3) */}
      <JsonLd
        schema={buildBreadcrumbSchema([
          { name: 'Home', url: 'https://matasreesuper.com/' },
          { name: 'Categories', url: 'https://matasreesuper.com/categories' },
        ])}
      />
      <Navbar />

      <main className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-6 pb-6 sm:py-12" id="main-content" aria-label="Product categories">
        {/* Header — compact on mobile */}
        <div className="text-center mb-8 sm:mb-16 relative">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          </div>
          {/* Icon — hidden on mobile to save space */}
          <div className="hidden sm:inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4 shadow-lg">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <div className="mb-2 sm:mb-4 mt-2">
            <span className="inline-block text-primary font-semibold text-xs sm:text-sm uppercase tracking-widest px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-primary/10 border border-primary/20">
              Our Collection
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-2 sm:mt-4 mb-3 sm:mb-6">
            Browse by Category
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-lg leading-relaxed hidden sm:block">
            Discover our premium range of authentic Indian spices, carefully organized for your convenience.
            Each category features handpicked masalas crafted with traditional recipes.
          </p>
        </div>

        {/* Categories List */}
        {isLoading ? (
          <div className="text-center py-12 sm:py-20">
            <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-primary mx-auto mb-3 animate-spin" />
            <p className="text-muted-foreground text-sm sm:text-lg">Loading collection...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 sm:py-20 bg-card rounded-3xl border border-border/50">
            <p className="text-red-500 mb-4 text-base">Error loading categories</p>
            <Button onClick={() => window.location.reload()} variant="default" size="sm">
              Try Again
            </Button>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 sm:py-20 bg-card rounded-3xl border border-border/50">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm sm:text-lg">No categories available yet</p>
          </div>
        ) : (
          <div className="space-y-14 sm:space-y-24">
            {categories
              .filter((category: Category) => getCategoryProducts(category.name).length > 0)
              .map((category: Category, index: number) => {
                const categoryProducts = getCategoryProducts(category.name);
                const heroImg = getCategoryImage(category, index);

                return (
                  <section
                    key={category._id}
                    className="scroll-mt-20"
                    id={category.name}
                    aria-labelledby={`cat-heading-${category._id}`}
                  >
                    {/* ── Category Hero Banner ── */}
                    <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden mb-6 sm:mb-10 h-40 sm:h-56 md:h-64 shadow-lg group">
                      {/* Background image */}
                      <img
                        src={heroImg}
                        alt={category.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          // If image fails, fall back to next generic image
                          (e.currentTarget as HTMLImageElement).src =
                            GENERIC_SPICE_IMAGES[(index + 1) % GENERIC_SPICE_IMAGES.length];
                        }}
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

                      {/* Text on the banner */}
                      <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
                        <span className="inline-block text-white/70 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-1 sm:mb-2">
                          {categoryProducts.length} product{categoryProducts.length !== 1 ? 's' : ''}
                        </span>
                        <h2
                          id={`cat-heading-${category._id}`}
                          className="font-serif text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight drop-shadow-sm"
                        >
                          {category.name}
                        </h2>
                        {category.description && (
                          <p className="text-white/75 text-xs sm:text-sm mt-1 sm:mt-2 max-w-lg leading-relaxed line-clamp-2 hidden sm:block">
                            {category.description}
                          </p>
                        )}
                        <Link
                          to={`/products?category=${encodeURIComponent(category.name)}`}
                          className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 self-start bg-white/20 backdrop-blur-sm hover:bg-white/35 text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 rounded-full transition-all duration-200 border border-white/30"
                        >
                          View All
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* ── Products Grid — 2 columns on mobile, 4 on lg ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                      {categoryProducts.slice(0, 4).map((product: any) => (
                        <div
                          key={product._id}
                          className="h-full transition-transform duration-200 hover:scale-[1.01]"
                        >
                          <ProductCard product={product} />
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
          </div>
        )}
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
};

export default CategoriesPage;

