import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecentlyViewedItem {
  productId: string;
  timestamp: number;
}

interface ProductData {
  _id: string;
  name: string;
  price: number;
  image?: string;
}

interface RecentlyViewedSectionProps {
  currentProductId?: string | undefined;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'matasree-recently-viewed';
const BACKEND_URL = 'http://localhost:5001';

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return 'https://via.placeholder.com/200';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return path.startsWith('/') ? `${BACKEND_URL}${path}` : `${BACKEND_URL}/${path}`;
};

const getGuestViewed = (): RecentlyViewedItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentlyViewedItem[];
  } catch {
    return [];
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

const RecentlyViewedSection = ({ currentProductId }: RecentlyViewedSectionProps) => {
  const { isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchForLoggedIn = async () => {
      try {
        const res = await apiClient.getRecentlyViewed();
        if (cancelled) return;
        // API returns { data: { data: [...] } } or { data: [...] }
        const raw: any = res;
        const arr: any[] = raw?.data?.data ?? raw?.data ?? [];
        const filtered = Array.isArray(arr)
          ? arr.filter((p: any) => p._id !== currentProductId).slice(0, 10)
          : [];
        setProducts(filtered);
      } catch {
        // silently ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const fetchForGuest = async () => {
      const viewed = getGuestViewed()
        .sort((a, b) => b.timestamp - a.timestamp)
        .filter((v) => v.productId !== currentProductId)
        .slice(0, 10);

      if (viewed.length === 0) {
        if (!cancelled) {
          setProducts([]);
          setLoading(false);
        }
        return;
      }

      const results: ProductData[] = [];
      for (const item of viewed) {
        try {
          const res = await apiClient.getProductById(item.productId);
          if (cancelled) return;
          const p: any = (res as any)?.data?.data ?? (res as any)?.data ?? res;
          if (p && p._id) results.push(p);
        } catch {
          // skip deleted/unavailable products silently
        }
      }
      if (!cancelled) {
        setProducts(results);
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchForLoggedIn();
    } else {
      fetchForGuest();
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, currentProductId]);

  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-10 border-t border-border">
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6">
        Recently <span className="text-gradient-spice">Viewed</span>
      </h2>

      <div className="overflow-x-auto pb-3 -mx-1 px-1">
        <div className="flex gap-4 w-max">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-40">
                  <Skeleton className="aspect-square rounded-xl mb-2" />
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))
            : products.map((p) => (
                <Link
                  key={p._id}
                  to={`/product/${p._id}`}
                  className="flex-shrink-0 w-40 group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/40 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div className="aspect-square overflow-hidden bg-secondary/20">
                    <img
                      src={getImageUrl(p.image)}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="font-serif font-bold text-xs line-clamp-2 group-hover:text-primary transition-colors capitalize">
                      {p.name}
                    </h4>
                    <p className="font-serif font-bold text-sm mt-1">
                      ₹{(p.price || 0).toFixed(0)}
                    </p>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewedSection;
