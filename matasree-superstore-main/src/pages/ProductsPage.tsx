import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, SlidersHorizontal, Grid3X3, LayoutList,
  Sparkles, Loader2, X,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { useProducts, useCategories } from '@/hooks/useApi';
import heroImage from '@/assets/hero-spices.jpg';
import PageHelmet from '@/components/PageHelmet';

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string | { _id: string; name: string; slug: string };
  stock?: number;
  description?: string;
  image?: string;
  rating?: number;
  createdAt?: string;
  isBestseller?: boolean;
}

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [inStockOnly, setInStockOnly] = useState(false);
  const filterDrawerRef = useRef<HTMLDivElement>(null);

  const { data: productsData, isLoading: productsLoading } = useProducts({ limit: 100 });
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();

  // Handle URL category and search parameters
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && !selectedCategories.includes(categoryParam)) {
      setSelectedCategories([categoryParam]);
    }
    const searchParam = searchParams.get('search') || searchParams.get('q');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  // Close filter drawer on outside click
  useEffect(() => {
    if (!showFilters) return;
    const handler = (e: MouseEvent) => {
      if (filterDrawerRef.current && !filterDrawerRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFilters]);

  // Lock body scroll when mobile filter drawer is open
  useEffect(() => {
    document.body.style.overflow = showFilters ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showFilters]);

  const allProducts = useMemo(() => {
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
    return products as Product[];
  }, [productsData]);

  const allCategories = useMemo(() => {
    if (!categoriesData) return [];
    let cats = [];
    if (Array.isArray(categoriesData.data?.data)) cats = categoriesData.data.data;
    else if (Array.isArray(categoriesData.data)) cats = categoriesData.data;
    else if (Array.isArray(categoriesData)) cats = categoriesData;
    return cats;
  }, [categoriesData]);

  const getCategoryName = (category: string | { _id: string; name: string; slug: string }): string =>
    typeof category === 'string' ? category : category?.name || '';

  const getCategoryProductCount = (categoryName: string): number =>
    allProducts.filter(p => getCategoryName(p.category) === categoryName).length;

  const categoriesWithProducts = useMemo(
    () => allCategories.filter((cat: any) => getCategoryProductCount(cat.name) > 0),
    [allCategories, allProducts],
  );

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const SPICE_SYNONYMS: Record<string, string[]> = {
  garam: ['garam', 'grm', 'gram', 'warm'],
  masala: ['masala', 'masla', 'msala', 'massala', 'blend', 'powder'],
  chilli: ['chilli', 'chili', 'chilly', 'mirch', 'mirchi', 'lal', 'red'],
  turmeric: ['turmeric', 'haldi', 'haldii', 'hildi', 'yellow'],
  kasoori: ['kasoori', 'kasuri', 'methi'],
  methi: ['methi', 'fenugreek', 'kasoori', 'kasuri'],
  super: ['super', 'supr', 'suber', 'sooper'],
  tadka: ['tadka', 'tarka', 'tdka'],
  hing: ['hing', 'heeng', 'asafoetida'],
  coriander: ['coriander', 'dhania', 'dhaniya'],
  cumin: ['cumin', 'jeera', 'zeera', 'zira'],
  cardamom: ['cardamom', 'elaichi', 'elachi'],
  clove: ['clove', 'laung', 'long'],
  cinnamon: ['cinnamon', 'dalchini'],
  paneer: ['paneer', 'panir'],
  kitchen: ['kitchen', 'kitchn', 'kichen'],
  king: ['king', 'kng'],
  sampuran: ['sampuran', 'sampurna', 'sampurn'],
  meat: ['meat', 'mutton'],
  chicken: ['chicken', 'chiken', 'chikn'],
  chaat: ['chaat', 'chat'],
};

function calculateFuzzyScore(targetText: string, searchQuery: string): number {
  if (!targetText || !searchQuery) return 0;
  const targetLower = targetText.toLowerCase();
  const searchLower = searchQuery.toLowerCase().trim();
  if (targetLower === searchLower) return 100;
  if (targetLower.includes(searchLower)) return 90;
  const searchTokens = searchLower.split(/\s+/).filter(Boolean);
  const targetWords = targetLower.split(/[\s,\-/()]+/).filter(Boolean);
  let score = 0;
  for (const token of searchTokens) {
    let tokenMatched = false;
    for (const word of targetWords) {
      if (word === token) {
        score += 40; tokenMatched = true; break;
      }
      if (word.startsWith(token) || token.startsWith(word)) {
        score += 25; tokenMatched = true; break;
      }
      if (word.includes(token)) {
        score += 18; tokenMatched = true; break;
      }
      for (const [key, synonyms] of Object.entries(SPICE_SYNONYMS)) {
        if (
          (token === key || synonyms.includes(token)) &&
          (word === key || synonyms.includes(word))
        ) {
          score += 30; tokenMatched = true; break;
        }
      }
      if (tokenMatched) break;
      if (token.length >= 3) {
        const dist = levenshteinDistance(token, word);
        const maxAllowed = token.length > 5 ? 2 : 1;
        if (dist <= maxAllowed) {
          score += 22; tokenMatched = true; break;
        }
      }
    }
  }
  return score;
}

  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const term = searchQuery.toLowerCase().trim();
      const categoryName = getCategoryName(product.category);

      let matchesSearch = true;
      if (term) {
        const combinedText = [
          product.name,
          product.description,
          categoryName,
          ...((product as any).tags || []),
          (product as any).weight,
          ...((product as any).variants?.map((v: any) => v.weight) || []),
        ].filter(Boolean).join(' ');

        matchesSearch = calculateFuzzyScore(combinedText, term) > 0;
      }

      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(categoryName);
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      const matchesStock = !inStockOnly || (product.stock && product.stock > 0);
      return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    });
  }, [allProducts, searchQuery, selectedCategories, priceRange, inStockOnly]);

  const sortedProducts = useMemo(() => {
    const products = [...filteredProducts];
    switch (sortBy) {
      case 'price-low': return products.sort((a, b) => a.price - b.price);
      case 'price-high': return products.sort((a, b) => b.price - a.price);
      case 'rating': return products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'newest': return products.sort((a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case 'bestseller': return products.filter(p => p.isBestseller).concat(products.filter(p => !p.isBestseller));
      default: return products;
    }
  }, [filteredProducts, sortBy]);

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName) ? prev.filter(c => c !== categoryName) : [...prev, categoryName],
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setPriceRange([0, 10000]);
    setInStockOnly(false);
  };

  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || inStockOnly ||
    priceRange[0] !== 0 || priceRange[1] !== 10000;

  const activeFilterCount =
    (searchQuery ? 1 : 0) + selectedCategories.length +
    (inStockOnly ? 1 : 0) +
    (priceRange[0] !== 0 || priceRange[1] !== 10000 ? 1 : 0);

  // ── Filter panel content (shared between sidebar + drawer) ────────────────
  const FilterContent = () => (
    <div className="space-y-5">
      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif font-bold text-base text-foreground">Categories</h3>
          {selectedCategories.length > 0 && (
            <span className="bg-gradient-spice text-white text-xs px-2 py-0.5 rounded-full font-medium">
              {selectedCategories.length}
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          {categoriesLoading ? (
            <div className="flex justify-center p-3">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : categoriesWithProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No categories available</p>
          ) : (
            categoriesWithProducts.map((cat: any) => {
              const isSelected = selectedCategories.includes(cat.name);
              const productCount = getCategoryProductCount(cat.name);
              return (
                <div
                  key={cat._id}
                  onClick={() => toggleCategory(cat.name)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group border ${
                    isSelected
                      ? 'bg-primary/10 border-primary/20 shadow-sm'
                      : 'bg-secondary/30 hover:bg-secondary/60 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium transition-colors ${
                      isSelected ? 'text-primary' : 'text-foreground/80 group-hover:text-foreground'
                    }`}>
                      {cat.name}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {productCount}
                    </span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${
                    isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30 bg-background'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Price Range */}
      <div className="border-t border-border/60 pt-5">
        <h3 className="font-serif font-bold text-base text-foreground mb-3">Price Range</h3>
        <div className="space-y-4">
          <div className="flex justify-between text-sm font-medium text-muted-foreground">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
          <Slider
            value={[priceRange[0], priceRange[1]]}
            min={0}
            max={10000}
            step={100}
            onValueChange={(value) => setPriceRange([value[0], value[1]])}
            className="py-1"
          />
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { label: '< ₹200',  target: [0, 200] as [number, number] },
              { label: '₹200-500', target: [200, 500] as [number, number] },
              { label: '₹500+',   target: [500, 10000] as [number, number] },
            ]).map((range) => {
              const isSelected = priceRange[0] === range.target[0] && priceRange[1] === range.target[1];
              return (
                <Button
                  key={range.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setPriceRange(range.target)}
                  className={`text-xs h-8 rounded-lg transition-all border ${
                    isSelected
                      ? 'bg-gradient-spice text-white border-transparent shadow-md'
                      : 'hover:border-primary/50 hover:bg-secondary/50 text-muted-foreground'
                  }`}
                >
                  {range.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* In Stock Only */}
      <div className="border-t border-border/60 pt-4">
        <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-secondary/30 rounded-lg transition-colors">
          <Checkbox
            checked={inStockOnly}
            onCheckedChange={(checked) => setInStockOnly(checked as boolean)}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary w-5 h-5 border-2"
          />
          <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">In Stock Only</span>
        </label>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" className="w-full rounded-xl" onClick={clearFilters}>
          <X className="w-4 h-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHelmet
        title="Products | Matasree Super Masale"
        description="Browse our full range of authentic Indian spices and masalas — chilli powder, turmeric, coriander, garam masala, and more from Matasree Super Masale."
        canonicalUrl="https://matasreesuper.com/products"
        ogType="website"
      />
      <Navbar />

      {/* ── Hero Banner — compact on mobile ─────────────────────────────────── */}
      <section className="relative py-10 sm:py-16 md:py-20 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/25" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-white text-xs sm:text-sm font-medium">Premium Spices & Masalas</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-4">
            Discover Our Collections
          </h1>
          <p className="text-white/80 max-w-xl mx-auto text-sm sm:text-base hidden sm:block">
            Explore premium spices and masalas sourced from across India, crafted with authenticity.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">

        {/* ── Top bar: search + sort + filter trigger ──────────────────────── */}
        <div className="flex gap-2 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 sm:h-11 bg-card border-border/50 rounded-xl text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {/* Sort — hidden label on mobile, full on sm+ */}
          <div className="w-[130px] sm:w-[160px]">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-10 sm:h-11 rounded-xl bg-card text-sm px-3">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="bestseller">Bestsellers</SelectItem>
                <SelectItem value="price-low">Price ↑</SelectItem>
                <SelectItem value="price-high">Price ↓</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter button (mobile) + view toggle (desktop) */}
          <div className="flex items-center gap-1.5">
            {/* View toggle — desktop only */}
            <div className="hidden md:flex items-center gap-1 bg-card rounded-xl p-1 border border-border/50">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className="rounded-lg w-8 h-8"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className="rounded-lg w-8 h-8"
                onClick={() => setViewMode('list')}
              >
                <LayoutList className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Mobile filter button */}
            <Button
              variant="outline"
              size="sm"
              className="md:hidden h-10 px-3 rounded-xl relative"
              onClick={() => setShowFilters(true)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-1.5" />
              <span className="text-sm">Filter</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Active filter chips — mobile */}
        {selectedCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 md:hidden">
            {selectedCategories.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20"
              >
                {cat}
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-6">
          {/* ── Sidebar Filters — desktop only ───────────────────────────── */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24 card-ornate bg-card/80 backdrop-blur-sm p-5 shadow-soft rounded-2xl">
              <FilterContent />
            </div>
          </aside>

          {/* ── Product grid ──────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Result count bar */}
            <div className="flex items-center justify-between mb-4 px-3 py-2 bg-card/60 border border-border/40 rounded-xl">
              <p className="text-xs sm:text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{sortedProducts.length}</span>
                {' '}of {allProducts.length} products
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            {productsLoading ? (
              <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
                <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
                <p className="text-sm text-muted-foreground">Loading products...</p>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-muted-foreground/30" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-1">No products found</h3>
                <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters</p>
                <Button onClick={clearFilters} size="sm" variant="default">Clear Filters</Button>
              </div>
            ) : (
              <div className={`grid gap-3 sm:gap-5 ${
                viewMode === 'grid'
                  ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
              }`}>
                {sortedProducts.map((product, index) => (
                  <div
                    key={product._id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 0.04}s` }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Mobile Filter Bottom Sheet ────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          showFilters ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setShowFilters(false)}
      />
      {/* Drawer */}
      <div
        ref={filterDrawerRef}
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card rounded-t-3xl shadow-elevated transition-transform duration-300 ease-out ${
          showFilters ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85vh' }}
      >
        {/* Handle */}
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
          <h2 className="font-serif font-bold text-lg text-foreground">
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 text-sm text-primary font-normal">({activeFilterCount} active)</span>
            )}
          </h2>
          <button
            onClick={() => setShowFilters(false)}
            className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>
        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 pb-6 pt-4" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          <FilterContent />
          {/* Apply button */}
          <Button
            className="w-full mt-4 bg-gradient-spice text-white font-bold rounded-xl h-12"
            onClick={() => setShowFilters(false)}
          >
            Show {sortedProducts.length} Products
          </Button>
        </div>
      </div>

      <Footer />
      <CartDrawer />
    </div>
  );
};

export default ProductsPage;
