import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistItem {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    category?: string;
    rating?: number;
}

interface WishlistState {
    items: WishlistItem[];
    addItem: (item: WishlistItem) => void;
    removeItem: (id: string) => void;
    isWishlisted: (id: string) => boolean;
    toggleWishlist: (item: WishlistItem) => void;
    clearWishlist: () => void;
    totalItems: () => number;
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (item: WishlistItem) => {
                set((state) => {
                    if (state.items.find((i) => i.id === item.id)) return state;
                    return { items: [...state.items, item] };
                });
            },

            removeItem: (id: string) => {
                set((state) => ({
                    items: state.items.filter((i) => i.id !== id),
                }));
            },

            isWishlisted: (id: string) => {
                return get().items.some((i) => i.id === id);
            },

            toggleWishlist: (item: WishlistItem) => {
                const exists = get().items.find((i) => i.id === item.id);
                if (exists) {
                    get().removeItem(item.id);
                } else {
                    get().addItem(item);
                }
            },

            clearWishlist: () => set({ items: [] }),

            totalItems: () => get().items.length,
        }),
        {
            name: 'matasree-wishlist',
        }
    )
);
