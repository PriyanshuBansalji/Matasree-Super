/**
 * Unit Tests — Bug 6 Fix: Double localStorage Write Removal
 *
 * Validates that after the Bug 6 fix:
 * 1. useLogin.onSuccess does NOT write 'authToken' to localStorage directly.
 * 2. useLogin.onSuccess does NOT write 'user' to localStorage directly.
 * 3. useRegister.onSuccess does NOT write 'authToken' to localStorage directly.
 * 4. useLogout.onSuccess STILL calls localStorage.removeItem('authToken') (unchanged).
 * 5. authStore.login() calls localStorage.setItem('authToken', accessToken) exactly once.
 * 6. authStore.register() calls localStorage.setItem('authToken', accessToken) exactly once.
 *
 * The single canonical source of truth for 'authToken' is now authStore.login() /
 * authStore.register(), not the useLogin / useRegister mutation callbacks.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock @/services/api so no real HTTP calls are made.
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

import { useLogin, useLogout, useRegister } from '../useApi';
import { apiClient } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const MOCK_TOKEN = 'test-access-token-abc123';
const MOCK_USER = {
  _id: 'user-001',
  id: 'user-001',
  name: 'Test User',
  email: 'test@example.com',
  role: 'customer' as const,
};

function makeMockLoginResponse(token = MOCK_TOKEN, user = MOCK_USER) {
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
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  localStorage.clear();
});

// ===========================================================================
// GROUP 1: useLogin — no direct localStorage writes after Bug 6 fix
// ===========================================================================

describe('useLogin — no direct localStorage writes (Bug 6 fix)', () => {
  it('useLogin.onSuccess does NOT call localStorage.setItem("authToken", ...)', async () => {
    (apiClient.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeMockLoginResponse(MOCK_TOKEN)
    );

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper(queryClient) });

    act(() => {
      result.current.mutate({ email: 'test@example.com', password: 'password123' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Collect all localStorage.setItem('authToken', ...) calls
    const authTokenWrites = setItemSpy.mock.calls.filter((call) => call[0] === 'authToken');

    // After the Bug 6 fix: useLogin.onSuccess has NO localStorage.setItem('authToken', ...)
    expect(authTokenWrites).toHaveLength(0);

    setItemSpy.mockRestore();
  });

  it('useLogin.onSuccess does NOT call localStorage.setItem("user", ...)', async () => {
    (apiClient.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeMockLoginResponse(MOCK_TOKEN)
    );

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper(queryClient) });

    act(() => {
      result.current.mutate({ email: 'test@example.com', password: 'password123' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Collect all localStorage.setItem('user', ...) calls from useLogin
    const userWrites = setItemSpy.mock.calls.filter((call) => call[0] === 'user');

    // After the Bug 6 fix: useLogin.onSuccess has NO localStorage.setItem('user', ...)
    expect(userWrites).toHaveLength(0);

    setItemSpy.mockRestore();
  });

  it('useLogin mutation still succeeds and reports isSuccess=true', async () => {
    (apiClient.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeMockLoginResponse()
    );

    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper(queryClient) });

    act(() => {
      result.current.mutate({ email: 'test@example.com', password: 'password123' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});

// ===========================================================================
// GROUP 2: useRegister — no direct localStorage writes after Bug 6 fix
// ===========================================================================

describe('useRegister — no direct localStorage writes (Bug 6 fix)', () => {
  it('useRegister.onSuccess does NOT call localStorage.setItem("authToken", ...)', async () => {
    (apiClient.register as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeMockLoginResponse(MOCK_TOKEN)
    );

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useRegister(), { wrapper: makeWrapper(queryClient) });

    act(() => {
      result.current.mutate({ name: 'New User', email: 'new@example.com', password: 'pass123' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Collect all localStorage.setItem('authToken', ...) calls
    const authTokenWrites = setItemSpy.mock.calls.filter((call) => call[0] === 'authToken');

    // After the Bug 6 fix: useRegister.onSuccess has NO localStorage.setItem('authToken', ...)
    expect(authTokenWrites).toHaveLength(0);

    setItemSpy.mockRestore();
  });

  it('useRegister mutation still succeeds and reports isSuccess=true', async () => {
    (apiClient.register as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeMockLoginResponse()
    );

    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useRegister(), { wrapper: makeWrapper(queryClient) });

    act(() => {
      result.current.mutate({ name: 'New User', email: 'new@example.com', password: 'pass123' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.register).toHaveBeenCalledWith({
      name: 'New User',
      email: 'new@example.com',
      password: 'pass123',
    });
  });
});

// ===========================================================================
// GROUP 3: useLogout — localStorage.removeItem('authToken') STILL present (unchanged)
// ===========================================================================

describe('useLogout — localStorage.removeItem("authToken") still called (unchanged)', () => {
  it('useLogout.onSuccess calls localStorage.removeItem("authToken")', async () => {
    localStorage.setItem('authToken', 'tokenToRemove');
    useAuthStore.setState({ token: 'tokenToRemove', isAuthenticated: true, user: MOCK_USER });

    (apiClient.logout as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: {} });

    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useLogout(), { wrapper: makeWrapper(queryClient) });

    act(() => { result.current.mutate(); });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // UNCHANGED BEHAVIOR: useLogout.onSuccess always removes 'authToken'
    const authTokenRemoves = removeItemSpy.mock.calls.filter((call) => call[0] === 'authToken');
    expect(authTokenRemoves).toHaveLength(1);

    // And the key is actually gone from localStorage
    expect(localStorage.getItem('authToken')).toBeNull();

    removeItemSpy.mockRestore();
  });

  it('useLogout.onSuccess also removes "user" from localStorage (unchanged)', async () => {
    localStorage.setItem('authToken', 'tokenToRemove');
    localStorage.setItem('user', JSON.stringify(MOCK_USER));
    useAuthStore.setState({ token: 'tokenToRemove', isAuthenticated: true, user: MOCK_USER });

    (apiClient.logout as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: {} });

    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useLogout(), { wrapper: makeWrapper(queryClient) });

    act(() => { result.current.mutate(); });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(localStorage.getItem('user')).toBeNull();
  });
});

// ===========================================================================
// GROUP 4: authStore.login() — writes localStorage.setItem('authToken') exactly once
// ===========================================================================

describe('authStore.login() — writes authToken flat key exactly once (Bug 6 fix)', () => {
  it('authStore.login() calls localStorage.setItem("authToken", accessToken) exactly once', async () => {
    (apiClient.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeMockLoginResponse(MOCK_TOKEN)
    );

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    await useAuthStore.getState().login('test@example.com', 'password123');

    // Exactly one write of 'authToken' (from authStore.login(), not useLogin.onSuccess)
    const authTokenWrites = setItemSpy.mock.calls.filter(
      (call) => call[0] === 'authToken'
    );
    expect(authTokenWrites).toHaveLength(1);
    expect(authTokenWrites[0][1]).toBe(MOCK_TOKEN);

    setItemSpy.mockRestore();
  });

  it('authStore.login() writes the correct token value to localStorage', async () => {
    const uniqueToken = 'unique-token-xyz789';
    (apiClient.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeMockLoginResponse(uniqueToken)
    );

    await useAuthStore.getState().login('test@example.com', 'password123');

    expect(localStorage.getItem('authToken')).toBe(uniqueToken);
  });

  it('authStore.login() sets Zustand state AND localStorage to the same token value', async () => {
    (apiClient.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeMockLoginResponse(MOCK_TOKEN)
    );

    await useAuthStore.getState().login('test@example.com', 'password123');

    // Single source of truth: both Zustand state and flat key hold the same token
    expect(useAuthStore.getState().token).toBe(MOCK_TOKEN);
    expect(localStorage.getItem('authToken')).toBe(MOCK_TOKEN);
  });

  it('authStore.login() does NOT write authToken to localStorage on error', async () => {
    (apiClient.login as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Invalid credentials')
    );

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    try {
      await useAuthStore.getState().login('bad@example.com', 'wrongpass');
    } catch {
      // expected
    }

    const authTokenWrites = setItemSpy.mock.calls.filter((call) => call[0] === 'authToken');
    expect(authTokenWrites).toHaveLength(0);

    setItemSpy.mockRestore();
  });
});

// ===========================================================================
// GROUP 5: authStore.register() — writes localStorage.setItem('authToken') exactly once
// ===========================================================================

describe('authStore.register() — writes authToken flat key exactly once (Bug 6 fix)', () => {
  it('authStore.register() calls localStorage.setItem("authToken", accessToken) exactly once', async () => {
    (apiClient.register as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeMockLoginResponse(MOCK_TOKEN)
    );

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    await useAuthStore.getState().register('New User', 'new@example.com', 'password123');

    const authTokenWrites = setItemSpy.mock.calls.filter(
      (call) => call[0] === 'authToken'
    );
    expect(authTokenWrites).toHaveLength(1);
    expect(authTokenWrites[0][1]).toBe(MOCK_TOKEN);

    setItemSpy.mockRestore();
  });

  it('authStore.register() writes the correct token value to localStorage', async () => {
    const uniqueToken = 'register-token-abc456';
    (apiClient.register as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeMockLoginResponse(uniqueToken)
    );

    await useAuthStore.getState().register('New User', 'new@example.com', 'password123');

    expect(localStorage.getItem('authToken')).toBe(uniqueToken);
  });

  it('authStore.register() sets Zustand state AND localStorage to the same token value', async () => {
    (apiClient.register as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeMockLoginResponse(MOCK_TOKEN)
    );

    await useAuthStore.getState().register('New User', 'new@example.com', 'password123');

    expect(useAuthStore.getState().token).toBe(MOCK_TOKEN);
    expect(localStorage.getItem('authToken')).toBe(MOCK_TOKEN);
  });

  it('authStore.register() does NOT write authToken to localStorage on error', async () => {
    (apiClient.register as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Email already exists')
    );

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    try {
      await useAuthStore.getState().register('User', 'exists@example.com', 'pass123');
    } catch {
      // expected
    }

    const authTokenWrites = setItemSpy.mock.calls.filter((call) => call[0] === 'authToken');
    expect(authTokenWrites).toHaveLength(0);

    setItemSpy.mockRestore();
  });
});
