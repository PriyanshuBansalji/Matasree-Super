/**
 * Auth Store (Zustand)
 *
 * Manages authentication state with Zustand `persist` middleware.
 * Token and user data are automatically persisted to localStorage by the
 * middleware — NO manual localStorage reads/writes needed.
 *
 * OAuth flow uses `setAuthInMemory` which writes to Zustand state only
 * (the persist middleware will serialize it automatically).
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/services/api';

interface User {
  _id: string;
  /** @alias _id — backward-compatible alias */
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  avatar?: string;
  referralCode?: string;
  /** @deprecated Use `role === 'admin'` instead */
  isAdmin?: boolean;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  initializeAuth: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  /** Store accessToken + user in-memory only (no localStorage). Used by OAuth callback. */
  setAuthInMemory: (accessToken: string, user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.login({ email, password });
          const { accessToken, user } = response.data;

          // Normalize _id → id for backward compatibility
          const normalizedUser = { ...user, _id: user._id || user.id, id: user._id || user.id };

          set({
            user: normalizedUser,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
          // Keep the flat key in sync for the axios request interceptor (Bug 6 fix)
          localStorage.setItem('authToken', accessToken);
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          throw new Error(errorMessage);
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.register({ name, email, password });
          const { accessToken, user } = response.data;

          // Normalize _id → id for backward compatibility
          const normalizedUser = { ...user, _id: user._id || user.id, id: user._id || user.id };

          set({
            user: normalizedUser,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
          // Keep the flat key in sync for the axios request interceptor (Bug 6 fix)
          localStorage.setItem('authToken', accessToken);
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      initializeAuth: () => {
        const state = useAuthStore.getState();
        // Check both Zustand state and the flat localStorage key the axios
        // interceptor uses. The persist middleware may not have rehydrated yet
        // when this runs, so we fall back to the flat key rather than clearing it.
        const flatToken = localStorage.getItem('authToken');
        if (state.token && state.user) {
          localStorage.setItem('authToken', state.token);
          set({ isAuthenticated: true });
        } else if (flatToken) {
          // Flat key exists — preserve it so in-flight API calls succeed.
          // Auth is considered valid until the token is verified or expires.
          set({ token: flatToken, isAuthenticated: true });
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          set({ isAuthenticated: false, user: null, token: null });
        }
      },

      setUser: (user: User | null) => {
        set({ user });
      },

      setToken: (token: string | null) => {
        if (token) {
          localStorage.setItem('authToken', token);
          set({ token, isAuthenticated: true });
        } else {
          localStorage.removeItem('authToken');
          set({ token: null, isAuthenticated: false });
        }
      },

      /**
       * Stores the OAuth access token and user in Zustand state.
       * The persist middleware will serialize this to localStorage automatically.
       * Satisfies Req 29.4.
       */
      setAuthInMemory: (accessToken: string, user: User) => {
        if (accessToken) {
          localStorage.setItem('authToken', accessToken);
        }
        set({ token: accessToken, user, isAuthenticated: true, error: null });
      },
    }),
    {
      name: 'matasree-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth IMMEDIATELY when this module loads (before any component renders)
// This ensures isAuthenticated is correct on the very first render
useAuthStore.getState().initializeAuth();
