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
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔑 Token added to request:', config.url);
        } else {
          console.log('⚠️ No token found for request:', config.url);
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

            // Save new token
            localStorage.setItem('authToken', newAccessToken);
            
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

  updateCartItem(itemId: string, quantity: number) {
    return this.client.put('/cart/update', { itemId, quantity });
  }

  removeFromCart(itemId: string) {
    return this.client.delete(`/cart/remove/${itemId}`);
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

  getRevenueAnalytics() {
    return this.client.get('/admin/analytics/revenue');
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

  // File upload
  uploadImage(formData: FormData) {
    return this.client.post('/products/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Payment verification
  verifyPayment(data: { orderId: string; razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string }) {
    return this.client.post('/orders/verify-payment', data);
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

  applyCoupon(code: string, orderId: string) {
    return this.client.post('/coupons/apply', { code, orderId });
  }

  // Newsletter subscription – generates a unique coupon for logged-in user
  generateNewsletterCoupon() {
    return this.client.post('/email/subscribe', {});
  }

  getBaseUrl() {
    return this.client.defaults.baseURL?.replace('/api', '') || 'http://localhost:5001';
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
