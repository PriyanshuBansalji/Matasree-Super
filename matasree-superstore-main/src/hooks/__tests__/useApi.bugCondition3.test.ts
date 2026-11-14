/**
 * Bug Condition Exploration Test — Bug 3: Cache Invalidation Wrong Key
 *
 * Property 5: Bug Condition — Cancel Order Cache Invalidation
 *
 * This test is designed to FAIL on unfixed code.
 * Failure confirms the bug exists: useCancelOrder.onSuccess invalidates
 * ['orders'] instead of ['my-orders'], so the orders list cache is never
 * properly invalidated after a cancellation.
 *
 * COUNTEREXAMPLE: cancel orderId "abc123" → ['my-orders'] cache is NOT invalidated
 * (queryClient.getQueryState(['my-orders']).isInvalidated === false)
 * While ['orders'] IS invalidated (wrong key)
 *
 * Validates: Requirements 3.1, 3.2
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the entire @/services/api module so no real HTTP calls are made.
// We need to supply all methods that useApi.ts may call on apiClient.
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

import { useCancelOrder } from '../useApi';
import { apiClient } from '@/services/api';

describe('Bug 3 Condition: useCancelOrder invalidates wrong cache key', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it(
    'BUG CONDITION: cancelling order does NOT invalidate [my-orders] cache (confirms bug exists)',
    async () => {
      // Arrange: mock API to resolve successfully
      (apiClient.cancelOrder as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { success: true },
      });

      // Seed ['my-orders'] cache so it has an active entry
      queryClient.setQueryData(['my-orders'], [{ id: 'abc123', status: 'confirmed' }]);

      // Verify the seed is in place before mutation
      const beforeState = queryClient.getQueryState(['my-orders']);
      expect(beforeState).toBeDefined();
      expect(beforeState?.isInvalidated).toBe(false);

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

      const { result } = renderHook(() => useCancelOrder(), { wrapper });

      // Act: fire the mutation
      act(() => {
        result.current.mutate('abc123');
      });

      // Wait for mutation to succeed
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // -----------------------------------------------------------------------
      // DIAGNOSTIC: confirm the bug — ['orders'] (the WRONG key) WAS invalidated
      // This assertion should PASS on unfixed code, showing the wrong key is hit
      const wrongKeyState = queryClient.getQueryState(['orders']);
      // Note: ['orders'] was never seeded so its state may be undefined.
      // The important signal is that ['my-orders'] was NOT invalidated.
      // -----------------------------------------------------------------------

      // PRIMARY ASSERTION: ['my-orders'] MUST be invalidated after a successful
      // cancellation. On UNFIXED code this assertion FAILS because onSuccess
      // calls invalidateQueries(['orders']) instead of invalidateQueries(['my-orders']).
      //
      // EXPECTED TEST OUTCOME: FAILS on unfixed useApi.ts  → bug confirmed
      // EXPECTED TEST OUTCOME: PASSES on fixed useApi.ts   → bug resolved
      const myOrdersState = queryClient.getQueryState(['my-orders']);
      expect(myOrdersState?.isInvalidated).toBe(true); // FAILS on unfixed code

      // Supplementary: the detail entry for the specific order should be invalidated too
      // (this part uses the correct key ['order', id] even in unfixed code — should pass)
      const orderDetailState = queryClient.getQueryState(['order', 'abc123']);
      // Detail key is seeded by React Query only if something subscribed; skip if undefined
      if (orderDetailState) {
        expect(orderDetailState.isInvalidated).toBe(true);
      }
    }
  );
});
