/**
 * RecipesPage
 *
 * Displays Indian recipes with region tabs and product tag filtering.
 * Fetches from GET /api/admin/recipes (public endpoint).
 *
 * Requirements: 9.2, 9.3, 16.3
 */
import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Tag, Search, X, CheckSquare, Square, Check, ShoppingCart } from 'lucide-react';
import { apiClient } from '@/services/api';
import { useProducts } from '@/hooks/useApi';
import { useCartStore } from '@/store/cartStore';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import PageHelmet from '@/components/PageHelmet';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────

type RecipeRegion = 'North Indian' | 'South Indian' | 'Bengali' | 'Rajasthani' | 'Other';

interface Recipe {
  _id: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  productTags: string[];
  region: RecipeRegion;
  image?: string;
}

// ── Constants ────────────────────────────────────────────────

const REGIONS: Array<'All' | RecipeRegion> = [
  'All',
  'North Indian',
  'South Indian',
  'Bengali',
  'Rajasthani',
  'Other',
];

const REGION_COLORS: Record<string, string> = {
  'North Indian': 'bg-orange-100 text-orange-800 border-orange-200',
  'South Indian': 'bg-green-100 text-green-800 border-green-200',
  Bengali: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Rajasthani: 'bg-red-100 text-red-800 border-red-200',
  Other: 'bg-gray-100 text-gray-700 border-gray-200',
};

// ── Recipe Product Row (Variant & Add to Cart Support) ────────

const RecipeProductRow = ({ product, cartItems, addItem }: { product: any; cartItems: any[]; addItem: any }) => {
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

  const setCartOpen = useCartStore((s) => s.setCartOpen);

  const handleAddToCart = () => {
    addItem({
      ...product,
      price: activePrice,
      weight: activeWeight,
      quantity: 1,
    });
    setCartOpen(true);
    toast.success(`${product.name} (${activeWeight}) added to cart!`);
  };

  return (
    <div className="flex gap-3 bg-white p-3 rounded-xl border border-[#3E2314]/8 hover:border-[#D63220]/20 transition shadow-sm items-center">
      <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold text-[#3E2314] truncate">{product.name}</p>
        <p className="text-xs text-[#3E2314]/50 font-semibold">
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
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'border-[#3E2314]/15 text-[#3E2314] hover:bg-primary/5 hover:border-primary/50'
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
            ? 'bg-green-100 text-green-700 font-bold' 
            : 'bg-[#D63220]/10 text-[#D63220] hover:bg-[#D63220] hover:text-white'
        }`}
      >
        {inCart ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
      </button>
    </div>
  );
};

// ── Shop This Recipe ──────────────────────────────────────────

const ShopThisRecipe = ({ tags }: { tags: string[] }) => {
  const { data: productsData } = useProducts();
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const matchedProducts = useMemo(() => {
    const rawProducts = (productsData as any)?.data?.data ?? (productsData as any)?.data?.products ?? (productsData as any)?.products ?? [];
    const normalized = Array.isArray(rawProducts) ? rawProducts : [];
    if (normalized.length === 0) return [];
    
    return normalized.filter((p: any) => {
      // category can be a string OR an object { name: string } — normalise safely
      const categoryStr: string =
        typeof p.category === 'string'
          ? p.category
          : typeof p.category?.name === 'string'
          ? p.category.name
          : '';

      return tags.some(tag =>
        p.name?.toLowerCase().includes(tag.toLowerCase()) ||
        p.description?.toLowerCase().includes(tag.toLowerCase()) ||
        categoryStr.toLowerCase().includes(tag.toLowerCase())
      );
    });
  }, [productsData, tags]);

  if (matchedProducts.length === 0) return null;

  return (
    <div className="mt-8 border-t border-[#3E2314]/8 pt-6">
      <h4 className="font-serif text-lg font-bold text-[#3E2314] mb-4 flex items-center gap-2">
        <ShoppingCart className="w-5 h-5 text-[#D63220]" />
        Shop the Spices for this Recipe
      </h4>
      <div className="grid sm:grid-cols-2 gap-4">
        {matchedProducts.map((product: any) => (
          <RecipeProductRow
            key={product.id ?? product._id}
            product={product}
            cartItems={cartItems}
            addItem={addItem}
          />
        ))}
      </div>
    </div>
  );
};

// ── Recipe Detail Modal ──────────────────────────────────────

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  onClose: () => void;
}

const RecipeDetailModal = ({ recipe, onClose }: RecipeDetailModalProps) => {
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setCheckedIngredients({});
  }, [recipe]);

  if (!recipe) return null;

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative w-full max-w-3xl bg-[#FFF9F4] rounded-[2rem] border border-[#3E2314]/15 shadow-2xl overflow-hidden z-10 max-h-[85vh] flex flex-col"
        >
          {/* Header image / Close button */}
          <div className="relative h-64 md:h-80 w-full overflow-hidden flex-shrink-0">
            {recipe.image ? (
              <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#D63220] to-[#E65C19] flex items-center justify-center">
                <ChefHat className="w-20 h-20 text-white/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition backdrop-blur-sm focus:outline-none"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title Overlay */}
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border border-white/20 bg-black/30 backdrop-blur-sm mb-3 inline-block`}>
                {recipe.region}
              </span>
              <h2 className="font-serif text-2xl md:text-4xl font-bold leading-tight">{recipe.title}</h2>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
            <p className="text-[#3E2314]/80 text-base leading-relaxed font-medium italic">
              "{recipe.description}"
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Ingredients with checkboxes */}
              <div>
                <h3 className="font-serif text-xl font-bold text-[#3E2314] mb-4 flex items-center gap-2 pb-2 border-b border-[#3E2314]/8">
                  Ingredients
                </h3>
                <ul className="space-y-3" role="list">
                  {recipe.ingredients.map((ing, idx) => {
                    const isChecked = !!checkedIngredients[idx];
                    return (
                      <li
                        key={idx}
                        onClick={() => toggleIngredient(idx)}
                        className={`flex items-start gap-3 text-sm font-medium cursor-pointer transition select-none ${
                          isChecked ? 'text-[#3E2314]/40 line-through' : 'text-[#3E2314]/80 hover:text-[#D63220]'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-5 h-5 text-[#3E2314]/30 flex-shrink-0 mt-0.5" />
                        )}
                        <span>{ing}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Steps */}
              <div>
                <h3 className="font-serif text-xl font-bold text-[#3E2314] mb-4 flex items-center gap-2 pb-2 border-b border-[#3E2314]/8">
                  Steps
                </h3>
                <ol className="space-y-4" role="list">
                  {recipe.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-4 text-sm text-[#3E2314]/80">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#D63220] to-[#E65C19] text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed font-medium">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Shop this recipe segment */}
            <ShopThisRecipe tags={recipe.productTags} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ── Recipe Card ───────────────────────────────────────────────

const RecipeCard = ({ recipe, index, onClick }: { recipe: Recipe; index: number; onClick: () => void }) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className="bg-[#FDFBF9] rounded-2xl border border-[#3E2314]/8 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1 transform group"
    >
      {/* Recipe image */}
      {recipe.image && (
        <div className="aspect-[16/9] overflow-hidden relative">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
      )}

      <div className="p-6 flex flex-col flex-1 gap-4">
        {/* Title + region badge */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-xl font-bold text-[#3E2314] leading-snug flex-1 group-hover:text-[#D63220] transition-colors">
            {recipe.title}
          </h3>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${REGION_COLORS[recipe.region] ?? REGION_COLORS['Other']}`}
          >
            {recipe.region}
          </span>
        </div>

        {/* Description */}
        <p className="text-[#3E2314]/70 text-sm leading-relaxed flex-1 line-clamp-3">{recipe.description}</p>

        {/* Quick details summary */}
        <div className="flex items-center justify-between text-xs text-[#3E2314]/50 border-t border-[#3E2314]/5 pt-4 mt-auto">
          <span>{recipe.ingredients.length} Ingredients</span>
          <span>{recipe.steps.length} Steps</span>
        </div>
      </div>
    </motion.article>
  );
};

// ── Skeleton Loader ───────────────────────────────────────────

const RecipeSkeleton = () => (
  <div className="bg-[#FDFBF9] rounded-2xl border border-[#3E2314]/8 overflow-hidden animate-pulse">
    <div className="aspect-[16/9] bg-gray-200" />
    <div className="p-6 flex flex-col gap-4">
      <div className="h-6 bg-gray-200 rounded-full w-3/4" />
      <div className="h-4 bg-gray-100 rounded-full w-full" />
      <div className="h-4 bg-gray-100 rounded-full w-5/6" />
      <div className="h-10 bg-gray-100 rounded-xl" />
      <div className="h-10 bg-gray-100 rounded-xl" />
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-gray-100 rounded-full" />
        <div className="h-6 w-20 bg-gray-100 rounded-full" />
      </div>
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────

const RecipesPage = () => {
  const [selectedRegion, setSelectedRegion] = useState<'All' | RecipeRegion>('All');
  const [tagSearch, setTagSearch] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => apiClient.getRecipes({ limit: 500 }),
    staleTime: 5 * 60 * 1000,
  });

  const allRecipes: Recipe[] = useMemo(() => {
    const raw = (data as any)?.data?.recipes ?? (data as any)?.recipes ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  // Collect all unique tags for the tag filter datalist
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allRecipes.forEach((r) => r.productTags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [allRecipes]);

  // Filter recipes by selected region and tag (expanding to cover search matches in title, description, ingredients, tags)
  const filteredRecipes = useMemo(() => {
    return allRecipes.filter((r) => {
      const regionMatch = selectedRegion === 'All' || r.region === selectedRegion;
      
      const searchLower = tagSearch.toLowerCase().trim();
      const textMatch =
        searchLower === '' ||
        r.title.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower) ||
        r.ingredients.some(ing => ing.toLowerCase().includes(searchLower)) ||
        r.productTags.some(t => t.toLowerCase().includes(searchLower));

      return regionMatch && textMatch;
    });
  }, [allRecipes, selectedRegion, tagSearch]);

  // Group by region when "All" is selected
  const grouped = useMemo(() => {
    if (selectedRegion !== 'All') {
      return { [selectedRegion]: filteredRecipes } as Record<string, Recipe[]>;
    }
    return filteredRecipes.reduce<Record<string, Recipe[]>>((acc, r) => {
      if (!acc[r.region]) acc[r.region] = [];
      acc[r.region].push(r);
      return acc;
    }, {});
  }, [filteredRecipes, selectedRegion]);

  const regionOrder: Array<RecipeRegion> = [
    'North Indian',
    'South Indian',
    'Bengali',
    'Rajasthani',
    'Other',
  ];

  const orderedGroups = selectedRegion === 'All'
    ? regionOrder.filter((r) => grouped[r]?.length)
    : ([selectedRegion] as RecipeRegion[]);

  return (
    <div className="bg-brand-cream min-h-screen text-brand-cinnamon font-sans">
      <PageHelmet
        title="Recipes | Matasree Super Masale"
        description="Discover authentic Indian recipes made with Matasree Super Masale spices — from North Indian curries to South Indian specialties and Bengali delicacies."
        canonicalUrl="https://matasreesuper.com/recipes"
        ogType="website"
      />
      <Navbar />

      <main role="main" className="pt-24 pb-24">
        {/* ── Page Header ── */}
        <section className="container mx-auto px-4 max-w-6xl mb-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-[#D63220]/10 text-[#D63220] px-4 py-1.5 rounded-full text-sm font-bold mb-6">
              <ChefHat className="w-4 h-4" />
              Heritage Recipes
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-black text-[#3E2314] mb-4 tracking-tight leading-tight">
              Discover{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#8B4513] italic">
                Indian Recipes
              </span>
            </h1>
            <p className="text-lg text-[#3E2314]/60 max-w-2xl mx-auto">
              Traditional recipes from across India, crafted with Matasree's authentic spices.
            </p>
          </motion.div>
        </section>

        {/* ── Filters ── */}
        <section
          className="container mx-auto px-4 max-w-6xl mb-10"
          aria-label="Recipe filters"
        >
          {/* Region tabs */}
          <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Filter by region">
            {REGIONS.map((region) => (
              <button
                key={region}
                role="tab"
                aria-selected={selectedRegion === region}
                onClick={() => setSelectedRegion(region)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                  selectedRegion === region
                    ? 'bg-gradient-to-r from-[#D63220] to-[#E65C19] text-white border-transparent shadow-md'
                    : 'bg-white text-[#3E2314] border-[#3E2314]/15 hover:border-[#D63220]/30 hover:bg-[#D63220]/5'
                }`}
              >
                {region}
              </button>
            ))}
          </div>

          {/* Tag search */}
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3E2314]/40" />
            <input
              type="text"
              placeholder="Search recipes, spices, ingredients..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              aria-label="Filter recipes by tag or name"
              list="recipe-tags"
              className="w-full pl-9 pr-4 py-2.5 rounded-full border border-[#3E2314]/15 bg-white text-sm text-[#3E2314] placeholder:text-[#3E2314]/40 focus:outline-none focus:border-[#D63220]/40 focus:ring-2 focus:ring-[#D63220]/10 transition"
            />
            <datalist id="recipe-tags">
              {allTags.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
        </section>

        {/* ── Recipe Content ── */}
        <div className="container mx-auto px-4 max-w-6xl">
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <RecipeSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div
              role="alert"
              className="text-center py-24 text-[#3E2314]/60"
            >
              <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Failed to load recipes. Please try again.</p>
            </div>
          ) : filteredRecipes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 text-[#3E2314]/60"
              role="status"
              aria-live="polite"
            >
              <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No recipes found.</p>
              {allRecipes.length === 0 ? (
                <p className="text-sm mt-1 text-[#3E2314]/40">
                  No recipes have been added yet. Admins can add recipes from the{' '}
                  <a href="/admin/dashboard" className="underline hover:text-[#3E2314]/70 transition-colors">
                    admin panel
                  </a>.
                </p>
              ) : (
                <p className="text-sm mt-1 text-[#3E2314]/40">
                  Try a different search term or clear the filter.
                </p>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col gap-12">
              {orderedGroups.map((region) => (
                <section key={region} aria-labelledby={`region-${region}`}>
                  {selectedRegion === 'All' && (
                    <h2
                      id={`region-${region}`}
                      className="font-serif text-2xl font-bold text-[#3E2314] mb-6 flex items-center gap-3"
                    >
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${REGION_COLORS[region] ?? REGION_COLORS['Other']}`}
                      >
                        {region}
                      </span>
                      <span>{region} Recipes</span>
                    </h2>
                  )}

                  <AnimatePresence mode="wait">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(grouped[region] ?? []).map((recipe, idx) => (
                        <RecipeCard
                          key={recipe._id}
                          recipe={recipe}
                          index={idx}
                          onClick={() => setSelectedRecipe(recipe)}
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      <RecipeDetailModal
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
      />

      <Footer />
      <CartDrawer />
    </div>
  );
};

export default RecipesPage;
