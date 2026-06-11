import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/services/api';

/** Maximum query length enforced client-side (mirrors backend 400 rule from Req 1.6) */
const MAX_QUERY_LENGTH = 200;
/** Minimum characters before triggering a search (Req 1.1) */
const MIN_QUERY_LENGTH = 2;
/** Debounce delay in ms (Req 1.1 — suggestions within 300 ms) */
const DEBOUNCE_MS = 300;
/** Maximum suggestions shown (Req 1.1) */
const MAX_SUGGESTIONS = 10;

interface SearchSuggestion {
  _id: string;
  name: string;
  price: number;
  image?: string;
  weight?: string;
  stock?: number;
  rating?: number;
}

interface SearchBarProps {
  /** Extra CSS classes forwarded to the root wrapper */
  className?: string;
  /** Placeholder text for the input */
  placeholder?: string;
}

/** Constructs a full image URL from a potentially relative path */
function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = 'http://localhost:5001';
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * SearchBar
 *
 * Debounced product search with a keyboard-accessible suggestion dropdown.
 *
 * Requirements satisfied: 1.1, 1.2, 1.3, 1.4, 1.6
 *
 * - Typing ≥ 2 chars → debounced GET /api/products/search?q= (300 ms)
 * - Renders ≤ 10 suggestion rows
 * - Selecting a single-match suggestion navigates to /product/:id
 * - Selecting a multi-match suggestion (or pressing Enter) navigates to /products?q=
 * - Zero results → "No products found" empty state with "Browse categories" link
 * - q is trimmed to 200 chars on the client before sending
 * - aria-label on the input; arrow-key / Enter / Escape keyboard navigation
 * - "Search is temporarily unavailable" error state on API failure (Req 1.7)
 */
const SearchBar = ({ className = '', placeholder = 'Search masalas, spices…' }: SearchBarProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  /** -1 = nothing highlighted; 0…N-1 = index in suggestions; N = "browse categories" row */
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Abort controller so an in-flight request can be cancelled when a new one starts */
  const abortRef = useRef<AbortController | null>(null);

  // ─── Close dropdown when clicking outside ──────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Debounced search ───────────────────────────────────────────────────────
  const fetchSuggestions = useCallback(async (q: string) => {
    // Cancel any running request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setIsLoading(true);
    setIsError(false);

    try {
      const response: any = await apiClient.get(
        `/products/search?q=${encodeURIComponent(q)}&limit=${MAX_SUGGESTIONS}`
      );
      const data: SearchSuggestion[] = response?.data ?? response ?? [];
      setSuggestions(Array.isArray(data) ? data.slice(0, MAX_SUGGESTIONS) : []);
      setIsOpen(true);
    } catch (err: any) {
      // Ignore intentional abort cancellations
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError') {
        return;
      }
      setIsError(true);
      setSuggestions([]);
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Req 1.6 — trim to 200 chars on client side
    const raw = e.target.value.slice(0, MAX_QUERY_LENGTH);
    setQuery(raw);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = raw.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsOpen(false);
      setIsError(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(trimmed);
    }, DEBOUNCE_MS);
  };

  // ─── Navigation helpers ─────────────────────────────────────────────────────
  /** Navigate to the product detail page for a suggestion */
  const goToProduct = useCallback(
    (suggestion: SearchSuggestion) => {
      setIsOpen(false);
      setQuery('');
      setSuggestions([]);
      navigate(`/product/${suggestion._id}`);
    },
    [navigate]
  );

  /** Navigate to filtered results page */
  const goToResults = useCallback(
    (q: string) => {
      setIsOpen(false);
      setQuery('');
      setSuggestions([]);
      navigate(`/products?q=${encodeURIComponent(q.trim())}`);
    },
    [navigate]
  );

  /**
   * Handle suggestion selection (click or Enter).
   *
   * Req 1.3:
   *  - Single match → product detail page
   *  - Multiple matches → /products?q= filtered results
   */
  const handleSelect = useCallback(
    (suggestion: SearchSuggestion) => {
      if (suggestions.length === 1) {
        goToProduct(suggestion);
      } else {
        goToResults(query);
      }
    },
    [suggestions.length, query, goToProduct, goToResults]
  );

  // ─── Keyboard navigation (Req accessibility) ────────────────────────────────
  /**
   * Keyboard handling:
   *  ArrowDown  — move highlight down
   *  ArrowUp    — move highlight up
   *  Enter      — select highlighted item or submit full search
   *  Escape     — close dropdown
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'Enter' && query.trim().length >= MIN_QUERY_LENGTH) {
        goToResults(query);
      }
      return;
    }

    // Total navigable rows: suggestions + optionally the "browse categories" row
    const totalRows = suggestions.length + (suggestions.length === 0 && !isLoading && !isError ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < totalRows - 1 ? prev + 1 : 0));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalRows - 1));
        break;

      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          handleSelect(suggestions[activeIndex]);
        } else if (query.trim().length >= MIN_QUERY_LENGTH) {
          goToResults(query);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setIsError(false);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    inputRef.current?.focus();
  };

  // Unique id for the listbox so the input's aria-controls is valid
  const listboxId = 'searchbar-listbox';

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      // Expose as a combobox widget
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-owns={listboxId}
    >
      {/* ── Input ── */}
      <div className="relative group">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          id="product-search-input"
          type="search"
          role="searchbox"
          aria-label="Search for products"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `searchbar-option-${activeIndex}` : undefined
          }
          placeholder={placeholder}
          value={query}
          maxLength={MAX_QUERY_LENGTH}
          autoComplete="off"
          spellCheck={false}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 || (query.trim().length >= MIN_QUERY_LENGTH && !isLoading)) {
              setIsOpen(true);
            }
          }}
          className="pl-10 pr-8 w-full bg-secondary/50 border-2 border-primary/30 rounded-full
                     focus:border-primary focus:ring-2 focus:ring-primary/20
                     transition-all duration-300 hover:border-primary/50"
        />

        {/* Clear button — shown when there's a query */}
        {query.length > 0 && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4
                       text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Dropdown ── */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute top-full mt-2 left-0 right-0 z-50
                     bg-card border border-border rounded-xl shadow-lg py-2
                     min-w-[280px] max-h-[420px] overflow-y-auto"
        >
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching…</span>
            </div>
          )}

          {/* Error state — Req 1.7 */}
          {!isLoading && isError && (
            <div className="px-4 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                Search is temporarily unavailable
              </p>
            </div>
          )}

          {/* Suggestions */}
          {!isLoading && !isError && suggestions.length > 0 && (
            <>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion._id}
                  id={`searchbar-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  type="button"
                  onClick={() => handleSelect(suggestion)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left
                              transition-colors cursor-pointer
                              ${index === activeIndex
                      ? 'bg-secondary/60'
                      : 'hover:bg-secondary/40'}`}
                >
                  {/* Product thumbnail */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary/30 flex-shrink-0">
                    {suggestion.image ? (
                      <img
                        src={resolveImageUrl(suggestion.image)}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Search className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  {/* Name + price */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate capitalize">
                      {suggestion.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ₹{suggestion.price?.toFixed(2)}
                      {suggestion.weight && (
                        <span className="ml-1 text-muted-foreground/70">
                          · {suggestion.weight}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Out-of-stock badge */}
                  {suggestion.stock === 0 && (
                    <span className="text-[10px] font-semibold text-destructive/80 bg-destructive/10 px-2 py-0.5 rounded-full flex-shrink-0">
                      Out of stock
                    </span>
                  )}
                </button>
              ))}

              {/* "View all results" footer — only when multiple suggestions */}
              {suggestions.length > 1 && (
                <button
                  type="button"
                  onClick={() => goToResults(query)}
                  className="block w-full text-center text-sm text-primary font-semibold
                             py-2 border-t border-border mt-1 hover:bg-secondary/30 transition-colors"
                >
                  View all results for "{query.trim()}" →
                </button>
              )}
            </>
          )}

          {/* Empty state — Req 1.4 */}
          {!isLoading && !isError && suggestions.length === 0 && query.trim().length >= MIN_QUERY_LENGTH && (
            <div
              role="option"
              id={`searchbar-option-0`}
              aria-selected={activeIndex === 0}
              className={`px-4 py-5 text-center ${activeIndex === 0 ? 'bg-secondary/40' : ''}`}
            >
              <p className="text-sm font-medium text-foreground mb-1">
                No products found for "{query.trim()}"
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                We couldn't find a match. Try a different term.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/categories');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold
                           text-primary hover:underline transition-colors"
              >
                <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                Browse all categories
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
