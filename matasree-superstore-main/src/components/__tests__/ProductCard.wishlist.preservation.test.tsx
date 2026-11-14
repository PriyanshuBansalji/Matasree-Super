/**
 * Preservation Property Tests — Wishlist (Task 6)
 *
 * **Validates: Requirements Unchanged Behavior 2**
 *
 * Property 2: Preservation — ProductCard Wishlist Behavior Unchanged
 *
 * These tests MUST PASS on UNFIXED code — they capture the existing baseline
 * behavior of ProductCard (and unauthenticated ProductDetailsPage) that must
 * not regress after the Bug 2 fix is applied.
 *
 * Observation-first methodology:
 *   1. Observe: ProductCard.handleWishlist with isAuthenticated=true calls
 *      apiClient.post(`/wishlist/${product._id}`) for add and
 *      apiClient.delete(`/wishlist/${product._id}`) for remove.
 *   2. Observe: unauthenticated wishlist click on ProductCard shows
 *      toast.error('Please log in to add to wishlist') and makes no API call.
 *   3. Observe: unauthenticated click on ProductDetailsPage makes no API call
 *      (unfixed code does not check auth — it just toggles state, no API calls).
 *
 * EXPECTED OUTCOME: All tests PASS on unfixed code.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ─── Mutable state containers (shared across suites) ──────────────────────────
// These let us change store behaviour per-test without re-mocking.

let mockIsAuthenticated = true;
let mockIsWishlisted = false;

const mockAddToWishlistStore = vi.fn();
const mockRemoveFromWishlistStore = vi.fn();

// ─── Module-level mocks ───────────────────────────────────────────────────────
// vi.mock factories are hoisted, so they CANNOT reference outer variables.
// We work around this by importing the mutable refs inside the factory.

vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    get isAuthenticated() { return mockIsAuthenticated; },
    user: { _id: 'user1', name: 'Test User', email: 'test@example.com', role: 'customer' },
  }),
}));

vi.mock('@/store/wishlistStore', () => ({
  useWishlistStore: () => ({
    isWishlisted: (_id: string) => mockIsWishlisted,
    addItem: mockAddToWishlistStore,
    removeItem: mockRemoveFromWishlistStore,
  }),
}));

vi.mock('@/store/cartStore', () => ({
  useCartStore: () => ({
    addItem: vi.fn(),
  }),
}));

vi.mock('@/store/comparisonStore', () => ({
  useComparisonStore: () => ({
    addProduct: vi.fn(),
  }),
}));

vi.mock('@/services/api', () => {
  const postFn = vi.fn().mockResolvedValue({});
  const deleteFn = vi.fn().mockResolvedValue({});

  const mockApiClient = {
    post: postFn,
    delete: deleteFn,
    addToWishlist: vi.fn().mockResolvedValue({}),
    removeFromWishlist: vi.fn().mockResolvedValue({}),
    getProductById: vi.fn().mockResolvedValue({
      data: {
        data: {
          _id: 'prod-preserve-123',
          name: 'Preservation Spice',
          price: 120,
          originalPrice: 150,
          image: '/test-image.jpg',
          description: 'A test product for preservation tests',
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
    put: vi.fn().mockResolvedValue({}),
  };

  return { apiClient: mockApiClient };
});

vi.mock('@/hooks/useApi', () => ({
  useProduct: (_id: string) => ({
    data: {
      data: {
        data: {
          _id: 'prod-preserve-123',
          name: 'Preservation Spice',
          price: 120,
          originalPrice: 150,
          image: '/test-image.jpg',
          description: 'A test product for preservation tests',
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

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'prod-preserve-123' }),
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
    React.createElement('a', { href: String(to) }, children),
}));

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

// ─── Imports AFTER vi.mock declarations ───────────────────────────────────────

import { apiClient } from '@/services/api';
import { toast } from 'sonner';
import ProductCard from '@/components/ProductCard';
import ProductDetailsPage from '@/pages/ProductDetailsPage';

// ─── Mock product ─────────────────────────────────────────────────────────────

const MOCK_PRODUCT = {
  _id: 'prod-preserve-123',
  name: 'Preservation Spice',
  price: 120,
  originalPrice: 150,
  image: '/test-image.jpg',
  description: 'A test product for preservation tests',
  category: { _id: 'cat1', name: 'Spices' },
  rating: 4.5,
  reviews: 10,
  stock: 50,
  sold: 100,
  weight: '100g',
  isBestseller: false,
  isNew: false,
};

// ─── Suite 1: ProductCard — Authenticated Add to Wishlist ─────────────────────

describe('Preservation P2-1 — ProductCard: authenticated add to wishlist calls apiClient.post', () => {
  /**
   * Observation: ProductCard.handleWishlist (isAuthenticated=true, wishlisted=false):
   *   addToWishlist(wishlistItem)   ← optimistic store update
   *   await apiClient.post(`/wishlist/${product._id}`)  ← API call
   *
   * Property: For all authenticated clicks on a non-wishlisted product,
   * apiClient.post IS called with `/wishlist/<productId>`.
   *
   * **Validates: Requirements Unchanged Behavior 2**
   */

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
    mockIsWishlisted = false;
    // Reset mock implementations
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls apiClient.post with /wishlist/<productId> when authenticated user clicks add to wishlist', async () => {
    /*
     * ProductCard.handleWishlist on unfixed code (CORRECT implementation):
     *   if (!isAuthenticated) → early return (not this case)
     *   wishlisted=false → addToWishlist(item) + apiClient.post(`/wishlist/${product._id}`)
     *
     * Expected: apiClient.post called once with `/wishlist/prod-preserve-123`
     */
    render(React.createElement(ProductCard, { product: MOCK_PRODUCT }));

    // Wishlist button: aria-label="Add Preservation Spice to wishlist"
    const wishlistButton = screen.getByRole('button', {
      name: /add preservation spice to wishlist/i,
    });

    expect(wishlistButton).toBeTruthy();

    fireEvent.click(wishlistButton);

    // Wait for async handler
    await waitFor(
      () => {
        const postCalls = (apiClient.post as ReturnType<typeof vi.fn>).mock.calls;
        const wishlistCall = postCalls.find(
          (call) => call[0] === `/wishlist/${MOCK_PRODUCT._id}`
        );
        expect(wishlistCall).toBeDefined();
      },
      { timeout: 1000 }
    );
  });
});

// ─── Suite 2: ProductCard — Authenticated Remove from Wishlist ────────────────

describe('Preservation P2-2 — ProductCard: authenticated remove from wishlist calls apiClient.delete', () => {
  /**
   * Observation: ProductCard.handleWishlist (isAuthenticated=true, wishlisted=true):
   *   removeFromWishlist(product._id)  ← optimistic store update
   *   await apiClient.delete(`/wishlist/${product._id}`)  ← API call
   *
   * Property: For all authenticated clicks on an already-wishlisted product,
   * apiClient.delete IS called with `/wishlist/<productId>`.
   *
   * **Validates: Requirements Unchanged Behavior 2**
   */

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
    mockIsWishlisted = true; // product IS wishlisted
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockIsWishlisted = false; // reset to default
  });

  it('calls apiClient.delete with /wishlist/<productId> when authenticated user clicks remove from wishlist', async () => {
    /*
     * ProductCard.handleWishlist on unfixed code (CORRECT implementation):
     *   if (!isAuthenticated) → early return (not this case)
     *   wishlisted=true → removeFromWishlist(id) + apiClient.delete(`/wishlist/${product._id}`)
     *
     * Expected: apiClient.delete called once with `/wishlist/prod-preserve-123`
     */
    render(React.createElement(ProductCard, { product: MOCK_PRODUCT }));

    // When wishlisted=true the aria-label is "Remove Preservation Spice from wishlist"
    const wishlistButton = screen.getByRole('button', {
      name: /remove preservation spice from wishlist/i,
    });

    expect(wishlistButton).toBeTruthy();

    fireEvent.click(wishlistButton);

    await waitFor(
      () => {
        const deleteCalls = (apiClient.delete as ReturnType<typeof vi.fn>).mock.calls;
        const wishlistDeleteCall = deleteCalls.find(
          (call) => call[0] === `/wishlist/${MOCK_PRODUCT._id}`
        );
        expect(wishlistDeleteCall).toBeDefined();
      },
      { timeout: 1000 }
    );
  });
});

// ─── Suite 3: ProductCard — Unauthenticated click: toast, no API ──────────────

describe('Preservation P2-3 — ProductCard: unauthenticated click shows login toast and makes no API call', () => {
  /**
   * Observation: ProductCard.handleWishlist (isAuthenticated=false):
   *   toast.error('Please log in to add to wishlist')
   *   return  ← early exit, no API call
   *
   * Properties:
   *   - apiClient.post is NOT called for /wishlist/*
   *   - apiClient.delete is NOT called for /wishlist/*
   *   - toast.error is called with 'Please log in to add to wishlist'
   *
   * **Validates: Requirements Unchanged Behavior 2**
   */

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = false;
    mockIsWishlisted = false;
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockIsAuthenticated = true; // reset to default
  });

  it('does not call apiClient.post or apiClient.delete when user is unauthenticated', async () => {
    render(React.createElement(ProductCard, { product: MOCK_PRODUCT }));

    const wishlistButton = screen.getByRole('button', {
      name: /add preservation spice to wishlist/i,
    });

    fireEvent.click(wishlistButton);

    await waitFor(() => {}, { timeout: 300 });

    // No wishlist API calls should have been made
    const wishlistPostCalls = (apiClient.post as ReturnType<typeof vi.fn>).mock.calls
      .filter((call) => String(call[0]).startsWith('/wishlist'));
    const wishlistDeleteCalls = (apiClient.delete as ReturnType<typeof vi.fn>).mock.calls
      .filter((call) => String(call[0]).startsWith('/wishlist'));

    expect(wishlistPostCalls.length).toBe(0);
    expect(wishlistDeleteCalls.length).toBe(0);
  });

  it('shows toast.error with "Please log in to add to wishlist" when user is unauthenticated', async () => {
    render(React.createElement(ProductCard, { product: MOCK_PRODUCT }));

    const wishlistButton = screen.getByRole('button', {
      name: /add preservation spice to wishlist/i,
    });

    fireEvent.click(wishlistButton);

    await waitFor(() => {}, { timeout: 300 });

    const errorToastCalls = (toast.error as ReturnType<typeof vi.fn>).mock.calls;
    const loginToastCall = errorToastCalls.find(
      (call) => call[0] === 'Please log in to add to wishlist'
    );
    expect(loginToastCall).toBeDefined();
  });
});

// ─── Suite 4: ProductCard — API error on add triggers rollback ────────────────

describe('Preservation P2-4 — ProductCard: API error on add triggers rollback', () => {
  /**
   * Observation: ProductCard.handleWishlist error handler (add path):
   *   catch { removeFromWishlist(product._id); toast.error('Failed to update wishlist'); }
   *
   * Property: When apiClient.post throws, the optimistic add is rolled back
   * by calling the store's removeItem function.
   *
   * **Validates: Requirements Unchanged Behavior 2**
   */

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
    mockIsWishlisted = false;
    // Make apiClient.post throw to trigger the rollback
    (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore default mock
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  it('calls store removeItem (rollback) when apiClient.post throws during wishlist add', async () => {
    /*
     * Flow:
     *   1. addItem(wishlistItem)  — optimistic add
     *   2. await apiClient.post(`/wishlist/...`) — THROWS
     *   3. catch: removeItem(product._id) — rollback
     *
     * Expected: mockRemoveFromWishlistStore called with product._id
     */
    render(React.createElement(ProductCard, { product: MOCK_PRODUCT }));

    const wishlistButton = screen.getByRole('button', {
      name: /add preservation spice to wishlist/i,
    });

    fireEvent.click(wishlistButton);

    // Wait for async catch block to execute
    await waitFor(
      () => {
        const rollbackCalls = mockRemoveFromWishlistStore.mock.calls;
        const rollbackCall = rollbackCalls.find(
          (call) => call[0] === MOCK_PRODUCT._id
        );
        expect(rollbackCall).toBeDefined();
      },
      { timeout: 1000 }
    );
  });
});

// ─── Suite 5: ProductDetailsPage — Unauthenticated click makes no API call ────

describe('Preservation P2-5 — ProductDetailsPage: unauthenticated click makes no API call (existing behavior)', () => {
  /**
   * Observation: The UNFIXED ProductDetailsPage.handleWishlist is:
   *   const handleWishlist = () => {
   *     setIsWishlisted(!isWishlisted);
   *     toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
   *   };
   *
   * It has NO auth check AND makes NO API calls — regardless of auth status.
   *
   * This test documents that on unfixed code, any click on ProductDetailsPage heart
   * makes NO call to apiClient.post or apiClient.delete.
   *
   * Passes on UNFIXED code: stub never calls any API.
   * Passes on FIXED code: fixed code has auth guard → unauthenticated → no API call.
   *
   * **Validates: Requirements Unchanged Behavior 2**
   */

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = false;
    mockIsWishlisted = false;
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockIsAuthenticated = true; // reset to default
  });

  it('makes no wishlist API call when unauthenticated user clicks heart on ProductDetailsPage', async () => {
    render(React.createElement(ProductDetailsPage));

    // ProductDetailsPage heart button aria-label: "Add to wishlist" or "Remove from wishlist"
    const wishlistButton = await screen.findByRole('button', {
      name: /add to wishlist|remove from wishlist/i,
    });

    expect(wishlistButton).toBeTruthy();

    fireEvent.click(wishlistButton);

    await waitFor(() => {}, { timeout: 300 });

    // Assert NEITHER apiClient.post nor apiClient.delete was called for /wishlist
    const wishlistPostCalls = (apiClient.post as ReturnType<typeof vi.fn>).mock.calls
      .filter((call) => String(call[0]).startsWith('/wishlist'));
    const wishlistDeleteCalls = (apiClient.delete as ReturnType<typeof vi.fn>).mock.calls
      .filter((call) => String(call[0]).startsWith('/wishlist'));

    expect(wishlistPostCalls.length).toBe(0);
    expect(wishlistDeleteCalls.length).toBe(0);
  });
});
