/**
 * RecipesPage
 *
 * Displays Indian recipes with region tabs and product tag filtering.
 * Fetches from GET /api/admin/recipes (public endpoint).
 *
 * Requirements: 9.2, 9.3, 16.3
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, ChevronDown, ChevronUp, Tag, Search } from 'lucide-react';
import { apiClient } from '@/services/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHelmet from '@/components/PageHelmet';

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

// ── Recipe Card ───────────────────────────────────────────────

const RecipeCard = ({ recipe, index }: { recipe: Recipe; index: number }) => {
  const [expandIngredients, setExpandIngredients] = useState(false);
  const [expandSteps, setExpandSteps] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#FDFBF9] rounded-2xl border border-[#3E2314]/8 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col"
    >
      {/* Recipe image */}
      {recipe.image && (
        <div className="aspect-[16/9] overflow-hidden">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-6 flex flex-col flex-1 gap-4">
        {/* Title + region badge */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-xl font-bold text-[#3E2314] leading-snug flex-1">
            {recipe.title}
          </h3>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${REGION_COLORS[recipe.region] ?? REGION_COLORS['Other']}`}
          >
            {recipe.region}
          </span>
        </div>

        {/* Description */}
        <p className="text-[#3E2314]/70 text-sm leading-relaxed">{recipe.description}</p>

        {/* Ingredients (collapsible) */}
        <div className="border border-[#3E2314]/8 rounded-xl overflow-hidden">
          <button
            type="button"
            aria-expanded={expandIngredients}
            onClick={() => setExpandIngredients((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-[#3E2314] hover:bg-[#3E2314]/4 transition-colors"
          >
            <span>Ingredients ({recipe.ingredients.length})</span>
            {expandIngredients ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <AnimatePresence initial={false}>
            {expandIngredients && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
                role="list"
                aria-label="Ingredients list"
              >
                <div className="px-4 pb-4 pt-1">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2 py-1 text-sm text-[#3E2314]/80">
                      <span className="text-[#D63220] mt-0.5 flex-shrink-0">•</span>
                      {ing}
                    </li>
                  ))}
                </div>
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Steps (collapsible) */}
        <div className="border border-[#3E2314]/8 rounded-xl overflow-hidden">
          <button
            type="button"
            aria-expanded={expandSteps}
            onClick={() => setExpandSteps((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-[#3E2314] hover:bg-[#3E2314]/4 transition-colors"
          >
            <span>Steps ({recipe.steps.length})</span>
            {expandSteps ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <AnimatePresence initial={false}>
            {expandSteps && (
              <motion.ol
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
                role="list"
                aria-label="Cooking steps"
              >
                <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
                  {recipe.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#3E2314]/80">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#D63220] to-[#E65C19] text-white text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </div>
              </motion.ol>
            )}
          </AnimatePresence>
        </div>

        {/* Product tag chips */}
        {recipe.productTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1" aria-label="Related product tags">
            {recipe.productTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-xs bg-[#E65C19]/10 text-[#E65C19] border border-[#E65C19]/20 px-2.5 py-1 rounded-full font-medium"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
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

  const { data, isLoading, isError } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => apiClient.getRecipes(),
    staleTime: 5 * 60 * 1000,
  });

  const allRecipes: Recipe[] = useMemo(() => {
    const raw = (data as any)?.data?.recipes ?? (data as any)?.recipes ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  // Collect all unique tags for the tag filter
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allRecipes.forEach((r) => r.productTags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [allRecipes]);

  // Filter recipes by selected region and tag
  const filteredRecipes = useMemo(() => {
    return allRecipes.filter((r) => {
      const regionMatch = selectedRegion === 'All' || r.region === selectedRegion;
      const tagMatch =
        tagSearch.trim() === '' ||
        r.productTags.some((t) =>
          t.toLowerCase().includes(tagSearch.toLowerCase())
        );
      return regionMatch && tagMatch;
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
              placeholder="Search by spice or product..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              aria-label="Filter recipes by product tag"
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
              <p className="text-lg font-medium">No recipes found for the selected filters.</p>
              <p className="text-sm mt-1 text-[#3E2314]/40">
                Try selecting a different region or clearing the tag filter.
              </p>
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
                        <RecipeCard key={recipe._id} recipe={recipe} index={idx} />
                      ))}
                    </div>
                  </AnimatePresence>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RecipesPage;
