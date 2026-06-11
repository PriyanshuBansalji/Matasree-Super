/**
 * FilterPanel
 *
 * A sidebar/panel component that lets customers filter products by:
 *  - Price range (0 – 99,999 INR)
 *  - Category     (multi-select, from API)
 *  - Weight       (multi-select: 100g, 250g, 500g, 1kg, 2kg)
 *  - Minimum rating (1–5 stars)
 *  - In-Stock only toggle
 *
 * Behaviour:
 *  - Any filter change updates URL query params and refetches products
 *    within 500 ms (Req 2.2 / 2.5).
 *  - "Clear all" restores defaults and re-sorts by createdAt desc (Req 2.3).
 *  - Shows skeleton loaders while a request is in-flight (Req 2.6).
 *  - Shows empty state + "Clear filters" CTA when no products match (Req 2.4).
 *  - Active filters are reflected in the URL (Req 2.5).
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SlidersHorizontal,
  X,
  Star,
  ChevronDown,
  ChevronUp,
  PackageSearch,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/ProductCard';
import { apiClient } from '@/services/api';

// ─── Constants ─────────────────────────────────────────────────────────────────

const WEIGHT_OPTIONS = ['100g', '250g', '500g', '1kg', '2kg'] as const;
type WeightOption = (typeof WEIGHT_OPTIONS)[number];

const MIN_PRICE = 0;
const MAX_PRICE = 99999;
const DEFAULT_PRICE_RANGE: [number, number] = [MIN_PRICE, MAX_PRICE];

/** Delay (ms) before dispatching fetch after a filter change — Req 2.2 */
const DEBOUNCE_MS = 300;

// ─── Types ──────────────────────────────────────────────────────────────────────

interface FilterValues {
  minPrice: number;
  maxPrice: number;
  categories: string[];   // category names (multi-select)
  weights: WeightOption[];
  minRating: number;      // 0 = no rating filter
  inStock: boolean;
}

interface BackendCategory {
  _id: string;
  name: string;
  slug: string;
}

interface BackendProduct {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  category: string | BackendCategory;
  stock?: number;
  rating?: number;
  weight?: string;
  description?: string;
  createdAt?: string;
  isBestseller?: boolean;
  isNew?: boolean;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface FilterPanelProps {
  /**
   * If provided, the FilterPanel manages only the filter UI and result list.
   * The parent receives the current list of products via this callback.
   */
  onProductsChange?: (products: BackendProduct[], total: number, isLoading: boolean) => void;
  /**
   * Whether the mobile filter drawer is open (controlled from parent).
   * When undefined the panel is always visible (desktop sidebar mode).
   */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  /**
   * Additional class names applied to the root wrapper.
   */
  className?: string;
  /**
   * When true, the FilterPanel renders the product grid itself
   * (standalone mode — used on ProductsPage).
   * When false/undefined, it only renders the filter controls.
   */
  standalone?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function defaultFilters(): FilterValues {
  return {
    minPrice: MIN_PRICE,
    maxPrice: MAX_PRICE,
    categories: [],
    weights: [],
    minRating: 0,
    inStock: false,
  };
}

/** Count total active filter dimensions */
function countActiveFilters(f: FilterValues): number {
  let count = 0;
  if (f.minPrice !== MIN_PRICE || f.maxPrice !== MAX_PRICE) count++;
  if (f.categories.length > 0) count++;
  if (f.weights.length > 0) count++;
  if (f.minRating > 0) count++;
  if (f.inStock) count++;
  return count;
}

/** Build query params object from FilterValues for API call */
function buildApiParams(f: FilterValues, page = 1): Record<string, string> {
  const params: Record<string, string> = {
    page: String(page),
    limit: '10',
    sort: 'createdAt',   // default sort; backend interprets absence as createdAt desc
  };
  if (f.minPrice !== MIN_PRICE) params.minPrice = String(f.minPrice);
  if (f.maxPrice !== MAX_PRICE) params.maxPrice = String(f.maxPrice);
  if (f.categories.length > 0) params.category = f.categories[0]; // backend single category
  if (f.weights.length > 0) params.weight = f.weights.join(',');
  if (f.minRating > 0) params.minRating = String(f.minRating);
  if (f.inStock) params.inStock = 'true';
  return params;
}

/** Read FilterValues from URLSearchParams */
function filtersFromSearchParams(sp: URLSearchParams): FilterValues {
  const f = defaultFilters();
  const minPrice = sp.get('minPrice');
  const maxPrice = sp.get('maxPrice');
  if (minPrice !== null) f.minPrice = parseFloat(minPrice) || MIN_PRICE;
  if (maxPrice !== null) f.maxPrice = parseFloat(maxPrice) || MAX_PRICE;
  const categoryParam = sp.get('category');
  if (categoryParam) f.categories = [categoryParam];
  const weightParam = sp.get('weight');
  if (weightParam) {
    f.weights = weightParam
      .split(',')
      .filter((w): w is WeightOption => WEIGHT_OPTIONS.includes(w as WeightOption));
  }
  const minRating = sp.get('minRating');
  if (minRating !== null) f.minRating = parseInt(minRating, 10) || 0;
  const inStock = sp.get('inStock');
  if (inStock === 'true') f.inStock = true;
  return f;
}

/** Write FilterValues into URLSearchParams, returning new URLSearchParams */
function filtersToSearchParams(f: FilterValues): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.minPrice !== MIN_PRICE) sp.set('minPrice', String(f.minPrice));
  if (f.maxPrice !== MAX_PRICE) sp.set('maxPrice', String(f.maxPrice));
  if (f.categories.length > 0) sp.set('category', f.categories[0]);
  if (f.weights.length > 0) sp.set('weight', f.weights.join(','));
  if (f.minRating > 0) sp.set('minRating', String(f.minRating));
  if (f.inStock) sp.set('inStock', 'true');
  return sp;
}

// ─── Product Card Skeleton ──────────────────────────────────────────────────────

function ProductCardSkeleton() {
  return (
    <div
      className="card-ornate bg-card overflow-hidden flex flex-col h-full"
      aria-hidden="true"
    >
      {/* Image area */}
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      {/* Content area */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <Skeleton className="h-3 w-1/3 rounded-full" />
        <Skeleton className="h-5 w-3/4 rounded-full" />
        <Skeleton className="h-5 w-1/2 rounded-full" />
        <div className="flex gap-1 mt-auto">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-4 rounded-full" />
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-dashed border-border/60 pt-4">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Filter Section Wrapper ─────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  badge?: number;
  children: React.ReactNode;
}

function FilterSection({ title, defaultOpen = true, badge, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-dotted-traditional pt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full mb-3 group"
        aria-expanded={open}
      >
        <span className="font-serif font-bold text-lg text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
          {title}
          {badge != null && badge > 0 && (
            <span className="bg-gradient-spice text-white text-xs px-2 py-0.5 rounded-full shadow-sm font-medium">
              {badge}
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

/**
 * FilterPanel — standalone mode renders filter sidebar + product grid.
 * The component syncs all filter state to/from URL query params (Req 2.5).
 */
const FilterPanel = ({
  onProductsChange,
  mobileOpen,
  onMobileClose,
  className = '',
  standalone = false,
}: FilterPanelProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive initial filters from URL
  const [filters, setFilters] = useState<FilterValues>(() =>
    filtersFromSearchParams(searchParams)
  );

  // Slider local state (only committed on mouse-up to avoid excessive calls)
  const [sliderValue, setSliderValue] = useState<[number, number]>([
    filters.minPrice,
    filters.maxPrice,
  ]);

  // Products state (standalone mode only)
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [page, setPage] = useState(1);

  // Categories from API
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Fetch categories once ─────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiClient.getCategories();
        // Unwrap – handle various response shapes
        let cats: BackendCategory[] = [];
        if (Array.isArray(res?.data?.data)) cats = res.data.data;
        else if (Array.isArray(res?.data)) cats = res.data;
        else if (Array.isArray(res)) cats = res;
        setCategories(cats);
      } catch {
        // Silently ignore category fetch errors
      } finally {
        setCategoriesLoading(false);
      }
    })();
  }, []);

  // ── Core product fetch ────────────────────────────────────────────────────
  const fetchProducts = useCallback(
    async (f: FilterValues, pageNum: number) => {
      // Cancel previous in-flight request
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      setFetchError(false);

      try {
        const params = buildApiParams(f, pageNum);
        const res: any = await apiClient.getProducts(params);

        // Unwrap various shapes
        let prods: BackendProduct[] = [];
        let paginationData: PaginationInfo | null = null;

        if (res?.data?.data?.products) {
          prods = res.data.data.products;
          paginationData = res.data.data.pagination ?? null;
        } else if (res?.data?.products) {
          prods = res.data.products;
          paginationData = res.data.pagination ?? null;
        } else if ((res as any)?.products) {
          prods = (res as any).products;
          paginationData = (res as any).pagination ?? null;
        } else if (Array.isArray(res?.data)) {
          prods = res.data;
        } else if (Array.isArray(res)) {
          prods = res;
        }

        setProducts(prods);
        setPagination(paginationData);
        onProductsChange?.(prods, paginationData?.total ?? prods.length, false);
      } catch (err: any) {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
        setFetchError(true);
        setProducts([]);
        onProductsChange?.([], 0, false);
      } finally {
        setIsLoading(false);
      }
    },
    [onProductsChange]
  );

  // ── Sync URL → filters on browser back/forward ────────────────────────────
  useEffect(() => {
    const parsed = filtersFromSearchParams(searchParams);
    setFilters(parsed);
    setSliderValue([parsed.minPrice, parsed.maxPrice]);
    setPage(1);
  }, [searchParams]);

  // ── Debounced refetch on filter or page change ────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProducts(filters, page);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  // ── Apply new filters (updates URL + state) ────────────────────────────────
  const applyFilters = useCallback(
    (next: FilterValues) => {
      setFilters(next);
      setPage(1);
      setSearchParams(filtersToSearchParams(next), { replace: true });
    },
    [setSearchParams]
  );

  // ── Individual filter handlers ─────────────────────────────────────────────

  const toggleCategory = useCallback(
    (catName: string) => {
      const next = { ...filters };
      next.categories = next.categories.includes(catName)
        ? next.categories.filter((c) => c !== catName)
        : [...next.categories, catName];
      applyFilters(next);
    },
    [filters, applyFilters]
  );

  const toggleWeight = useCallback(
    (w: WeightOption) => {
      const next = { ...filters };
      next.weights = next.weights.includes(w)
        ? next.weights.filter((x) => x !== w)
        : [...next.weights, w];
      applyFilters(next);
    },
    [filters, applyFilters]
  );

  const handleRatingClick = useCallback(
    (star: number) => {
      // Clicking the same star again removes the filter
      const next = { ...filters, minRating: filters.minRating === star ? 0 : star };
      applyFilters(next);
    },
    [filters, applyFilters]
  );

  const handleInStockChange = useCallback(
    (checked: boolean) => {
      applyFilters({ ...filters, inStock: checked });
    },
    [filters, applyFilters]
  );

  /** Slider tracks local state; commits on pointer-up for perf */
  const handleSliderChange = useCallback((value: number[]) => {
    setSliderValue([value[0], value[1]]);
  }, []);

  const handleSliderCommit = useCallback(
    (value: number[]) => {
      applyFilters({ ...filters, minPrice: value[0], maxPrice: value[1] });
    },
    [filters, applyFilters]
  );

  const clearAll = useCallback(() => {
    const def = defaultFilters();
    setSliderValue(DEFAULT_PRICE_RANGE);
    applyFilters(def);
  }, [applyFilters]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);
  const hasFilters = activeCount > 0;
  const noProducts = !isLoading && !fetchError && products.length === 0;

  // ─── Filter Controls UI ─────────────────────────────────────────────────────

  const filterControls = (
    <div
      className={`sticky top-24 space-y-0 card-ornate bg-card/80 backdrop-blur-sm p-6 shadow-soft ${className}`}
      aria-label="Product filters"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary" aria-hidden="true" />
          <h2 className="font-serif font-bold text-xl text-foreground">Filters</h2>
          {hasFilters && (
            <Badge className="bg-gradient-spice text-white text-xs shadow-sm">{activeCount}</Badge>
          )}
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 transition-colors"
            aria-label="Clear all filters"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
        {/* Mobile close button */}
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="md:hidden ml-2 p-1 rounded-lg hover:bg-secondary/60 transition-colors"
            aria-label="Close filters"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* ── Category ─── */}
      <FilterSection title="Category" badge={filters.categories.length}>
        {categoriesLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No categories available</p>
        ) : (
          <div className="space-y-1.5" role="group" aria-label="Filter by category">
            {categories.map((cat) => {
              const selected = filters.categories.includes(cat.name);
              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => toggleCategory(cat.name)}
                  aria-pressed={selected}
                  className={`flex items-center justify-between w-full p-2.5 rounded-xl cursor-pointer transition-all duration-200 border text-left ${
                    selected
                      ? 'bg-primary/10 border-primary/30 shadow-sm'
                      : 'bg-secondary/30 hover:bg-secondary/60 border-transparent'
                  }`}
                >
                  <span
                    className={`text-sm font-medium transition-colors ${
                      selected ? 'text-primary' : 'text-foreground/80'
                    }`}
                  >
                    {cat.name}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      selected ? 'border-primary bg-primary' : 'border-muted-foreground/30 bg-background'
                    }`}
                  >
                    {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </FilterSection>

      {/* ── Price Range ─── */}
      <FilterSection
        title="Price Range"
        badge={
          filters.minPrice !== MIN_PRICE || filters.maxPrice !== MAX_PRICE ? 1 : 0
        }
      >
        <div className="space-y-4">
          <div className="flex justify-between text-sm font-medium text-muted-foreground">
            <span>₹{sliderValue[0].toLocaleString()}</span>
            <span>₹{sliderValue[1].toLocaleString()}</span>
          </div>
          <Slider
            min={MIN_PRICE}
            max={MAX_PRICE}
            step={100}
            value={[sliderValue[0], sliderValue[1]]}
            onValueChange={handleSliderChange}
            onValueCommit={handleSliderCommit}
            aria-label="Price range"
            className="py-2"
          />
          {/* Quick-select price chips */}
          <div className="grid grid-cols-3 gap-2">
            {([
              { label: '< ₹200', range: [0, 200] as [number, number] },
              { label: '₹200–500', range: [200, 500] as [number, number] },
              { label: '₹500+', range: [500, MAX_PRICE] as [number, number] },
            ] as const).map(({ label, range }) => {
              const active = sliderValue[0] === range[0] && sliderValue[1] === range[1];
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setSliderValue(range);
                    applyFilters({ ...filters, minPrice: range[0], maxPrice: range[1] });
                  }}
                  className={`text-xs h-9 rounded-lg border transition-all font-medium ${
                    active
                      ? 'bg-gradient-spice text-white border-transparent shadow-md'
                      : 'hover:border-primary/50 hover:bg-secondary/50 text-muted-foreground border-border'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </FilterSection>

      {/* ── Weight ─── */}
      <FilterSection title="Weight" badge={filters.weights.length}>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by weight">
          {WEIGHT_OPTIONS.map((w) => {
            const selected = filters.weights.includes(w);
            return (
              <button
                key={w}
                type="button"
                onClick={() => toggleWeight(w)}
                aria-pressed={selected}
                className={`px-3 py-1.5 text-sm rounded-full border font-medium transition-all duration-200 ${
                  selected
                    ? 'bg-gradient-spice text-white border-transparent shadow-md'
                    : 'bg-secondary/30 border-border text-foreground/80 hover:border-primary/40 hover:bg-secondary/60'
                }`}
              >
                {w}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* ── Minimum Rating ─── */}
      <FilterSection title="Minimum Rating" badge={filters.minRating > 0 ? 1 : 0}>
        <div className="space-y-2" role="radiogroup" aria-label="Minimum star rating">
          {[5, 4, 3, 2, 1].map((star) => {
            const selected = filters.minRating === star;
            return (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => handleRatingClick(star)}
                className={`flex items-center gap-2 w-full p-2 rounded-xl border transition-all duration-200 ${
                  selected
                    ? 'bg-primary/10 border-primary/30 shadow-sm'
                    : 'bg-secondary/20 border-transparent hover:bg-secondary/50'
                }`}
              >
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < star ? 'fill-saffron text-saffron' : 'fill-gray-100 text-gray-200'
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <span
                  className={`text-sm font-medium ${
                    selected ? 'text-primary' : 'text-foreground/70'
                  }`}
                >
                  {star === 5 ? '5 stars only' : `${star}+ stars`}
                </span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* ── In Stock ─── */}
      <div className="border-t border-dotted-traditional pt-5">
        <label className="flex items-center justify-between cursor-pointer group p-2.5 hover:bg-secondary/30 rounded-xl transition-colors">
          <span className="font-medium text-sm text-foreground/80 group-hover:text-foreground select-none">
            In Stock Only
          </span>
          <Switch
            checked={filters.inStock}
            onCheckedChange={handleInStockChange}
            aria-label="Show in-stock products only"
            className="data-[state=checked]:bg-primary"
          />
        </label>
      </div>

      {/* ── Clear All (bottom) ─── */}
      {hasFilters && (
        <div className="pt-4 border-t border-dotted-traditional">
          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={clearAll}
          >
            <X className="w-4 h-4 mr-2" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );

  // If not standalone, just render filter controls
  if (!standalone) return filterControls;

  // ─── Standalone mode: filter sidebar + product grid ──────────────────────────

  return (
    <div className="flex gap-8">
      {/* Sidebar */}
      <aside
        className={`
          ${mobileOpen !== undefined
            ? mobileOpen ? 'block' : 'hidden'
            : 'hidden md:block'
          }
          w-full md:w-72 flex-shrink-0
        `}
      >
        {filterControls}
      </aside>

      {/* Product Grid */}
      <section className="flex-1 w-full" aria-live="polite" aria-label="Filtered products">
        {/* Results summary bar */}
        <div className="flex items-center justify-between mb-6 bg-gradient-warm border border-border/40 px-5 py-3 rounded-xl shadow-sm">
          <p className="text-muted-foreground text-sm">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" aria-hidden="true" />
                Fetching products…
              </span>
            ) : (
              <>
                Showing{' '}
                <span className="font-semibold text-foreground">{products.length}</span>
                {pagination?.total != null && (
                  <> of <span className="font-semibold text-foreground">{pagination.total}</span></>
                )}{' '}
                products
              </>
            )}
          </p>
          {hasFilters && !isLoading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-8 text-xs"
              aria-label="Clear all filters"
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Loading skeletons — Req 2.6 */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
            {[...Array(9)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Fetch error */}
        {!isLoading && fetchError && (
          <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <PackageSearch className="w-8 h-8 text-destructive/60" aria-hidden="true" />
            </div>
            <h3 className="font-serif text-lg font-semibold mb-2">Could not load products</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Something went wrong. Please try again.
            </p>
            <Button onClick={() => fetchProducts(filters, page)} variant="default" size="sm">
              Retry
            </Button>
          </div>
        )}

        {/* Empty state — Req 2.4 */}
        {noProducts && (
          <div
            className="text-center py-16 bg-card rounded-2xl border border-border/50"
            role="status"
            aria-label="No products match the selected filters"
          >
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
              <PackageSearch
                className="w-10 h-10 text-muted-foreground/40"
                aria-hidden="true"
              />
            </div>
            <h3 className="font-serif text-xl font-semibold mb-2 text-foreground">
              No products match your filters
            </h3>
            <p className="text-muted-foreground mb-6 max-w-xs mx-auto text-sm">
              Try adjusting or removing some filters to see more results.
            </p>
            {/* Req 2.4 — "Clear filters" CTA */}
            <Button onClick={clearAll} variant="default">
              <X className="w-4 h-4 mr-2" />
              Clear filters
            </Button>
          </div>
        )}

        {/* Product grid */}
        {!isLoading && !fetchError && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <div
                key={product._id}
                className="animate-slide-up"
                style={{ animationDelay: `${Math.min(index * 0.04, 0.4)}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && pagination && pagination.pages > 1 && (
          <nav
            className="flex items-center justify-center gap-2 mt-10"
            aria-label="Product pagination"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-xl"
              aria-label="Previous page"
            >
              ← Prev
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page <span className="font-semibold text-foreground">{page}</span> of{' '}
              <span className="font-semibold text-foreground">{pagination.pages}</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="rounded-xl"
              aria-label="Next page"
            >
              Next →
            </Button>
          </nav>
        )}
      </section>
    </div>
  );
};

export default FilterPanel;
