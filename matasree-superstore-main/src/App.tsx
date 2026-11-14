import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { HelmetProvider } from "react-helmet-async";
import { useAuthStore } from "./store/authStore";
import { useCartStore } from "./store/cartStore";
import { useWishlistStore } from "./store/wishlistStore";
import { apiClient } from "./services/api";
import { Loader2 } from "lucide-react";

// Synchronous imports for critical wrappers
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { WhatsAppFAB } from "./components/WhatsAppButton";
import PageTransition from "./components/PageTransition";
import ComparisonTrayComponent from "./components/ComparisonTray";
import ExitIntentModalComponent from "./components/ExitIntentModal";

// Lazy-loaded Pages (Code Splitting)
const Index = lazy(() => import("./pages/Index"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ProductDetailsPage = lazy(() => import("./pages/ProductDetailsPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage"));
const AddressesPage = lazy(() => import("./pages/AddressesPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const AdminProductForm = lazy(() => import("./pages/AdminProductForm"));
const AdminCategories = lazy(() => import("./pages/AdminCategories"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminBanners = lazy(() => import('./pages/AdminBanners'));
const AdminRecipes = lazy(() => import('./pages/AdminRecipes'));
const AdminCoupons = lazy(() => import('./pages/AdminCoupons'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const PaymentFailedPage = lazy(() => import('./pages/PaymentFailedPage'));
const PartnershipPage = lazy(() => import("./pages/PartnershipPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const RefundPolicyPage = lazy(() => import("./pages/RefundPolicyPage"));
const OAuthCallbackPage = lazy(() => import("./pages/OAuthCallbackPage"));
const RecipesPage = lazy(() => import("./pages/RecipesPage"));
const SpiceGuidePage = lazy(() => import("./pages/SpiceGuidePage"));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Full page loading spinner
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-brand-cream">
    <Loader2 className="w-10 h-10 animate-spin text-brand-chili" />
  </div>
);

/**
 * GlobalModals
 *
 * Inner component that mounts exit-intent and other global modals.
 * Must be a child of BrowserRouter so useLocation works correctly.
 */
const GlobalModals = () => {
  // Exit intent modal disabled — set active={false} to hide popup
  return <ExitIntentModalComponent active={false} />;
};

/**
 * AppRoutes
 *
 * Inner component that renders all routes inside AnimatePresence.
 * Must be a child of BrowserRouter so useLocation works correctly.
 */
const AppRoutes = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setCartOpen } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const { setItems: setWishlistItems } = useWishlistStore();

  // Sync wishlist from backend on app load (Phase 1, Req 6.1)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const syncWishlist = async () => {
      try {
        const response: any = await apiClient.getWishlist();
        const backendItems = (response?.data?.items ?? []).map((entry: any) => ({
          id: entry.productId,
          name: entry.product?.name ?? '',
          price: entry.product?.price ?? 0,
          image: entry.product?.image ?? '',
          category: entry.product?.category,
          rating: entry.product?.rating,
        }));
        setWishlistItems(backendItems);
      } catch (err) {
        // Silently catch errors
      }
    };

    syncWishlist();
  }, [isAuthenticated, user?.id, setWishlistItems]);

  // Handle ?open_cart=1 from cart abandonment emails
  useEffect(() => {
    if (searchParams.get('open_cart') === '1') {
      setCartOpen(true);
      // Remove the param from URL without re-navigating
      const next = new URLSearchParams(searchParams);
      next.delete('open_cart');
      setSearchParams(next, { replace: true });
    }
  }, []);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/products" element={<PageTransition><ProductsPage /></PageTransition>} />
        <Route path="/product/:id" element={<PageTransition><ProductDetailsPage /></PageTransition>} />
        <Route path="/categories" element={<PageTransition><CategoriesPage /></PageTransition>} />
        <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
        <Route path="/partnership" element={<PageTransition><PartnershipPage /></PageTransition>} />
        <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicyPage /></PageTransition>} />
        <Route path="/terms-of-service" element={<PageTransition><TermsOfServicePage /></PageTransition>} />
        <Route path="/refund-policy" element={<PageTransition><RefundPolicyPage /></PageTransition>} />
        <Route path="/recipes" element={<PageTransition><RecipesPage /></PageTransition>} />
        <Route path="/spice-guide" element={<PageTransition><SpiceGuidePage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
        <Route path="/auth/callback" element={<PageTransition><OAuthCallbackPage /></PageTransition>} />

        {/* Protected Routes */}
        <Route path="/profile" element={<ProtectedRoute><PageTransition><ProfilePage /></PageTransition></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><PageTransition><OrdersPage /></PageTransition></ProtectedRoute>} />
        <Route path="/order/:id" element={<ProtectedRoute><PageTransition><OrderDetailPage /></PageTransition></ProtectedRoute>} />
        <Route path="/order-success" element={<PageTransition><OrderSuccessPage /></PageTransition>} />
        <Route path="/order-success/:orderId" element={<PageTransition><OrderSuccessPage /></PageTransition>} />
        <Route path="/payment-failed" element={<ProtectedRoute><PageTransition><PaymentFailedPage /></PageTransition></ProtectedRoute>} />
        <Route path="/addresses" element={<ProtectedRoute><PageTransition><AddressesPage /></PageTransition></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><PageTransition><CheckoutPage /></PageTransition></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><PageTransition><WishlistPage /></PageTransition></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminRoute><PageTransition><AdminDashboard /></PageTransition></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><PageTransition><AdminUsers /></PageTransition></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><PageTransition><AdminProducts /></PageTransition></AdminRoute>} />
        <Route path="/admin/products/new" element={<AdminRoute><PageTransition><AdminProductForm /></PageTransition></AdminRoute>} />
        <Route path="/admin/products/:id/edit" element={<AdminRoute><PageTransition><AdminProductForm /></PageTransition></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><PageTransition><AdminCategories /></PageTransition></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><PageTransition><AdminOrders /></PageTransition></AdminRoute>} />
        <Route path="/admin/banners" element={<AdminRoute><PageTransition><AdminBanners /></PageTransition></AdminRoute>} />
        <Route path="/admin/recipes" element={<AdminRoute><PageTransition><AdminRecipes /></PageTransition></AdminRoute>} />
        <Route path="/admin/coupons" element={<AdminRoute><PageTransition><AdminCoupons /></PageTransition></AdminRoute>} />

        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize auth from localStorage on app load
    initializeAuth();
  }, [initializeAuth]);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {/* Skip to main content — first focusable element in the app (Req 20.6) */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:font-bold focus:shadow-lg"
            >
              Skip to main content
            </a>
            <WhatsAppFAB />
            <ComparisonTrayComponent />
            <GlobalModals />
            <Suspense fallback={<PageLoader />}>
              <AppRoutes />
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
