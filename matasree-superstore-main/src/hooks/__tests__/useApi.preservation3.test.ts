/**
 * PRESERVATION Tests — Bug 3: Cache Keys (BEFORE implementing fix)
 *
 * Property 2: Preservation — useOrders Query Key and useOrder Detail Key Unchanged
 *
 * These tests document the BASELINE query-key behavior on UNFIXED code.
 * All tests MUST PASS on the current (unfixed) useApi.ts.
 *
 * What is preserved:
 *   1. useOrders registers its cache under ['my-orders']
 *   2. useOrder(id) registers its cache under ['order', id]
 *   3. useCreateOrder invalidates ['cart'] on success (unchanged behavior)
 *   4. Neither useOrders nor useOrder(id) query keys change after the fix (baseline anchor)
 *   5. useOrders does NOT register anything under ['orders'] (wrong key)
 *
 * Validates: Requirements — Unchanged Behavior 3
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the entire @/services/api module so no real HTTP calls are made.
vi.mock('@/services/api', () => ({
  apiClient: {
    cancelOrder: vi.fn(),
    getOrders: vi.fn(),
    getOrderById: vi.fn(),
    createOrder: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    getProducts: vi.fn(),
    getProductById: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    getCategories: vi.fn(),
    getCategoryById: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    getCart: vi.fn(),
    addToCart: vi.fn(),
    updateCartItem: vi.fn(),
    removeFromCart: vi.fn(),
    getAllOrders: vi.fn(),
    getAddresses: vi.fn(),
    addAddress: vi.fn(),
    updateAddress: vi.fn(),
    deleteAddress: vi.fn(),
  },
}));

import { useOrders, useOrder, useCreateOrder } from '../useApi';
import { apiClient } from '@/services/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a fresh QueryClient for each test */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

/** Create a wrapper component that injects the given QueryClient */
function makeWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PRESERVATION — Bug 3: Cache Key Baselines (unfixed code)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Test 1: useOrders uses ['my-orders'] query key
  // -------------------------------------------------------------------------
  it('PRESERVATION 1: useOrders registers its cache under [my-orders]', async () => {
    // Arrange: mock getOrders to resolve with an empty array
    (apiClient.getOrders as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { orders: [] },
    });

    const wrapper = makeWrapper(queryClient);
    renderHook(() => useOrders(), { wrapper });

    // Wait until the query has fetched and settled
    await waitFor(() => {
      const state = queryClient.getQueryState(['my-orders']);
      return state?.status === 'success';
    });

    // Assert the cache entry exists under ['my-orders']
    const myOrdersState = queryClient.getQueryState(['my-orders']);
    expect(myOrdersState).toBeDefined();
    expect(myOrdersState?.status).toBe('success');
  });

  // -------------------------------------------------------------------------
  // Test 2: useOrder(id) uses ['order', id] query key
  // -------------------------------------------------------------------------
  it('PRESERVATION 2: useOrder(id) registers its cache under [order, id]', async () => {
    const testOrderId = 'order-123';

    // Arrange: mock getOrderById to resolve with a single order
    (apiClient.getOrderById as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { order: { id: testOrderId } },
    });

    const wrapper = makeWrapper(queryClient);
    renderHook(() => useOrder(testOrderId), { wrapper });

    // Wait until the query has fetched and settled
    await waitFor(() => {
      const state = queryClient.getQueryState(['order', testOrderId]);
      return state?.status === 'success';
    });

    // Assert the cache entry exists under ['order', testOrderId]
    const orderDetailState = queryClient.getQueryState(['order', testOrderId]);
    expect(orderDetailState).toBeDefined();
    expect(orderDetailState?.status).toBe('success');
  });

  // -------------------------------------------------------------------------
  // Test 3: useCreateOrder invalidates ['cart'] on success
  // -------------------------------------------------------------------------
  it('PRESERVATION 3: useCreateOrder invalidates [cart] on success', async () => {
    // Arrange: seed ['cart'] with data
    queryClient.setQueryData(['cart'], { items: [] });

    const beforeCartState = queryClient.getQueryState(['cart']);
    expect(beforeCartState).toBeDefined();
    expect(beforeCartState?.isInvalidated).toBe(false);

    // Mock createOrder to succeed
    (apiClient.createOrder as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { order: { id: 'new-order-1' } },
    });

    const wrapper = makeWrapper(queryClient);
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    // Act: fire the mutation
    act(() => {
      result.current.mutate({ items: [], address: {} });
    });

    // Wait for the mutation to succeed
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert ['cart'] IS invalidated — this is correct behavior that must be preserved
    const cartState = queryClient.getQueryState(['cart']);
    expect(cartState?.isInvalidated).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Test 4: useCreateOrder DOES invalidate ['my-orders'] on FIXED code
  //         (Bug 3 fix applied — was ['orders'] before, now correctly ['my-orders'])
  // -------------------------------------------------------------------------
  it(
    'PRESERVATION 4: useCreateOrder correctly invalidates [my-orders] after Bug 3 fix',
    async () => {
      // Arrange: seed ['my-orders'] with data
      const seedOrders = [{ id: 'o1', status: 'confirmed' }];
      queryClient.setQueryData(['my-orders'], seedOrders);

      const beforeState = queryClient.getQueryState(['my-orders']);
      expect(beforeState?.isInvalidated).toBe(false);

      // Mock createOrder to succeed
      (apiClient.createOrder as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { order: { id: 'new-order-2' } },
      });

      const wrapper = makeWrapper(queryClient);
      const { result } = renderHook(() => useCreateOrder(), { wrapper });

      // Act
      act(() => {
        result.current.mutate({ items: [], address: {} });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // On FIXED code: useCreateOrder now invalidates ['my-orders'] (correct key).
      // ['my-orders'] MUST be invalidated after creating an order.
      const myOrdersState = queryClient.getQueryState(['my-orders']);
      expect(myOrdersState?.isInvalidated).toBe(true);
    }
  );

  // -------------------------------------------------------------------------
  // Test 5: useOrders query key is NOT ['orders'] — confirms it IS ['my-orders']
  // -------------------------------------------------------------------------
  it(
    'PRESERVATION 5: useOrders does not register anything under [orders] — confirms key is [my-orders]',
    async () => {
      // Arrange: mock getOrders to resolve
      (apiClient.getOrders as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { orders: [{ id: 'o1' }] },
      });

      const wrapper = makeWrapper(queryClient);
      renderHook(() => useOrders(), { wrapper });

      // Wait until the ['my-orders'] query settles
      await waitFor(() => {
        const state = queryClient.getQueryState(['my-orders']);
        return state?.status === 'success';
      });

      // Assert nothing is registered under the WRONG key ['orders']
      const wrongKeyState = queryClient.getQueryState(['orders']);
      expect(wrongKeyState).toBeUndefined();

      // Assert the CORRECT key ['my-orders'] IS registered
      const correctKeyState = queryClient.getQueryState(['my-orders']);
      expect(correctKeyState).toBeDefined();
    }
  );
});
