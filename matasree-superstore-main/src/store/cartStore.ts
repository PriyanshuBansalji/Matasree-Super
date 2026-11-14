import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemPrice: (productId: string, newPrice: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      addItem: (product: Product) => {
        set((state) => {
          const productId = product.id ?? product._id;
          // Use actual weight (empty string if none) — never use "default" as a placeholder
          const weight = product.weight ?? '';
          const compoundId = `${productId}-${weight}`;
          const existingItem = state.items.find((item) => item.id === compoundId);
          const qty = (product as any).quantity ?? 1;
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === compoundId
                  ? { ...item, quantity: item.quantity + qty }
                  : item
              ),
            };
          }
          const newItem: CartItem = {
            id: compoundId,
            productId: productId,
            name: product.name,
            price: product.price,
            quantity: qty,
            image: product.image,
            weight: product.weight,
            description: product.description,
          };
          return { items: [...state.items, newItem] };
        });
      },
      
      removeItem: (id: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      
      updateQuantity: (id: string, quantity: number) => {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },

      updateItemPrice: (id: string, newPrice: number) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, price: newPrice } : item
          ),
        }));
      },
      
      clearCart: () => set({ items: [] }),
      
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      
      setCartOpen: (open: boolean) => set({ isOpen: open }),
      
      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      
      totalPrice: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    {
      name: 'matasree-cart',
      // Migrate stale items that used "-default" as weight placeholder
      migrate: (persistedState: any) => {
        if (persistedState?.items) {
          persistedState.items = persistedState.items.map((item: any) => {
            if (item.id?.endsWith('-default')) {
              // Strip the "-default" suffix and clear the weight
              const productId = item.id.replace(/-default$/, '');
              return { ...item, id: `${productId}-`, weight: undefined };
            }
            return item;
          });
        }
        return persistedState;
      },
      version: 2,
    }
  )
);
