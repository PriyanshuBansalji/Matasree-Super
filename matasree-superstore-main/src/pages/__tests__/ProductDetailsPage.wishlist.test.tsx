/**
 * Unit Tests — Bug 2 Fix: ProductDetailsPage Wishlist API Persistence
 *
 * **Validates: Requirements 2.1, 2.2**
 *
 * These tests cover the fixed `handleWishlist` implementation in
 * `ProductDetailsPage.tsx`, verifying that:
 *   1. Authenticated add → apiClient.addToWishlist called with correct productId
 *   2. Second click (already wishlisted) → apiClient.removeFromWishlist called
 *   3. useWishlistStore reflects addItem / removeItem calls
 *   4. API error on add → rollback (store removeItem) + error toast
 *   5. API error on remove → rollback (store addItem) + error toast
 *   6. Unauthenticated click → no API call, "Please log in" toast
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ─── Shared mutable state for store/auth (mutated per-test) ───────────────────

let mockIsAuthenticated = true;
let mockIsWishlisted = false;
const mockAddToWishlistStore = vi.fn();
const mockRemoveFromWishlistStore = vi.fn();

// ─── Module-level mocks ───────────────────────────────────────────────────────

vi.mock('@/services/api', () => ({
  apiClient: {
    addToWishlist: vi.fn().mockResolvedValue({}),
    removeFromWishlist: vi.fn().mockResolvedValue({}),
    getProducts: vi.fn().mockResolvedValue({ data: { data: { products: [] } } }),
    addToRecentlyViewed: vi.fn().mockResolvedValue({}),
    get: vi.fn().mockResolvedValue({ data: { reviews: [], total: 0 } }),
    post: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'prod-unit-123' }),
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
    React.createElement('a', { href: String(to) }, children),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    isAuthenticated: mockIsAuthenticated,
    user: { _id: 'user1', name: 'Test User', email: 'test@example.com', role: 'customer' },
  }),
}));

vi.mock('@/store/cartStore', () => ({
  useCartStore: () => ({ addItem: vi.fn() }),
}));

vi.mock('@/store/wishlistStore', () => ({
  useWishlistStore: () => ({
    isWishlisted: (_id: string) => mockIsWishlisted,
    addItem: mockAddToWishlistStore,
    removeItem: mockRemoveFromWishlistStore,
  }),
}));

vi.mock('@/hooks/useApi', () => ({
  useProduct: (_id: string) => ({
    data: {
      data: {
        data: {
          _id: 'prod-unit-123',
          name: 'Unit Test Spice',
          price: 200,
          originalPrice: 300,
          image: '/unit-test.jpg',
          description: 'Unit test product description',
          category: { _id: 'cat1', name: 'Spices' },
          rating: 4.0,
          reviews: 5,
          stock: 20,
          sold: 50,
          weight: '200g',
          isBestseller: false,
          isNewProduct: false,
        },
      },
    },
    isLoading: false,
  }),
  useProducts: () => ({ data: null, isLoading: false }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

// ─── Heavy child component mocks ──────────────────────────────────────────────

vi.mock('@/components/Navbar', () => ({
  default: () => React.createElement('div', { 'data-testid': 'navbar' }),
}));
vi.mock('@/components/Footer', () => ({
  default: () => React.createElement('div', { 'data-testid': 'footer' }),
}));
vi.mock('@/components/CartDrawer', () => ({ default: () => null }));
vi.mock('@/components/StickyAddToCartBar', () => ({ default: () => null }));
vi.mock('@/components/TrustBadges', () => ({ default: () => null }));
vi.mock('@/components/WhatsAppButton', () => ({ default: () => null }));
vi.mock('@/components/RecentlyViewedSection', () => ({ default: () => null }));
vi.mock('@/components/ProductImage', () => ({
  default: ({ alt }: { alt?: string }) =>
    React.createElement('img', { alt: alt ?? '', src: '/unit-test.jpg' }),
}));
vi.mock('@/components/PageHelmet', () => ({ default: () => null }));
vi.mock('@/components/JsonLd', () => ({
  default: () => null,
  buildProductSchema: () => ({}),
  buildBreadcrumbSchema: () => ({}),
}));

// ─── Imports after vi.mock declarations ───────────────────────────────────────

import { apiClient } from '@/services/api';
import { toast } from 'sonner';
import ProductDetailsPage from '@/pages/ProductDetailsPage';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const renderPage = () => render(React.createElement(ProductDetailsPage));

const getWishlistButton = async () =>
  screen.findByRole('button', {
    name: /add to wishlist|remove from wishlist/i,
  });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProductDetailsPage — wishlist unit tests (Bug 2 fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
    mockIsWishlisted = false;
    // Re-apply mock implementations after clearAllMocks resets them
    (apiClient.addToWishlist as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (apiClient.removeFromWishlist as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (apiClient.addToRecentlyViewed as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (apiClient.getProducts as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { data: { products: [] } } });
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { reviews: [], total: 0 } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Test 1: Authenticated add ─────────────────────────────────────────────

  it('authenticated click (not wishlisted) → apiClient.addToWishlist called with correct productId', async () => {
    mockIsAuthenticated = true;
    mockIsWishlisted = false;

    renderPage();
    const btn = await getWishlistButton();
    fireEvent.click(btn);

    await waitFor(() => {
      expect(apiClient.addToWishlist).toHaveBeenCalledTimes(1);
      expect(apiClient.addToWishlist).toHaveBeenCalledWith('prod-unit-123');
    });
  });

  // ── Test 2: Authenticated remove (already wishlisted) ────────────────────

  it('authenticated click (already wishlisted) → apiClient.removeFromWishlist called with correct productId', async () => {
    mockIsAuthenticated = true;
    mockIsWishlisted = true;

    renderPage();
    const btn = await getWishlistButton();
    fireEvent.click(btn);

    await waitFor(() => {
      expect(apiClient.removeFromWishlist).toHaveBeenCalledTimes(1);
      expect(apiClient.removeFromWishlist).toHaveBeenCalledWith('prod-unit-123');
    });
  });

  // ── Test 3: useWishlistStore addItem/removeItem called ────────────────────

  it('useWishlistStore.addItem called with wishlist item when adding', async () => {
    mockIsAuthenticated = true;
    mockIsWishlisted = false;

    renderPage();
    const btn = await getWishlistButton();
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockAddToWishlistStore).toHaveBeenCalledTimes(1);
      const calledItem = mockAddToWishlistStore.mock.calls[0][0];
      expect(calledItem.id).toBe('prod-unit-123');
    });
  });

  it('useWishlistStore.removeItem called with productId when removing', async () => {
    mockIsAuthenticated = true;
    mockIsWishlisted = true;

    renderPage();
    const btn = await getWishlistButton();
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockRemoveFromWishlistStore).toHaveBeenCalledWith('prod-unit-123');
    });
  });

  // ── Test 4: API error on add → rollback ───────────────────────────────────

  it('API error on add → store removeItem (rollback) called and error toast shown', async () => {
    mockIsAuthenticated = true;
    mockIsWishlisted = false;
    (apiClient.addToWishlist as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    renderPage();
    const btn = await getWishlistButton();
    fireEvent.click(btn);

    await waitFor(() => {
      // Optimistic add was made
      expect(mockAddToWishlistStore).toHaveBeenCalledTimes(1);
      // Rollback: removeItem called after API failure
      expect(mockRemoveFromWishlistStore).toHaveBeenCalledWith('prod-unit-123');
      // Error toast shown
      expect(toast.error).toHaveBeenCalledWith('Failed to update wishlist');
    });
  });

  // ── Test 5: API error on remove → rollback ────────────────────────────────

  it('API error on remove → store addItem (rollback) called and error toast shown', async () => {
    mockIsAuthenticated = true;
    mockIsWishlisted = true;
    (apiClient.removeFromWishlist as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    renderPage();
    const btn = await getWishlistButton();
    fireEvent.click(btn);

    await waitFor(() => {
      // Optimistic remove was made
      expect(mockRemoveFromWishlistStore).toHaveBeenCalledTimes(1);
      // Rollback: addItem called after API failure
      expect(mockAddToWishlistStore).toHaveBeenCalledTimes(1);
      const rolledBackItem = mockAddToWishlistStore.mock.calls[0][0];
      expect(rolledBackItem.id).toBe('prod-unit-123');
      // Error toast shown
      expect(toast.error).toHaveBeenCalledWith('Failed to update wishlist');
    });
  });

  // ── Test 6: Unauthenticated click ─────────────────────────────────────────

  it('unauthenticated click → no API call made, "Please log in" toast shown', async () => {
    mockIsAuthenticated = false;
    mockIsWishlisted = false;

    renderPage();
    const btn = await getWishlistButton();
    fireEvent.click(btn);

    await waitFor(() => {
      expect(apiClient.addToWishlist).not.toHaveBeenCalled();
      expect(apiClient.removeFromWishlist).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Please log in to add to wishlist');
    });
  });
});
