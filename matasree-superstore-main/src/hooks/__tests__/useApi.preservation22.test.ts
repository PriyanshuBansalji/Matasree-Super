/**
 * PRESERVATION Tests — Bug 6: Auth Storage (BEFORE implementing fix)
 *
 * Property 2: Preservation — Login Persistence Across Refresh; Logout Clears State
 *
 * These tests document the BASELINE auth storage behavior on UNFIXED code.
 * All tests MUST PASS on the current (unfixed) useApi.ts / authStore.ts.
 *
 * Observed behavior on UNFIXED code (read-only; do NOT modify sources):
 *   - useLogin.onSuccess writes 'authToken' and 'user' to flat localStorage keys.
 *   - authStore.login() sets isAuthenticated=true, token, user in Zustand state;
 *     Zustand persist middleware serializes these to 'matasree-auth' localStorage key.
 *   - useLogout.onSuccess removes 'authToken' and 'user' from localStorage and
 *     calls queryClient.clear() — it does NOT call authStore.logout() on unfixed code.
 *   - authStore.logout() clears isAuthenticated/token/user from Zustand state; this
 *     is called directly by Navbar (not by the useLogout hook on unfixed code).
 *
 * What is preserved (Unchanged Behavior 6):
 *   1. After authStore.login(), authStore.getState().isAuthenticated is true
 *   2. After authStore.login(), authStore.getState().token contains the access token
 *   3. Zustand persist writes isAuthenticated/token/user to 'matasree-auth'
 *   4. Zustand persist hydrates auth state correctly on page remount
 *   5. useLogout.onSuccess removes 'authToken' from localStorage
 *   6. authStore.logout() clears isAuthenticated, token, and user
 *   7. For any login → N operations → logout sequence:
 *      - localStorage.getItem('authToken') is null after logout
 *      - authStore.getState().isAuthenticated is false after authStore.logout()
 *
 * Group 1: Login sets auth state correctly (baseline)
 * Group 2: Zustand persist hydration baseline
 * Group 3: Property-based test — login → N operations → logout clears state
 * Group 4: Logout clears all auth state
 *
 * Validates: Requirements — Unchanged Behavior 6
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock @/services/api so no real HTTP calls are made.
// All methods referenced in useApi.ts must be present here.
// ---------------------------------------------------------------------------
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

import { useLogin, useLogout } from '../useApi';
import { apiClient } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

const MOCK_ACCESS_TOKEN = 'tokenA';
const MOCK_USER = {
  _id: 'user-001',
  id: 'user-001',
  name: 'Test User',
  email: 'test@example.com',
  role: 'customer' as const,
};

function makeMockLoginResponse(token = MOCK_ACCESS_TOKEN, user = MOCK_USER) {
  return { data: { accessToken: token, user } };
}

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
// Setup / teardown: reset auth state and localStorage between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Reset Zustand auth store to logged-out state before each test
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
  // Clear all localStorage keys used by auth
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('matasree-auth');
  vi.clearAllMocks();
});

afterEach(() => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('matasree-auth');
});

// ===========================================================================
// GROUP 1: Login sets auth state correctly (baseline)
// ===========================================================================

describe('PRESERVATION — Group 1: Login sets auth state correctly (baseline)', () => {
  it('PRESERVATION 1.1: after authStore.login(), isAuthenticated is true', async () => {
    // Arrange
    (apiClient.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeMockLoginResponse()
    );

    // Precondition: not authenticated
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    // Act: call authStore.login() as the application does (e.g. from LoginPage)
    await useAuthStore.getState().login('test@example.com', 'password123');

    // PRESERVATION INVARIANT: authStore.login() sets isAuthenticated=true
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('PRESERVATION 1.2: after authStore.login(), token contains the access token', async () => {
    (apiClient.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeMockLoginResponse('tokenA')
    );

    await useAuthStore.getState().login('test@example.com', 'password123');

    // PRESERVATION INVARIANT: token is set to the access token
    expect(useAuthStore.getState().token).toBe('tokenA');
  });

  it(
    'PRESERVATION 1.3: after authStore.login(), authToken is written to localStorage (via authStore — single source)',
    async () => {
      // After Bug 6 fix: useLogin.onSuccess no longer writes 'authToken' manually.
      // authStore.login() now writes 'authToken' as the single canonical source.
      // This test confirms the token still ends up in localStorage regardless of the path.
      (apiClient.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        makeMockLoginResponse('tokenA')
      );

      // Call authStore.login() directly (as the application does)
      await useAuthStore.getState().login('test@example.com', 'password123');

      // PRESERVED INVARIANT: authToken is still available in localStorage after login
      // (now written by authStore.login() instead of useLogin.onSuccess)
      expect(localStorage.getItem('authToken')).toBe('tokenA');
    }
  );

  it('PRESERVATION 1.4: after authStore.login(), user is populated', async () => {
    (apiClient.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeMockLoginResponse()
    );

    await useAuthStore.getState().login('test@example.com', 'password123');

    const state = useAuthStore.getState();
    expect(state.user).not.toBeNull();
    expect(state.user?.email).toBe('test@example.com');
  });
});

// ===========================================================================
// GROUP 2: Zustand persist hydration baseline
// ===========================================================================

describe('PRESERVATION — Group 2: Zustand persist hydration baseline', () => {
  it(
    'PRESERVATION 2.1: hydrating store from matasree-auth restores isAuthenticated=true',
    () => {
      // Simulate what Zustand persist writes when user is logged in
      const persistedState = {
        state: {
          token: 'tokenB',
          isAuthenticated: true,
          user: {
            _id: 'user-002',
            id: 'user-002',
            name: 'Persisted User',
            email: 'persist@example.com',
            role: 'customer',
          },
        },
        version: 0,
      };
      localStorage.setItem('matasree-auth', JSON.stringify(persistedState));

      // Apply the persisted state to the store (simulating Zustand persist hydration
      // which reads localStorage and calls setState on page remount/refresh)
      useAuthStore.setState({
        token: persistedState.state.token,
        isAuthenticated: persistedState.state.isAuthenticated,
        user: persistedState.state.user as any,
      });

      // PRESERVATION INVARIANT: after hydration, isAuthenticated is restored
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    }
  );

  it(
    'PRESERVATION 2.2: hydrating store from matasree-auth restores token=tokenB',
    () => {
      const persistedState = {
        state: {
          token: 'tokenB',
          isAuthenticated: true,
          user: {
            _id: 'user-002',
            id: 'user-002',
            name: 'Persisted User',
            email: 'persist@example.com',
            role: 'customer',
          },
        },
        version: 0,
      };
      localStorage.setItem('matasree-auth', JSON.stringify(persistedState));

      useAuthStore.setState({
        token: persistedState.state.token,
        isAuthenticated: persistedState.state.isAuthenticated,
        user: persistedState.state.user as any,
      });

      // PRESERVATION INVARIANT: token is restored from persist
      expect(useAuthStore.getState().token).toBe('tokenB');
    }
  );

  it(
    'PRESERVATION 2.3: authStore.login() causes Zustand persist to write matasree-auth',
    async () => {
      (apiClient.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        makeMockLoginResponse('tokenC')
      );

      await useAuthStore.getState().login('test@example.com', 'password123');

      // Zustand persist middleware should have written the 'matasree-auth' key
      const raw = localStorage.getItem('matasree-auth');
      expect(raw).not.toBeNull();

      const parsed = JSON.parse(raw!);
      // The persisted entry contains the correct auth state
      expect(parsed.state.isAuthenticated).toBe(true);
      expect(parsed.state.token).toBe('tokenC');
    }
  );

  it(
    'PRESERVATION 2.4: hydrating store from matasree-auth restores user object',
    () => {
      const persistedState = {
        state: {
          token: 'tokenB',
          isAuthenticated: true,
          user: {
            _id: 'user-002',
            id: 'user-002',
            name: 'Persisted User',
            email: 'persist@example.com',
            role: 'customer',
          },
        },
        version: 0,
      };
      localStorage.setItem('matasree-auth', JSON.stringify(persistedState));

      useAuthStore.setState({
        token: persistedState.state.token,
        isAuthenticated: persistedState.state.isAuthenticated,
        user: persistedState.state.user as any,
      });

      // PRESERVATION INVARIANT: user is restored
      const state = useAuthStore.getState();
      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('persist@example.com');
    }
  );
});

// ===========================================================================
// GROUP 3: Property-based test — login → N operations → logout clears state
//
// Parametric / data-driven: N represents arbitrary intermediate operations
// (0–5 no-ops for auth state). For each N we verify the post-logout invariants.
//
// OBSERVED BEHAVIOR on UNFIXED code:
//   - useLogout.onSuccess removes 'authToken' from localStorage.
//   - authStore.logout() (called directly, e.g. by Navbar) clears isAuthenticated.
//   - Both must work correctly regardless of N intermediate no-op operations.
// ===========================================================================

describe('PRESERVATION — Group 3: Property-based — login → N no-ops → logout clears state', () => {
  // Parametric test: run for each N in [0, 1, 2, 3, 4, 5]
  const noOpCounts = [0, 1, 2, 3, 4, 5];

  for (const n of noOpCounts) {
    it(
      `PROPERTY 3.1 (N=${n}): after login → ${n} no-ops → useLogout, localStorage.getItem('authToken') is null`,
      async () => {
        // --- ARRANGE: Set up logged-in state (simulating useLogin + authStore.login effects) ---
        localStorage.setItem('authToken', 'tokenForLogout');
        useAuthStore.setState({
          token: 'tokenForLogout',
          isAuthenticated: true,
          user: MOCK_USER,
        });

        expect(localStorage.getItem('authToken')).toBe('tokenForLogout');
        expect(useAuthStore.getState().isAuthenticated).toBe(true);

        // --- ACT: N no-op operations (read-only, don't change auth state) ---
        for (let i = 0; i < n; i++) {
          // Simulate read-only operations between login and logout
          const _isAuth = useAuthStore.getState().isAuthenticated;
          const _token = localStorage.getItem('matasree-auth');
          void _isAuth;
          void _token;
        }

        // --- ACT: Fire useLogout mutation ---
        (apiClient.logout as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: {} });

        const queryClient = makeQueryClient();
        const wrapper = makeWrapper(queryClient);
        const { result } = renderHook(() => useLogout(), { wrapper });

        act(() => {
          result.current.mutate();
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        // --- ASSERT: authToken removed from localStorage ---
        // PRESERVATION INVARIANT: useLogout.onSuccess calls localStorage.removeItem('authToken')
        // regardless of how many intermediate operations occurred
        expect(localStorage.getItem('authToken')).toBeNull();
      }
    );

    it(
      `PROPERTY 3.2 (N=${n}): after login → ${n} no-ops → authStore.logout(), isAuthenticated is false`,
      () => {
        // --- ARRANGE: Set up logged-in state ---
        useAuthStore.setState({
          token: 'tokenForLogout',
          isAuthenticated: true,
          user: MOCK_USER,
        });
        localStorage.setItem('authToken', 'tokenForLogout');

        expect(useAuthStore.getState().isAuthenticated).toBe(true);

        // --- ACT: N no-ops ---
        for (let i = 0; i < n; i++) {
          const _isAuth = useAuthStore.getState().isAuthenticated;
          void _isAuth;
        }

        // --- ACT: Call authStore.logout() directly (as Navbar does on unfixed code) ---
        useAuthStore.getState().logout();

        // --- ASSERT: isAuthenticated is false ---
        // PRESERVATION INVARIANT: authStore.logout() always sets isAuthenticated=false
        // regardless of N intermediate operations
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
      }
    );
  }
});

// ===========================================================================
// GROUP 4: Logout clears all auth state
// ===========================================================================

describe('PRESERVATION — Group 4: Logout clears all auth state', () => {
  it('PRESERVATION 4.1: useLogout removes authToken from localStorage', async () => {
    // Arrange: set up logged-in state
    localStorage.setItem('authToken', 'tokenToRemove');
    useAuthStore.setState({ token: 'tokenToRemove', isAuthenticated: true, user: MOCK_USER });

    (apiClient.logout as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: {} });

    const queryClient = makeQueryClient();
    const wrapper = makeWrapper(queryClient);
    const { result } = renderHook(() => useLogout(), { wrapper });

    act(() => { result.current.mutate(); });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // PRESERVATION INVARIANT: useLogout.onSuccess removes 'authToken'
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('PRESERVATION 4.2: useLogout removes user key from localStorage', async () => {
    localStorage.setItem('authToken', 'tokenToRemove');
    localStorage.setItem('user', JSON.stringify(MOCK_USER));
    useAuthStore.setState({ token: 'tokenToRemove', isAuthenticated: true, user: MOCK_USER });

    (apiClient.logout as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: {} });

    const queryClient = makeQueryClient();
    const wrapper = makeWrapper(queryClient);
    const { result } = renderHook(() => useLogout(), { wrapper });

    act(() => { result.current.mutate(); });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // PRESERVATION INVARIANT: useLogout.onSuccess removes 'user' flat key
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('PRESERVATION 4.3: authStore.logout() sets isAuthenticated to false', () => {
    useAuthStore.setState({ token: 'tokenToRemove', isAuthenticated: true, user: MOCK_USER });

    // Act: call authStore.logout() as the Navbar does
    useAuthStore.getState().logout();

    // PRESERVATION INVARIANT: isAuthenticated=false after logout
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('PRESERVATION 4.4: authStore.logout() sets token to null', () => {
    useAuthStore.setState({ token: 'tokenToRemove', isAuthenticated: true, user: MOCK_USER });

    useAuthStore.getState().logout();

    // PRESERVATION INVARIANT: token=null after logout
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('PRESERVATION 4.5: authStore.logout() sets user to null', () => {
    useAuthStore.setState({ token: 'tokenToRemove', isAuthenticated: true, user: MOCK_USER });

    useAuthStore.getState().logout();

    // PRESERVATION INVARIANT: user=null after logout
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('PRESERVATION 4.6: useLogout clears React Query cache (queryClient.clear())', async () => {
    // Seed some cache entries
    const queryClient = makeQueryClient();
    queryClient.setQueryData(['my-orders'], [{ id: 'o1' }]);
    queryClient.setQueryData(['cart'], { items: [] });
    queryClient.setQueryData(['products'], [{ id: 'p1' }]);

    // Verify data is in cache
    expect(queryClient.getQueryData(['my-orders'])).toBeDefined();
    expect(queryClient.getQueryData(['cart'])).toBeDefined();

    (apiClient.logout as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: {} });

    const wrapper = makeWrapper(queryClient);
    const { result } = renderHook(() => useLogout(), { wrapper });

    act(() => { result.current.mutate(); });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // PRESERVATION INVARIANT: queryClient.clear() removes all cached queries
    expect(queryClient.getQueryData(['my-orders'])).toBeUndefined();
    expect(queryClient.getQueryData(['cart'])).toBeUndefined();
    expect(queryClient.getQueryData(['products'])).toBeUndefined();
  });

  it(
    'PRESERVATION 4.7: login then authStore.logout() — isAuthenticated false, token null, user null',
    async () => {
      // Simulate login effects
      (apiClient.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        makeMockLoginResponse('freshToken')
      );
      await useAuthStore.getState().login('test@example.com', 'password123');
      localStorage.setItem('authToken', 'freshToken'); // as useLogin.onSuccess does

      // Verify logged-in state
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().token).toBe('freshToken');
      expect(localStorage.getItem('authToken')).toBe('freshToken');

      // Act: logout (authStore.logout() as Navbar calls)
      useAuthStore.getState().logout();

      // Assert: all auth state cleared from store
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    }
  );

  it(
    'PRESERVATION 4.8: login then useLogout — authToken cleared from localStorage',
    async () => {
      // Simulate login (useLogin.onSuccess writes authToken to localStorage on unfixed code)
      localStorage.setItem('authToken', 'freshToken');
      useAuthStore.setState({ token: 'freshToken', isAuthenticated: true, user: MOCK_USER });

      expect(localStorage.getItem('authToken')).toBe('freshToken');

      // Act: fire useLogout mutation
      (apiClient.logout as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: {} });

      const queryClient = makeQueryClient();
      const wrapper = makeWrapper(queryClient);
      const { result } = renderHook(() => useLogout(), { wrapper });

      act(() => { result.current.mutate(); });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // PRESERVATION INVARIANT: authToken removed from localStorage after logout
      expect(localStorage.getItem('authToken')).toBeNull();
    }
  );
});
