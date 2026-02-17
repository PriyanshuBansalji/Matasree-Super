import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          console.error('❌ 401 Unauthorized:', error.response.data);
          // Handle unauthorized - redirect to login
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
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

  // File upload
  uploadImage(formData: FormData) {
    return this.client.post('/products/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  getBaseUrl() {
    return this.client.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';
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
