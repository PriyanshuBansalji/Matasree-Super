import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

// ==================== AUTH HOOKS ====================

export const useLogin = () => {
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      apiClient.login(credentials),
    onSuccess: (response) => {
      localStorage.setItem('authToken', response.data.token);
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string }) =>
      apiClient.register(data),
    onSuccess: (response) => {
      localStorage.setItem('authToken', response.data.token);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      queryClient.clear();
    },
  });
};

// ==================== PRODUCTS HOOKS ====================

export const useProducts = (params?: any) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => apiClient.getProducts(params),
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => apiClient.getProductById(id),
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// ==================== CATEGORIES HOOKS ====================

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories(),
  });
};

export const useCategory = (id: string) => {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => apiClient.getCategoryById(id),
    enabled: !!id,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.updateCategory(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['category', id] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

// ==================== CART HOOKS ====================

export const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => apiClient.getCart(),
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { productId: string; quantity: number }) =>
      apiClient.addToCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      apiClient.updateCartItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => apiClient.removeFromCart(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

// ==================== ORDERS HOOKS ====================

export const useOrders = () => {
  return useQuery({
    queryKey: ['my-orders'],
    queryFn: () => apiClient.getOrders(),
  });
};

export const useAllOrders = (params?: any) => {
  return useQuery({
    queryKey: ['all-orders', params],
    queryFn: () => apiClient.getAllOrders(params),
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => apiClient.getOrderById(id),
    enabled: !!id,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.cancelOrder(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

// ==================== ADDRESSES HOOKS ====================

export const useAddresses = () => {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: () => apiClient.getAddresses(),
  });
};

export const useAddAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.addAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};
