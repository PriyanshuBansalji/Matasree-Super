/**
 * Product Admin Store (Zustand)
 *
 * Manages admin product list filters, multi-row selections, bulk action state,
 * and import result modals.
 *
 * Requirements: 12.1, 12.2, 11.1–11.8
 */
import { create } from 'zustand';

export interface ProductListFilters {
  page: number;
  limit: number;
  sort?: string;
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
  inStock?: boolean;
  isFeatured?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface ImportErrorItem {
  row: number;
  message: string;
}

export interface ImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: ImportErrorItem[];
}

const defaultFilters: ProductListFilters = {
  page: 1,
  limit: 20,
  sort: '-createdAt',
  search: '',
  category: '',
  brand: '',
  status: '',
  inStock: undefined,
  isFeatured: undefined,
};

interface ProductAdminState {
  selectedProductIds: string[];
  listFilters: ProductListFilters;
  isImporting: boolean;
  importResult: ImportResult | null;

  // Actions
  setSelectedIds: (ids: string[]) => void;
  toggleSelected: (id: string) => void;
  selectAll: (allIdsOnPage: string[]) => void;
  clearSelection: () => void;
  setListFilters: (filters: Partial<ProductListFilters>) => void;
  resetListFilters: () => void;
  setImporting: (importing: boolean) => void;
  setImportResult: (result: ImportResult | null) => void;
}

export const useProductAdminStore = create<ProductAdminState>((set) => ({
  selectedProductIds: [],
  listFilters: defaultFilters,
  isImporting: false,
  importResult: null,

  setSelectedIds: (ids: string[]) => set({ selectedProductIds: ids }),

  toggleSelected: (id: string) =>
    set((state) => {
      const exists = state.selectedProductIds.includes(id);
      return {
        selectedProductIds: exists
          ? state.selectedProductIds.filter((item) => item !== id)
          : [...state.selectedProductIds, id],
      };
    }),

  selectAll: (allIdsOnPage: string[]) =>
    set((state) => {
      const allSelected = allIdsOnPage.every((id) =>
        state.selectedProductIds.includes(id)
      );
      if (allSelected) {
        return {
          selectedProductIds: state.selectedProductIds.filter(
            (id) => !allIdsOnPage.includes(id)
          ),
        };
      }
      const combined = new Set([...state.selectedProductIds, ...allIdsOnPage]);
      return { selectedProductIds: Array.from(combined) };
    }),

  clearSelection: () => set({ selectedProductIds: [] }),

  setListFilters: (filters: Partial<ProductListFilters>) =>
    set((state) => ({
      listFilters: { ...state.listFilters, ...filters },
    })),

  resetListFilters: () => set({ listFilters: defaultFilters }),

  setImporting: (isImporting: boolean) => set({ isImporting }),

  setImportResult: (importResult: ImportResult | null) => set({ importResult }),
}));
