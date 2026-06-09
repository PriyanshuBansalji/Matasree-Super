import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Loader2, Eye, EyeOff, AlertCircle, CheckCircle, Github } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  // Track which OAuth providers are configured on the backend
  const [oauthStatus, setOauthStatus] = useState<{ google: boolean; github: boolean }>(
    { google: true, github: true } // optimistic default; updated after fetch
  );

  useEffect(() => {
    apiClient.get('/auth/oauth-status')
      .then((res: any) => {
        if (res?.data) setOauthStatus(res.data);
      })
      .catch(() => {
        // If the check fails, keep buttons visible (fallback to server error handling)
      });
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Real-time validation
    if (touched[name as keyof typeof touched]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    validateField(name, formData[name as keyof typeof formData]);
  };

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    
    if (name === 'email') {
      if (!value) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(value)) {
        newErrors.email = 'Please enter a valid email address';
      } else {
        delete newErrors.email;
      }
    }
    
    if (name === 'password') {
      if (!value) {
        newErrors.password = 'Password is required';
      } else if (value.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      } else {
        delete newErrors.password;
      }
    }
    
    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched for validation
    setTouched({ email: true, password: true });

    // Final validation
    if (!formData.email || !formData.password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (!validateEmail(formData.email)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    try {
      await login(formData.email, formData.password);
      
      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message || 'An error occurred during login',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-amber-100/30 to-orange-100/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-red-100/20 to-orange-100/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center relative z-10">
        <Card className="w-full max-w-md shadow-2xl backdrop-blur-sm border border-white/50">
          <CardHeader className="space-y-2 bg-gradient-to-br from-amber-50 to-orange-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-serif">Welcome Back</CardTitle>
            <CardDescription className="text-base">
              Sign in to your account to continue shopping premium spices
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8">
            {/* Show auth error if any */}
            {new URLSearchParams(location.search).get('error') && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>
                  {new URLSearchParams(location.search).get('error') === 'google_auth_failed'
                    ? "Google authentication failed. Please try again or use email."
                    : new URLSearchParams(location.search).get('error') === 'github_auth_failed'
                    ? "GitHub authentication failed. Please try again or use email."
                    : "Authentication failed. Please try again."}
                </span>
              </div>
            )}
            
            {/* Show session expired if any */}
            {new URLSearchParams(location.search).get('session_expired') && (
              <div className="mb-6 p-4 bg-amber-50 text-amber-700 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>Your session has expired. Please log in again to continue.</span>
              </div>
            )}

            {/* OAuth Buttons */}
            {(oauthStatus.google || oauthStatus.github) && (
              <div className="flex flex-col gap-3 mb-6">
                {oauthStatus.google && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full py-6 text-base font-semibold border-2 hover:bg-slate-50 relative flex items-center justify-center gap-3 transition-all hover:border-amber-400"
                    onClick={() => window.location.href = `${apiClient.getBaseUrl()}/api/auth/google`}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </Button>
                )}

                {oauthStatus.github && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full py-6 text-base font-semibold border-2 hover:bg-slate-50 relative flex items-center justify-center gap-3 transition-all hover:border-amber-400"
                    onClick={() => window.location.href = `${apiClient.getBaseUrl()}/api/auth/github`}
                  >
                    <Github className="w-5 h-5" />
                    Continue with GitHub
                  </Button>
                )}
              </div>
            )}

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 rounded-full border border-gray-200 shadow-sm z-10 w-fit shrink-0 backdrop-blur-md">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  Email Address
                  {touched.email && !errors.email && <CheckCircle className="w-4 h-4 text-green-500" />}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`pl-12 py-6 border-2 transition-all ${
                      touched.email && errors.email
                        ? 'border-red-500 bg-red-50'
                        : touched.email && !errors.email
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {touched.email && errors.email && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  Password
                  {touched.password && !errors.password && <CheckCircle className="w-4 h-4 text-green-500" />}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`pl-12 pr-12 py-6 border-2 transition-all ${
                      touched.password && errors.password
                        ? 'border-red-500 bg-red-50'
                        : touched.password && !errors.password
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </div>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-600"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full py-6 text-base font-semibold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg transition-all hover:shadow-lg disabled:opacity-70"
                disabled={isLoading || (touched.email && !!errors.email) || (touched.password && !!errors.password)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              {/* Sign Up Link */}
              <div className="text-center text-sm pt-4 border-t border-gray-200">
                <span className="text-gray-600">Don't have an account? </span>
                <Link to="/register" className="text-amber-600 hover:text-amber-700 font-semibold hover:underline">
                  Sign up here
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;
