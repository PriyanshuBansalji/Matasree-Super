import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { setToken, setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processOAuthLogin = () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('token');
        const userDataStr = searchParams.get('user');

        if (token && userDataStr) {
          const user = JSON.parse(decodeURIComponent(userDataStr));
          
          // Set in store (which also saves to localStorage via persist)
          setToken(token);
          setUser(user);
          
          // Complete login
          useAuthStore.setState({ isAuthenticated: true, error: null });

          toast({
            title: "Success",
            description: `Welcome back, ${user.name}!`,
          });
          
          navigate('/profile', { replace: true });
        } else {
          throw new Error('Missing authentication data');
        }
      } catch (err: any) {
        console.error('OAuth processing error:', err);
        setError("Failed to complete authentication. Please try again.");
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    processOAuthLogin();
  }, [location, navigate, setToken, setUser, toast]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-xl font-semibold">Authentication Error</div>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-4">
      <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />
      <h2 className="text-2xl font-serif text-amber-950">Completing Sign In...</h2>
      <p className="text-gray-600">Please wait while we securely log you in.</p>
    </div>
  );
}
