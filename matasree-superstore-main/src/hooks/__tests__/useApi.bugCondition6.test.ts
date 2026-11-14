/**
 * Bug Condition Exploration Test — Bug 6: Double localStorage Write
 *
 * Property 1: Bug Condition — useLogin.onSuccess Writes authToken Independently of authStore
 *
 * This test is designed to FAIL on unfixed code.
 * Failure confirms the bug exists: useLogin.onSuccess manually writes
 * localStorage.setItem('authToken', ...) and localStorage.setItem('user', ...)
 * creating a duplicate storage location that can become desynchronized from
 * Zustand's persist middleware (which writes to 'matasree-auth').
 *
 * COUNTEREXAMPLE: login with email/password → spy records TWO separate writes:
 *   1. localStorage.setItem('authToken', 'tokenA') from useLogin.onSuccess (REDUNDANT)
 *   2. localStorage.setItem('user', JSON.stringify(user)) from useLogin.onSuccess (REDUNDANT)
 * These manual writes are independent of the Zustand authStore persist middleware,
 * causing potential state desync when tokens rotate.
 *
 * EXPECTED TEST OUTCOME: Test FAILS on unfixed useApi.ts because the manual
 * localStorage.setItem calls ARE present in useLogin.onSuccess.
 *
 * EXPECTED TEST OUTCOME: Test PASSES on fixed useApi.ts after removing the
 * manual localStorage writes (authStore.login + Zustand persist becomes single source of truth).
 *
 * Validates: Requirements 6.1, 6.2
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock the entire @/services/api module so no real HTTP calls are made.
vi.mock('@/services/api', () => ({
  apiClient: {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    cancelOrder: vi.fn(),
    getOrders: vi.fn(),
    getOrderById: vi.fn(),
    createOrder: vi.fn(),
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

import { useLogin } from '../useApi';
import { apiClient } from '@/services/api';

describe('Bug 6 Condition: useLogin writes authToken to localStorage independently of authStore', () => {
  let queryClient: QueryClient;
  let localStorageSetItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();

    // Spy on localStorage.setItem to capture all write operations
    localStorageSetItemSpy = vi.spyOn(Storage.prototype, 'setItem');
  });

  afterEach(() => {
    // Restore the original localStorage.setItem implementation
    localStorageSetItemSpy.mockRestore();
  });

  it(
    'BUG CONDITION: useLogin.onSuccess writes authToken directly to localStorage (confirms bug exists)',
    async () => {
      // Arrange: mock API to return successful login response
      const mockAccessToken = 'tokenA';
      const mockUser = {
        _id: 'user-123',
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer' as const,
      };

      (apiClient.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          accessToken: mockAccessToken,
          user: mockUser,
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

      const { result } = renderHook(() => useLogin(), { wrapper });

      // Act: fire the login mutation
      act(() => {
        result.current.mutate({ email: 'test@example.com', password: 'password123' });
      });

      // Wait for mutation to succeed
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // -----------------------------------------------------------------------
      // PRIMARY ASSERTION: Check if localStorage.setItem was called with 'authToken'
      // On UNFIXED code, this assertion will PASS (bug confirmed) because
      // useLogin.onSuccess contains: localStorage.setItem('authToken', response.data.accessToken)
      //
      // On FIXED code, this assertion will FAIL (bug resolved) because the
      // manual localStorage write will have been removed.
      // -----------------------------------------------------------------------

      // Collect all localStorage.setItem calls
      const setItemCalls = localStorageSetItemSpy.mock.calls;

      // Check if 'authToken' was written directly (the redundant write)
      const authTokenCall = setItemCalls.find(
        (call) => call[0] === 'authToken' && call[1] === mockAccessToken
      );

      // Check if 'user' was written directly (the redundant write)
      const userCall = setItemCalls.find(
        (call) => call[0] === 'user' && call[1] === JSON.stringify(mockUser)
      );

      // -----------------------------------------------------------------------
      // DIAGNOSTIC OUTPUT: Log all localStorage.setItem calls for debugging
      // This helps understand what writes occurred during the test
      // -----------------------------------------------------------------------
      console.log('localStorage.setItem calls:', setItemCalls);

      // -----------------------------------------------------------------------
      // ASSERTION: On UNFIXED code, these manual localStorage writes SHOULD be present
      // This test is EXPECTED TO FAIL when run on unfixed code, because:
      // - We ASSERT that authTokenCall and userCall should be UNDEFINED (not present)
      // - But on unfixed code, they WILL be present (not undefined)
      // - Therefore the assertions below will FAIL, confirming the bug exists
      //
      // After the fix (removing manual localStorage writes from useLogin.onSuccess):
      // - authTokenCall will be undefined (manual write removed)
      // - userCall will be undefined (manual write removed)
      // - The test will PASS
      // -----------------------------------------------------------------------

      // PRIMARY BUG CONFIRMATION: Manual authToken write should NOT exist
      // (but DOES exist on unfixed code → test FAILS → bug confirmed)
      expect(authTokenCall).toBeUndefined(); // FAILS on unfixed code

      // SECONDARY BUG CONFIRMATION: Manual user write should NOT exist
      // (but DOES exist on unfixed code → test FAILS → bug confirmed)
      expect(userCall).toBeUndefined(); // FAILS on unfixed code

      // -----------------------------------------------------------------------
      // SUPPLEMENTARY DIAGNOSTIC: Verify the mutation completed successfully
      // This ensures the test setup is correct regardless of the bug
      // -----------------------------------------------------------------------
      expect(result.current.isSuccess).toBe(true);
      expect(apiClient.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    }
  );

  it(
    'DIAGNOSTIC: demonstrates the duplicate write pattern causing state desync',
    async () => {
      // This test documents HOW the bug causes desynchronization between
      // the flat localStorage keys ('authToken', 'user') and Zustand persist
      // storage ('matasree-auth')

      const mockAccessToken = 'tokenB';
      const mockUser = {
        _id: 'user-456',
        id: 'user-456',
        name: 'Another User',
        email: 'another@example.com',
        role: 'customer' as const,
      };

      (apiClient.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          accessToken: mockAccessToken,
          user: mockUser,
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

      const { result } = renderHook(() => useLogin(), { wrapper });

      act(() => {
        result.current.mutate({ email: 'another@example.com', password: 'pass456' });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Collect all setItem calls
      const setItemCalls = localStorageSetItemSpy.mock.calls;

      // -----------------------------------------------------------------------
      // DIAGNOSTIC ANALYSIS: On unfixed code, we expect to see:
      //   1. localStorage.setItem('authToken', 'tokenB') — manual write from useLogin
      //   2. localStorage.setItem('user', '{"_id":"user-456",...}') — manual write from useLogin
      //   3. Potentially localStorage.setItem('matasree-auth', ...) — Zustand persist
      //
      // The problem: if authStore later updates the token (e.g., token rotation),
      // Zustand persist will update 'matasree-auth', but the flat 'authToken' key
      // remains stale because nothing updates it after the initial useLogin call.
      //
      // This causes the axios interceptor (which reads localStorage.getItem('authToken'))
      // to send stale tokens in subsequent API requests.
      // -----------------------------------------------------------------------

      console.log('All localStorage writes during login:');
      setItemCalls.forEach((call, idx) => {
        console.log(`  ${idx + 1}. setItem('${call[0]}', ...)`);
      });

      // Count how many independent storage locations were written
      const authTokenWrites = setItemCalls.filter((call) => call[0] === 'authToken').length;
      const userWrites = setItemCalls.filter((call) => call[0] === 'user').length;
      const zustandAuthWrites = setItemCalls.filter((call) => call[0] === 'matasree-auth').length;

      console.log(`  authToken writes: ${authTokenWrites}`);
      console.log(`  user writes: ${userWrites}`);
      console.log(`  matasree-auth writes: ${zustandAuthWrites}`);

      // On unfixed code, we expect at least TWO independent storage locations:
      //   1. Flat keys: 'authToken' + 'user'
      //   2. Zustand persist: 'matasree-auth'
      // This creates the potential for desynchronization.

      // EXPECTED: On unfixed code, authTokenWrites should be > 0 (manual write present)
      // EXPECTED: On fixed code, authTokenWrites should be 0 (manual write removed)
      expect(authTokenWrites).toBe(0); // FAILS on unfixed code (will be 1)
    }
  );
});
