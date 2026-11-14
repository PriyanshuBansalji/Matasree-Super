/**
 * Integration Test — Bug 3 Fix: Orders List Auto-Refreshes After Cancellation
 *
 * Scenario:
 *   1. Seed OrdersPage with a "confirmed" order in the ['my-orders'] cache.
 *   2. Trigger useCancelOrder (simulating the cancel mutation from OrderDetailPage).
 *   3. Assert that the ['my-orders'] cache is invalidated, causing useOrders to
 *      automatically refetch with updated data — OrdersPage now shows "cancelled"
 *      WITHOUT requiring manual navigation away and back.
 *
 * Key assertion: after cancellation, ['my-orders'] is invalidated so that the next
 * render of OrdersPage calls getOrders again and reflects the updated status.
 *
 * Validates: Requirements 3.1, 3.2
 */

import React from 'react';
import { renderHook, render, screen, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock router dependencies so OrdersPage renders without a <Router> context
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: React.ReactNode }) => React.createElement('a', {}, children),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock auth store — user is authenticated
vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({ isAuthenticated: true }),
}));

// Mock cart store
vi.mock('@/store/cartStore', () => ({
  useCartStore: () => ({ addItem: vi.fn(), toggleCart: vi.fn() }),
}));

// Mock api service
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

import { useCancelOrder, useOrders } from '@/hooks/useApi';
import { apiClient } from '@/services/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
}

function makeWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// Seed data helpers
const confirmedOrder = { _id: 'order-abc', orderstatus: 'confirmed', totalAmount: 500, items: [] };
const cancelledOrder = { _id: 'order-abc', orderstatus: 'cancelled', totalAmount: 500, items: [] };

// ---------------------------------------------------------------------------
// Integration Tests
// ---------------------------------------------------------------------------

describe("Integration — Bug 3 Fix: ['my-orders'] invalidated after cancel", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
  });

  it('cancelling an order invalidates [my-orders] so useOrders refetches updated data', async () => {
    // Step 1: Seed ['my-orders'] with a confirmed order (simulates initial page load)
    queryClient.setQueryData(['my-orders'], { data: [confirmedOrder] });
    expect(queryClient.getQueryState(['my-orders'])?.isInvalidated).toBe(false);

    // Step 2: Set up refetch mock to return the cancelled state
    (apiClient.cancelOrder as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true },
    });
    (apiClient.getOrders as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [cancelledOrder],
    });

    const wrapper = makeWrapper(queryClient);

    // Step 3: Render useCancelOrder and fire the mutation (as OrderDetailPage does)
    const { result: cancelResult } = renderHook(() => useCancelOrder(), { wrapper });

    act(() => {
      cancelResult.current.mutate('order-abc');
    });

    // Wait for the mutation to complete
    await waitFor(() => expect(cancelResult.current.isSuccess).toBe(true));

    // Step 4: Assert that ['my-orders'] is now marked as invalidated
    // This is the key assertion: the cache entry MUST be stale so OrdersPage
    // automatically refetches when it re-renders.
    const myOrdersState = queryClient.getQueryState(['my-orders']);
    expect(myOrdersState?.isInvalidated).toBe(true);
  });

  it('useOrders refetches and returns cancelled status after invalidation', async () => {
    // Step 1: Seed cache with confirmed order
    queryClient.setQueryData(['my-orders'], { data: [confirmedOrder] });

    // Step 2: Mock API to return cancelled order on next fetch
    (apiClient.cancelOrder as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true },
    });
    (apiClient.getOrders as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [cancelledOrder],
    });

    const wrapper = makeWrapper(queryClient);

    // Step 3: Render both hooks together (as OrdersPage + cancel button would coexist)
    const { result: cancelResult } = renderHook(() => useCancelOrder(), { wrapper });
    // Mount useOrders with an active observer — this is what OrdersPage does
    renderHook(() => useOrders(), { wrapper });

    // Initially, the cache is seeded and not invalidated — useOrders reads from cache
    const initialData = queryClient.getQueryData(['my-orders']) as any;
    expect(initialData?.data?.[0]?.orderstatus).toBe('confirmed');

    // Step 4: Fire the cancel mutation
    act(() => {
      cancelResult.current.mutate('order-abc');
    });

    await waitFor(() => expect(cancelResult.current.isSuccess).toBe(true));

    // Step 5: When useOrders is actively mounted, invalidation immediately triggers a
    // refetch. Wait for the refetch to complete with the updated (cancelled) data.
    await waitFor(() => {
      return queryClient.getQueryState(['my-orders'])?.status === 'success';
    }, { timeout: 3000 });

    // Verify getOrders was called — the invalidation triggered a refetch
    expect(apiClient.getOrders).toHaveBeenCalled();

    // Verify the data returned reflects the cancelled status
    const updatedData = queryClient.getQueryData(['my-orders']) as any;
    expect(updatedData?.data?.[0]?.orderstatus).toBe('cancelled');
  });

  it('[order, id] detail cache is also invalidated so OrderDetailPage refreshes', async () => {
    const orderId = 'order-xyz';

    // Seed both the list and detail caches
    queryClient.setQueryData(['my-orders'], { data: [{ ...confirmedOrder, _id: orderId }] });
    queryClient.setQueryData(['order', orderId], { _id: orderId, orderstatus: 'confirmed' });

    expect(queryClient.getQueryState(['my-orders'])?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(['order', orderId])?.isInvalidated).toBe(false);

    (apiClient.cancelOrder as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true },
    });

    const wrapper = makeWrapper(queryClient);
    const { result } = renderHook(() => useCancelOrder(), { wrapper });

    act(() => {
      result.current.mutate(orderId);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Both caches must be invalidated so UI auto-refreshes on both pages
    expect(queryClient.getQueryState(['my-orders'])?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(['order', orderId])?.isInvalidated).toBe(true);
  });
});
