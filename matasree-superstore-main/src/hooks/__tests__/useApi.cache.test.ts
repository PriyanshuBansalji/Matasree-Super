/**
 * Unit Tests — Bug 3 Fix: Cache Invalidation Key Correction in useApi.ts
 *
 * Verifies that after the Bug 3 fix:
 *   1. useCancelOrder.onSuccess invalidates ['my-orders'] (orders list)
 *   2. useCancelOrder.onSuccess invalidates ['order', id] (order detail)
 *   3. useCreateOrder.onSuccess invalidates ['my-orders'] (orders list)
 *   4. useCreateOrder.onSuccess invalidates ['cart'] (cart)
 *
 * Validates: Requirements 3.1, 3.2
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/services/api', () => ({
  apiClient: {
    cancelOrder: vi.fn(),
    createOrder: vi.fn(),
    getOrders: vi.fn(),
    getOrderById: vi.fn(),
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

import { useCancelOrder, useCreateOrder } from '../useApi';
import { apiClient } from '@/services/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function makeWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// ---------------------------------------------------------------------------
// useCancelOrder cache invalidation tests
// ---------------------------------------------------------------------------

describe('useCancelOrder — cache invalidation after Bug 3 fix', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
  });

  it('invalidates [my-orders] after a successful cancellation', async () => {
    // Seed ['my-orders'] so there is an active cache entry to invalidate
    queryClient.setQueryData(['my-orders'], [{ id: 'order-1', status: 'confirmed' }]);
    expect(queryClient.getQueryState(['my-orders'])?.isInvalidated).toBe(false);

    (apiClient.cancelOrder as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true },
    });

    const wrapper = makeWrapper(queryClient);
    const { result } = renderHook(() => useCancelOrder(), { wrapper });

    act(() => {
      result.current.mutate('order-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // ['my-orders'] MUST be marked invalidated so useOrders refetches
    expect(queryClient.getQueryState(['my-orders'])?.isInvalidated).toBe(true);
  });

  it('invalidates [order, id] after a successful cancellation', async () => {
    const orderId = 'order-42';
    // Seed the detail entry
    queryClient.setQueryData(['order', orderId], { id: orderId, status: 'confirmed' });
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

    // The detail entry for the cancelled order MUST also be invalidated
    expect(queryClient.getQueryState(['order', orderId])?.isInvalidated).toBe(true);
  });

  it('does NOT invalidate an unrelated cache key', async () => {
    queryClient.setQueryData(['products'], [{ id: 'p1' }]);
    expect(queryClient.getQueryState(['products'])?.isInvalidated).toBe(false);

    (apiClient.cancelOrder as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true },
    });

    const wrapper = makeWrapper(queryClient);
    const { result } = renderHook(() => useCancelOrder(), { wrapper });

    act(() => {
      result.current.mutate('order-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Products cache must remain untouched
    expect(queryClient.getQueryState(['products'])?.isInvalidated).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// useCreateOrder cache invalidation tests
// ---------------------------------------------------------------------------

describe('useCreateOrder — cache invalidation after Bug 3 fix', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
  });

  it('invalidates [my-orders] after a successful order creation', async () => {
    queryClient.setQueryData(['my-orders'], [{ id: 'o1', status: 'confirmed' }]);
    expect(queryClient.getQueryState(['my-orders'])?.isInvalidated).toBe(false);

    (apiClient.createOrder as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { order: { id: 'new-order' } },
    });

    const wrapper = makeWrapper(queryClient);
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    act(() => {
      result.current.mutate({ items: [], address: 'addr-1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(['my-orders'])?.isInvalidated).toBe(true);
  });

  it('invalidates [cart] after a successful order creation', async () => {
    queryClient.setQueryData(['cart'], { items: [{ id: 'item-1' }] });
    expect(queryClient.getQueryState(['cart'])?.isInvalidated).toBe(false);

    (apiClient.createOrder as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { order: { id: 'new-order-2' } },
    });

    const wrapper = makeWrapper(queryClient);
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    act(() => {
      result.current.mutate({ items: [], address: 'addr-1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(['cart'])?.isInvalidated).toBe(true);
  });

  it('invalidates both [my-orders] and [cart] in a single successful mutation', async () => {
    queryClient.setQueryData(['my-orders'], []);
    queryClient.setQueryData(['cart'], { items: [] });

    (apiClient.createOrder as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { order: { id: 'new-order-3' } },
    });

    const wrapper = makeWrapper(queryClient);
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    act(() => {
      result.current.mutate({ items: [], address: 'addr-1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(['my-orders'])?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(['cart'])?.isInvalidated).toBe(true);
  });
});
