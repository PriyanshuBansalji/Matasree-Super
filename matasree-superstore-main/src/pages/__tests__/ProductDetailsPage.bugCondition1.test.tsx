/**
 * Bug Condition Exploration Test — Wishlist Not Persisting (Bug 2)
 *
 * **Validates: Requirements 2.1**
 *
 * EXPECTED TO FAIL on unfixed code — failure confirms the bug exists.
 *
 * Bug condition (isBugCondition_2):
 *   sourceComponent = "ProductDetailsPage"
 *   AND userIsAuthenticated = true
 *   AND wishlistButtonClicked = true
 *
 * On unfixed code, `handleWishlist` in ProductDetailsPage is a UI stub:
 *   const handleWishlist = () => { setIsWishlisted(!isWishlisted); toast.success(...); }
 * It makes NO call to apiClient.addToWishlist or apiClient.removeFromWishlist.
 *
 * This test spies on both methods and asserts that at least one is called when
 * an authenticated user clicks the heart button.  Because the stub never calls
 * either spy, the assertion FAILS — confirming the bug.
 *
 * Counterexample:
 *   Authenticated user clicks the heart button on ProductDetailsPage →
 *   apiClient.addToWishlist call count = 0 (expected ≥ 1).
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ─── Mock product data (defined before vi.mock calls) ──────────────────────────
// NOTE: vi.mock factories are hoisted, so we cannot reference outer variables
// inside them.  All inline data used by factories must be literals.

// ─── Module-level mocks ────────────────────────────────────────────────────────

// Mock the entire api module.  The factory uses only literals (no outer refs).
vi.mock('@/services/api', () => {
  const addToWishlistFn = vi.fn().mockResolvedValue({});
  const removeFromWishlistFn = vi.fn().mockResolvedValue({});

  const mockApiClient = {
    addToWishlist: addToWishlistFn,
    removeFromWishlist: removeFromWishlistFn,
    getProductById: vi.fn().mockResolvedValue({
      data: {
        data: {
          _id: 'prod123',
          name: 'Test Spice',
          price: 100,
          originalPrice: 150,
          image: '/test-image.jpg',
          description: 'A test spice product',
          category: { _id: 'cat1', name: 'Spices' },
          rating: 4.5,
          reviews: 10,
          stock: 50,
          sold: 100,
          weight: '100g',
          isBestseller: false,
          isNewProduct: false,
        },
      },
    }),
    getProducts: vi.fn().mockResolvedValue({ data: { data: { products: [] } } }),
    addToRecentlyViewed: vi.fn().mockResolvedValue({}),
    get: vi.fn().mockResolvedValue({ data: { reviews: [], total: 0 } }),
    post: vi.fn().mockResolvedValue({}),
  };

  return { apiClient: mockApiClient };
});

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'prod123' }),
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
    React.createElement('a', { href: String(to) }, children),
}));

// Mock authStore — authenticated user
vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    user: { _id: 'user1', name: 'Test User', email: 'test@example.com', role: 'customer' },
  }),
}));

// Mock cartStore
vi.mock('@/store/cartStore', () => ({
  useCartStore: () => ({
    addItem: vi.fn(),
  }),
}));

// Mock wishlistStore — product not yet wishlisted
vi.mock('@/store/wishlistStore', () => ({
  useWishlistStore: () => ({
    isWishlisted: (_id: string) => false,
    addItem: vi.fn(),
    removeItem: vi.fn(),
  }),
}));

// Mock useProduct hook to return mock product immediately (no React Query needed)
vi.mock('@/hooks/useApi', () => ({
  useProduct: (_id: string) => ({
    data: {
      data: {
        data: {
          _id: 'prod123',
          name: 'Test Spice',
          price: 100,
          originalPrice: 150,
          image: '/test-image.jpg',
          description: 'A test spice product',
          category: { _id: 'cat1', name: 'Spices' },
          rating: 4.5,
          reviews: 10,
          stock: 50,
          sold: 100,
          weight: '100g',
          isBestseller: false,
          isNewProduct: false,
        },
      },
    },
    isLoading: false,
  }),
  useProducts: () => ({ data: null, isLoading: false }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock heavy child components
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
    React.createElement('img', { alt: alt ?? '', src: '/test-image.jpg' }),
}));
vi.mock('@/components/PageHelmet', () => ({ default: () => null }));
vi.mock('@/components/JsonLd', () => ({
  default: () => null,
  buildProductSchema: () => ({}),
  buildBreadcrumbSchema: () => ({}),
}));

// ─── Imports that must come AFTER vi.mock declarations ─────────────────────────
import { apiClient } from '@/services/api';
import ProductDetailsPage from '@/pages/ProductDetailsPage';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Bug 2 — ProductDetailsPage wishlist makes no API call (EXPECTED TO FAIL on unfixed code)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it(
    'EXPECTED TO FAIL: authenticated click on heart button should call apiClient.addToWishlist — confirms bug: 0 calls instead of ≥1',
    async () => {
      /*
       * On UNFIXED code, handleWishlist is a UI stub — it only toggles local
       * React state and shows a toast.  It never calls:
       *   - apiClient.addToWishlist(productId)
       *   - apiClient.removeFromWishlist(productId)
       *
       * Counterexample:
       *   Input:  isAuthenticated=true, product._id='prod123', click heart once
       *   Expected: apiClient.addToWishlist called 1 time
       *   Actual:   apiClient.addToWishlist called 0 times  ← BUG CONFIRMED
       */

      render(React.createElement(ProductDetailsPage));

      // The button aria-label comes from:
      //   isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
      // Product starts un-wishlisted, so the label is 'Add to wishlist'.
      const wishlistButton = await screen.findByRole('button', {
        name: /add to wishlist/i,
      });

      expect(wishlistButton).toBeTruthy();

      // Click the heart button once as an authenticated user.
      fireEvent.click(wishlistButton);

      // Allow any async handlers (promises) to settle.
      await waitFor(() => {}, { timeout: 300 });

      /*
       * ASSERTION THAT WILL FAIL on unfixed code:
       *
       * We assert at least one wishlist API method was invoked.
       * On UNFIXED code both counts are 0  → assertion throws → test FAILS (confirms bug).
       * On FIXED code  addToWishlist = 1   → assertion passes → test PASSES (bug fixed).
       */
      const addCalls = (apiClient.addToWishlist as ReturnType<typeof vi.fn>).mock.calls.length;
      const removeCalls = (apiClient.removeFromWishlist as ReturnType<typeof vi.fn>).mock.calls.length;
      const totalApiCalls = addCalls + removeCalls;

      expect(totalApiCalls).toBeGreaterThanOrEqual(1);
    },
  );
});
