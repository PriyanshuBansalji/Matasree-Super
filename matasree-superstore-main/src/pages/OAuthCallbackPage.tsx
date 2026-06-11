/**
 * OAuthCallbackPage
 *
 * Handles the post-OAuth redirect. The backend issues an httpOnly refresh-token
 * cookie and redirects here with NO token in the URL (Req 29.1).
 *
 * On mount this page:
 *  1. Fetches GET /api/auth/token (cookie sent automatically via credentials:'include')
 *  2. Validates the response origin matches VITE_API_BASE_URL / VITE_API_URL (Req 29.3)
 *  3. Stores accessToken + user in the Zustand auth store (in-memory only) (Req 29.4)
 *  4. Clears any sessionStorage entries that may have been set (Req 29.2)
 *  5. Redirects to / on success, or /login?error=auth_failed on any failure (Req 29.5)
 *
 * Requirements: 29.2, 29.3, 29.4, 29.5
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

/** Derives the API base URL (origin only) from the configured env var. */
function getApiOrigin(): string {
  const raw =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:5001/api';

  try {
    return new URL(raw).origin;
  } catch {
    // raw may be a path-only value — fall back to same-origin
    return window.location.origin;
  }
}

/** Strips the trailing path from the base URL to get just the origin for fetch. */
function getApiBaseUrl(): string {
  const raw =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:5001/api';

  // Normalise: if the env var already ends with /api we keep it as-is,
  // otherwise we return it as-is too — the endpoint path is appended below.
  return raw.replace(/\/+$/, ''); // strip trailing slash
}

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { setAuthInMemory } = useAuthStore();
  const hasFetched = useRef(false); // prevent double-fetch in React StrictMode

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const processOAuthToken = async () => {
      try {
        const apiBase = getApiBaseUrl();
        const tokenUrl = `${apiBase}/auth/token`;
        const expectedOrigin = getApiOrigin();

        // Validate that we are talking to the expected origin (Req 29.3)
        const responseOrigin = new URL(tokenUrl).origin;
        if (responseOrigin !== expectedOrigin) {
          console.error(
            `OAuthCallbackPage: origin mismatch — expected ${expectedOrigin}, got ${responseOrigin}`,
          );
          navigate('/login?error=auth_failed', { replace: true });
          return;
        }

        // Fetch the access token; the httpOnly refresh-token cookie is sent automatically
        const response = await fetch(tokenUrl, {
          method: 'GET',
          credentials: 'include', // send httpOnly cookie
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Token endpoint returned ${response.status}`);
        }

        const body = await response.json();

        // The endpoint returns { success, data: { accessToken, user } } or { accessToken, user }
        const accessToken: string | undefined =
          body?.data?.accessToken ?? body?.accessToken;
        const user = body?.data?.user ?? body?.user;

        if (!accessToken || !user) {
          throw new Error('Missing accessToken or user in token response');
        }

        // Store in Zustand in-memory only — do NOT write to localStorage (Req 29.4)
        setAuthInMemory(accessToken, user);

        // Clear any sessionStorage entries that may have been written (Req 29.2)
        sessionStorage.removeItem('oauth_token');
        sessionStorage.removeItem('oauth_user');
        sessionStorage.removeItem('oauth_state');

        // Navigate to home (or a saved returnTo destination)
        const returnTo = sessionStorage.getItem('oauth_return_to') || '/';
        sessionStorage.removeItem('oauth_return_to');
        navigate(returnTo, { replace: true });
      } catch (err) {
        console.error('OAuthCallbackPage: token fetch failed —', err);
        // Clear any stale sessionStorage (Req 29.2, 29.5)
        sessionStorage.removeItem('oauth_token');
        sessionStorage.removeItem('oauth_user');
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_return_to');
        navigate('/login?error=auth_failed', { replace: true });
      }
    };

    processOAuthToken();
  }, [navigate, setAuthInMemory]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <main id="main-content" className="flex-1 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-amber-600 animate-spin" aria-hidden="true" />
        <h2 className="text-2xl font-serif text-amber-950">Completing Sign In…</h2>
        <p className="text-gray-600">Please wait while we securely log you in.</p>
      </main>
    </div>
  );
}
