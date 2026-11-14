import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Enable sending cookies with requests
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Public endpoints that must NOT send the auth token (prevents 431 on large JWTs)
        const publicPaths = ['/categories', '/products', '/reviews/approved', '/reviews/featured', '/admin/recipes', '/admin/banners'];
        const isPublic = publicPaths.some(p => config.url?.startsWith(p)) && (config.method || 'get').toLowerCase() === 'get';

        const token = localStorage.getItem('authToken');
        if (token && !isPublic) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Double-submit CSRF token for all state-changing requests
        const safeMethods = ['get', 'head', 'options'];
        if (!safeMethods.includes((config.method || 'get').toLowerCase())) {
          const csrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('_csrf='))
            ?.split('=')[1];
          if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    let isRefreshing = false;
    let failedQueue: any[] = [];

    const processQueue = (error: any, token: string | null = null) => {
      failedQueue.forEach((prom) => {
        if (error) {
          prom.reject(error);
        } else {
          prom.resolve(token);
        }
      });
      failedQueue = [];
    };

    this.client.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError) => {
        const originalRequest: any = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing) {
            return new Promise(function (resolve, reject) {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers['Authorization'] = 'Bearer ' + token;
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            // Attempt to refresh token using HttpOnly Cookie
            const refreshResponse = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
            const newAccessToken = refreshResponse.data.data.accessToken;

            // Save new token to localStorage AND sync authStore so the store never goes stale
            localStorage.setItem('authToken', newAccessToken);
            // Dynamically import to avoid circular deps — authStore depends on apiClient
            import('@/store/authStore').then(({ useAuthStore }) => {
              useAuthStore.getState().setToken(newAccessToken);
            });
            
            // Re-apply token and process queue
            this.client.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
            originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
            
            processQueue(null, newAccessToken);
            isRefreshing = false;

            // Retry original request
            return this.client(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            isRefreshing = false;
            
            // Refresh token is expired or invalid
            console.error('❌ Session Expired. Please log in again.');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            
            import('@/store/authStore').then(({ useAuthStore }) => {
              useAuthStore.getState().logout();
            });

            // Only redirect if not already on login/register pages
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
              window.location.href = '/login?session_expired=true';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  register(data: { name: string; email: string; password: string }) {
    return this.client.post('/auth/register', data);
  }

  login(data: { email: string; password: string }) {
    return this.client.post('/auth/login', data);
  }

  logout() {
    return this.client.post('/auth/logout');
  }

  refreshToken() {
    return this.client.post('/auth/refresh-token');
  }

  // Products endpoints
  getProducts(params?: any) {
    return this.client.get('/products', { params });
  }

  getProductById(id: string) {
    return this.client.get(`/products/${id}`);
  }

  createProduct(data: any) {
    return this.client.post('/products', data);
  }

  updateProduct(id: string, data: any) {
    return this.client.put(`/products/${id}`, data);
  }

  deleteProduct(id: string) {
    return this.client.delete(`/products/${id}`);
  }

  // Categories endpoints
  getCategories() {
    return this.client.get('/categories');
  }

  getCategoryById(id: string) {
    return this.client.get(`/categories/${id}`);
  }

  createCategory(data: any) {
    return this.client.post('/categories', data);
  }

  updateCategory(id: string, data: any) {
    return this.client.put(`/categories/${id}`, data);
  }

  deleteCategory(id: string) {
    return this.client.delete(`/categories/${id}`);
  }

  // Cart endpoints
  getCart() {
    return this.client.get('/cart');
  }

  addToCart(data: { productId: string; quantity: number }) {
    return this.client.post('/cart/add', data);
  }

  updateCartItem(productId: string, quantity: number) {
    return this.client.put('/cart/update', { productId, quantity });
  }

  removeFromCart(productId: string) {
    return this.client.post('/cart/remove', { productId });
  }

  /**
   * POST /api/cart/sync
   * Validates client cart items against live product prices and stock.
   * Returns { syncedItems, priceDiffs, removedItems }
   * Requirements: 24.1, 24.2, 24.3, 24.4
   */
  syncCart(items: Array<{ productId: string; quantity: number; clientPrice: number }>) {
    return this.client.post('/cart/sync', { items });
  }

  // Orders endpoints
  getOrders() {
    return this.client.get('/orders/my-orders');
  }

  getAllOrders(params?: any) {
    return this.client.get('/orders', { params });
  }

  getOrderById(id: string) {
    return this.client.get(`/orders/${id}`);
  }

  createOrder(data: any) {
    return this.client.post('/orders', data);
  }

  cancelOrder(id: string) {
    return this.client.put(`/orders/${id}/cancel`);
  }

  updateOrder(id: string, data: any) {
    return this.client.put(`/orders/${id}`, data);
  }

  verifyPayment(data: { orderId: string; cashfreeOrderId?: string; cfPaymentId?: string }) {
    return this.client.post('/orders/verify-payment', data);
  }

  getInvoiceUrl(orderId: string) {
    const baseURL = this.client.defaults.baseURL || 'http://localhost:5001/api';
    return `${baseURL}/orders/${orderId}/invoice`;
  }

  processRefund(orderId: string, amount?: number) {
    return this.client.post(`/orders/${orderId}/refund`, { amount });
  }

  // Admin: update order status (separate from generic update)
  updateOrderStatus(id: string, status: string) {
    return this.client.put(`/orders/${id}/status`, { orderstatus: status });
  }

  // Addresses endpoints
  getAddresses() {
    return this.client.get('/addresses');
  }

  addAddress(data: any) {
    return this.client.post('/addresses', data);
  }

  updateAddress(id: string, data: any) {
    return this.client.put(`/addresses/${id}`, data);
  }

  deleteAddress(id: string) {
    return this.client.delete(`/addresses/${id}`);
  }

  // Email endpoints
  subscribeNewsletter(data: { email: string; name?: string }) {
    return this.client.post('/email/subscribe', data);
  }

  contactForm(data: { name: string; email: string; subject: string; message: string; phone?: string }) {
    return this.client.post('/email/contact', data);
  }

  // OTP endpoints
  sendEmailOtp(email: string) {
    return this.client.post('/auth/send-email-otp', { email });
  }

  verifyEmailOtp(email: string, otp: string) {
    return this.client.post('/auth/verify-email-otp', { email, otp });
  }

  sendMobileOtp(mobile: string) {
    return this.client.post('/auth/send-mobile-otp', { mobile });
  }

  verifyMobileOtp(mobile: string, otp: string) {
    return this.client.post('/auth/verify-mobile-otp', { mobile, otp });
  }

  resendEmailOtp(email: string) {
    return this.client.post('/auth/resend-email-otp', { email });
  }

  resendMobileOtp(mobile: string) {
    return this.client.post('/auth/resend-mobile-otp', { mobile });
  }

  // Partnership endpoints
  submitPartnershipApplication(data: any) {
    return this.client.post('/partnership/apply', data);
  }

  getMyPartnershipApplications() {
    return this.client.get('/partnership/my-applications');
  }

  getPartnershipApplication(id: string) {
    return this.client.get(`/partnership/application/${id}`);
  }

  getAllPartnershipApplications(params?: any) {
    return this.client.get('/partnership/admin/all', { params });
  }

  updatePartnershipStatus(id: string, data: { status: string; rejectionReason?: string }) {
    return this.client.put(`/partnership/admin/update-status/${id}`, data);
  }

  // Admin endpoints
  getAdminStats() {
    return this.client.get('/admin/stats');
  }

  getRevenueAnalytics(params?: { startDate?: string; endDate?: string }) {
    return this.client.get('/admin/analytics/revenue', { params });
  }

  getPaymentAnalytics() {
    return this.client.get('/admin/analytics/payments');
  }

  getLowStockProducts(threshold = 10) {
    return this.client.get('/admin/products/low-stock', { params: { threshold } });
  }

  getTopSellingProducts(limit = 5) {
    return this.client.get('/admin/products/top-selling', { params: { limit } });
  }

  getCouponAnalytics() {
    return this.client.get('/admin/coupons/analytics');
  }

  getAllUsers(params?: any) {
    return this.client.get('/admin/users', { params });
  }

  updateUserRole(id: string, role: string) {
    return this.client.put(`/admin/users/${id}/role`, { role });
  }

  deleteUser(id: string) {
    return this.client.delete(`/admin/users/${id}`);
  }

  // Password Reset endpoints
  sendPasswordResetOtp(email: string) {
    return this.client.post('/auth/forgot-password', { email });
  }

  verifyPasswordResetOtp(email: string, otp: string) {
    return this.client.post('/auth/verify-reset-otp', { email, otp });
  }

  resetPassword(email: string, otp: string, newPassword: string) {
    return this.client.post('/auth/reset-password', { email, otp, newPassword });
  }

  // Profile
  getProfile() {
    return this.client.get('/auth/profile');
  }

  updateProfile(data: { name?: string; phone?: string }) {
    return this.client.put('/auth/profile', data);
  }

  // File upload
  uploadImage(formData: FormData) {
    return this.client.post('/products/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }



  // Review endpoints
  submitReview(data: { name: string; rating: number; comment: string; productId?: string; email?: string }) {
      return this.client.post('/reviews/submit', data);
  }

  getApprovedReviews(params?: { limit?: number; productId?: string }) {
    return this.client.get('/reviews/approved', { params });
  }

  getFeaturedReviews() {
    return this.client.get('/reviews/featured');
  }

  getAllReviews(params?: any) {
    return this.client.get('/reviews/admin/all', { params });
  }

  approveReview(id: string, data: { isApproved: boolean; isFeatured?: boolean }) {
    return this.client.put(`/reviews/admin/${id}/approve`, data);
  }

  deleteReview(id: string) {
    return this.client.delete(`/reviews/admin/${id}`);
  }

  // Coupon methods
  validateCoupon(code: string, orderAmount: number) {
    return this.client.post('/coupons/validate', { code, orderAmount });
  }

  applyCoupon(code: string, orderId: string, orderAmount?: number) {
    return this.client.post('/coupons/apply', { code, orderId, orderAmount: orderAmount ?? 0 });
  }

  // Admin Coupon management
  getAdminCoupons(params?: { page?: number; limit?: number; status?: string }) {
    return this.client.get('/coupons/admin/all', { params });
  }

  createAdminCoupon(data: {
    code?: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    maxUses?: number;
    expiresInDays?: number;
  }) {
    return this.client.post('/coupons/admin/create', data);
  }

  deleteAdminCoupon(id: string) {
    return this.client.delete(`/coupons/admin/${id}`);
  }

  // Newsletter subscription - generates a unique coupon for logged-in user
  generateNewsletterCoupon() {
    return this.client.post('/email/subscribe', {});
  }

  // Recipes endpoints (Requirements: 9.2, 9.3, 16.3)
  getRecipes(params?: { tag?: string; region?: string; page?: number; limit?: number }) {
    return this.client.get('/admin/recipes', { params });
  }

  // Seasonal Banners endpoints (Requirements: 9.4, 9.5, 17.1)
  getSeasonalBanners(activeOnly = true) {
    return this.client.get('/admin/banners', { params: activeOnly ? { activeOnly: 'true' } : {} });
  }

  getBaseUrl() {
    return this.client.defaults.baseURL?.replace('/api', '') || 'http://localhost:5001';
  }

  // Recently Viewed endpoints
  getRecentlyViewed() {
    return this.client.get('/products/recently-viewed');
  }

  addToRecentlyViewed(productId: string) {
    return this.client.post(`/products/recently-viewed/${productId}`);
  }

  // Loyalty endpoints (Requirement 10.4)
  getLoyaltyBalance() {
    return this.client.get('/loyalty/balance');
  }

  redeemLoyaltyPoints(data: { pointsRequested: number; orderSubtotal: number }) {
    return this.client.post('/loyalty/redeem', data);
  }

  // Wishlist endpoints
  getWishlist() {
    return this.client.get('/wishlist');
  }

  addToWishlist(productId: string) {
    return this.client.post(`/wishlist/${productId}`);
  }

  removeFromWishlist(productId: string) {
    return this.client.delete(`/wishlist/${productId}`);
  }

  // Loyalty transaction history
  getLoyaltyTransactions(params?: { page?: number; limit?: number }) {
    return this.client.get('/loyalty/transactions', { params });
  }

  // Address: set default
  setDefaultAddress(id: string) {
    return this.client.post(`/addresses/${id}/set-default`, {});
  }

  // Referral endpoints (Bug 5 fix — canonical typed methods targeting /referral/* singular)
  getReferralCode() {
    return this.client.get('/referral/my-code');
  }

  applyReferralCode(code: string) {
    return this.client.post('/referral/apply', { code });
  }

  getReferralHistory() {
    return this.client.get('/referral/history');
  }

  // Admin Product Management Endpoints
  adminListProducts(params?: any) {
    return this.client.get('/admin/products', { params });
  }

  adminGetProduct(id: string) {
    return this.client.get(`/admin/products/${id}`);
  }

  adminCreateProduct(data: any) {
    return this.client.post('/admin/products', data);
  }

  adminUpdateProduct(id: string, data: any) {
    return this.client.put(`/admin/products/${id}`, data);
  }

  adminDeleteProduct(id: string) {
    return this.client.delete(`/admin/products/${id}`);
  }

  adminUpdateProductStatus(id: string, status: string) {
    return this.client.patch(`/admin/products/${id}/status`, { status });
  }

  adminDuplicateProduct(id: string) {
    return this.client.post(`/admin/products/${id}/duplicate`);
  }

  adminGetInventory(id: string) {
    return this.client.get(`/admin/products/${id}/inventory`);
  }

  adminAdjustVariantStock(id: string, variantId: string, data: { quantity: number; reason: string; note?: string }) {
    return this.client.put(`/admin/products/${id}/variants/${variantId}/stock`, data);
  }

  adminGetInventoryHistory(id: string, params?: any) {
    return this.client.get(`/admin/products/${id}/inventory/history`, { params });
  }

  adminBulkOperation(data: { productIds: string[]; action: string; payload?: any }) {
    return this.client.post('/admin/products/bulk', data);
  }

  adminExportProducts() {
    return this.client.get('/admin/products/export', { responseType: 'blob' });
  }

  adminImportProducts(data: any) {
    return this.client.post('/admin/products/import', data);
  }

  adminSearchPicker(q: string) {
    return this.client.get('/admin/products/search-picker', { params: { q } });
  }

  // Generic methods
  get(endpoint: string, config?: any) {
    return this.client.get(endpoint, config);
  }

  post(endpoint: string, data?: any, config?: any) {
    return this.client.post(endpoint, data, config);
  }

  put(endpoint: string, data?: any, config?: any) {
    return this.client.put(endpoint, data, config);
  }

  delete(endpoint: string, config?: any) {
    return this.client.delete(endpoint, config);
  }
}

export const apiClient = new ApiClient();
