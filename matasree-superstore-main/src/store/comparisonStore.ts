import { create } from 'zustand';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ComparisonProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  weight: string;
  category: string;
  stock: number;
  description: string;
  image: string;
}

interface ComparisonState {
  items: ComparisonProduct[];   // max 4
  isOpen: boolean;
  addProduct: (p: ComparisonProduct) => void;
  removeProduct: (id: string) => void;
  clearAll: () => void;
  setOpen: (v: boolean) => void;
}

// ─── Store ─────────────────────────────────────────────────────────────────────
// No `persist` middleware — session lifetime only (per requirement 5.5)

export const useComparisonStore = create<ComparisonState>()((set, get) => ({
  items: [],
  isOpen: false,

  addProduct: (p: ComparisonProduct) => {
    const { items } = get();

    // Guard: max 4 products
    if (items.length >= 4) {
      toast('You can compare up to 4 products at a time.');
      return;
    }

    // Guard: already in comparison
    if (items.some((item) => item.id === p.id)) {
      return;
    }

    set((state) => ({ items: [...state.items, p] }));
  },

  removeProduct: (id: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },

  clearAll: () => set({ items: [], isOpen: false }),

  setOpen: (v: boolean) => set({ isOpen: v }),
}));
