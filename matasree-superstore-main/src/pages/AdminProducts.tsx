/**
 * AdminProducts
 *
 * Shopify-style product catalog list view for Admin panel.
 * Features data table, server pagination, status filter badges, row multi-selection,
 * sticky BulkActionBar, CSV Import/Export panel, and fast search.
 *
 * Requirements: 11.1–11.8, 12.1–12.8, 18.4, 19.2, 19.5
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useProductAdminStore } from '@/store/productAdminStore';
import { apiClient } from '@/services/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHelmet from '@/components/PageHelmet';
import BulkActionBar from '@/components/admin/BulkActionBar';
import ImportExportPanel from '@/components/admin/ImportExportPanel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus, Search, MoreHorizontal, Edit, Copy, Trash2, Eye,
  Package, Filter, RefreshCw, Loader2, Star, Box, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductItem {
  _id: string;
  name: string;
  brand?: string;
  price: number;
  stock?: number;
  status?: string;
  isFeatured?: boolean;
  image?: string;
  category?: string | { _id: string; name: string };
  variants?: any[];
  createdAt?: string;
}

const statusBadgeMap: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  draft: { label: 'Draft', className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30' },
  scheduled: { label: 'Scheduled', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  hidden: { label: 'Hidden', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  archived: { label: 'Archived', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30' },
};

const AdminProducts = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const {
    selectedProductIds,
    listFilters,
    setSelectedIds,
    toggleSelected,
    selectAll,
    clearSelection,
    setListFilters,
  } = useProductAdminStore();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState(listFilters.search || '');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response: any = await apiClient.adminListProducts(listFilters);
      const data = response?.data ?? response;
      const list = data?.products || data?.data || (Array.isArray(data) ? data : []);
      const pagination = data?.pagination || {};

      setProducts(list);
      setTotalCount(pagination.total || list.length);
      setTotalPages(pagination.pages || 1);
    } catch (err: any) {
      toast.error('Failed to load admin product catalog');
    } finally {
      setLoading(false);
    }
  }, [listFilters]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchProducts();
  }, [user, navigate, fetchProducts]);

  // Debounced search input sync
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== listFilters.search) {
        setListFilters({ search: searchInput, page: 1 });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, listFilters.search, setListFilters]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiClient.adminDeleteProduct(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err: any) {
      toast.error('Failed to delete product');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await apiClient.adminDuplicateProduct(id);
      toast.success('Product duplicated as draft');
      fetchProducts();
    } catch (err: any) {
      toast.error('Failed to duplicate product');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiClient.adminUpdateProductStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      fetchProducts();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const pageIds = products.map((p) => p._id);
  const isAllPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedProductIds.includes(id));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHelmet title="Product Catalog Management | Admin Matasree" noIndex={true} />
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-32 max-w-7xl flex-grow">
        {/* Header Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
              Product Catalog Management
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage product listings, inventory levels, pricing, variants, and catalog status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ImportExportPanel onRefetch={fetchProducts} />

            <Button
              onClick={() => navigate('/admin/products/new')}
              className="bg-gradient-spice text-white text-xs gap-1.5 shadow-md hover:scale-105 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <Card className="mb-6 shadow-sm border-border">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products by name, brand, SKU..."
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={listFilters.status === '' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setListFilters({ status: '', page: 1 })}
                className="text-xs h-8"
              >
                All
              </Button>
              <Button
                variant={listFilters.status === 'active' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setListFilters({ status: 'active', page: 1 })}
                className="text-xs h-8 text-emerald-600"
              >
                Active
              </Button>
              <Button
                variant={listFilters.status === 'draft' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setListFilters({ status: 'draft', page: 1 })}
                className="text-xs h-8"
              >
                Drafts
              </Button>
              <Button
                variant={listFilters.isFeatured ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setListFilters({ isFeatured: !listFilters.isFeatured, page: 1 })}
                className="text-xs h-8 text-amber-600"
              >
                <Star className="w-3 h-3 mr-1" /> Featured
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={fetchProducts}
                title="Refresh catalog"
                className="h-8 w-8"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="shadow-sm border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={isAllPageSelected}
                      onCheckedChange={() => selectAll(pageIds)}
                      aria-label="Select all products"
                    />
                  </TableHead>
                  <TableHead className="w-[60px]">Image</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="w-[110px]">Category</TableHead>
                  <TableHead className="w-[90px]">Variants</TableHead>
                  <TableHead className="w-[90px]">Price (₹)</TableHead>
                  <TableHead className="w-[80px]">Stock</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell colSpan={9} className="h-12 text-center text-xs text-muted-foreground animate-pulse">
                        Loading products...
                      </TableCell>
                    </TableRow>
                  ))
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="font-medium text-sm">No products found matching filters.</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => { setSearchInput(''); setListFilters({ search: '', status: '', page: 1 }); }}
                        className="text-xs text-primary"
                      >
                        Reset Filters
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => {
                    const isSelected = selectedProductIds.includes(p._id);
                    const categoryName = typeof p.category === 'object' ? p.category?.name : p.category || 'Uncategorized';
                    const statusInfo = statusBadgeMap[p.status || 'active'] || statusBadgeMap.active;
                    const totalStock = p.variants ? p.variants.reduce((sum, v) => sum + (v.stock || 0), 0) : p.stock || 0;

                    return (
                      <TableRow key={p._id} className={isSelected ? 'bg-muted/40' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelected(p._id)}
                            aria-label={`Select ${p.name}`}
                          />
                        </TableCell>

                        {/* Thumbnail */}
                        <TableCell>
                          <div className="w-10 h-10 rounded-lg border overflow-hidden bg-secondary flex items-center justify-center">
                            {p.image ? (
                              <img
                                src={
                                  p.image.startsWith('http') || p.image.startsWith('data:')
                                    ? p.image
                                    : p.image.startsWith('/')
                                    ? `${apiClient.getBaseUrl()}${p.image}`
                                    : p.image
                                }
                                alt={p.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600';
                                }}
                              />
                            ) : (
                              <Box className="w-5 h-5 text-muted-foreground opacity-40" />
                            )}
                          </div>
                        </TableCell>

                        {/* Name & Brand */}
                        <TableCell>
                          <div className="font-medium text-sm text-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/admin/products/${p._id}/edit`)}>
                            {p.name}
                            {p.isFeatured && <Star className="w-3 h-3 text-amber-500 inline ml-1.5 fill-amber-500" />}
                          </div>
                          {p.brand && <span className="text-[11px] text-muted-foreground block">{p.brand}</span>}
                        </TableCell>

                        {/* Category */}
                        <TableCell className="text-xs font-medium text-muted-foreground">
                          {categoryName}
                        </TableCell>

                        {/* Variants Count */}
                        <TableCell className="text-xs font-mono">
                          {p.variants?.length || 1} variant(s)
                        </TableCell>

                        {/* Price */}
                        <TableCell className="font-mono text-xs font-bold text-foreground">
                          ₹{p.price?.toFixed(2)}
                        </TableCell>

                        {/* Stock */}
                        <TableCell className="font-mono text-xs">
                          <span className={totalStock <= 0 ? 'text-red-500 font-bold' : totalStock <= 10 ? 'text-amber-500 font-bold' : 'text-emerald-600 font-bold'}>
                            {totalStock}
                          </span>
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] uppercase font-mono px-2 py-0.5 ${statusInfo.className}`}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>

                        {/* Actions Menu */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 text-xs">
                              <DropdownMenuLabel>Product Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => navigate(`/product/${p._id}`)}>
                                <Eye className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Storefront View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/admin/products/${p._id}/edit`)}>
                                <Edit className="w-3.5 h-3.5 mr-2 text-primary" /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(p._id)}>
                                <Copy className="w-3.5 h-3.5 mr-2 text-blue-500" /> Duplicate
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleStatusChange(p._id, 'active')}>
                                Set Active
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(p._id, 'draft')}>
                                Set Draft
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(p._id, 'hidden')}>
                                Set Hidden
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(p._id)} className="text-red-600 focus:text-red-600">
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-border flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground font-mono">
              Showing {products.length} of {totalCount} product(s)
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={listFilters.page <= 1}
                onClick={() => setListFilters({ page: listFilters.page - 1 })}
                className="h-8 text-xs gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </Button>
              <span className="text-xs font-mono px-2">
                Page {listFilters.page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={listFilters.page >= totalPages}
                onClick={() => setListFilters({ page: listFilters.page + 1 })}
                className="h-8 text-xs gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      </main>

      {/* Sticky Bulk Action Bar */}
      <BulkActionBar
        selectedIds={selectedProductIds}
        onClearSelection={clearSelection}
        onSuccess={fetchProducts}
      />

      <Footer />
    </div>
  );
};

export default AdminProducts;
