import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useOrders } from '@/hooks/useApi';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Package,
  ChevronRight,
  Calendar,
  MapPin,
  DollarSign,
  Search,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import PageHelmet from '@/components/PageHelmet';
import type { Product } from '@/types';
import { toast } from 'sonner';

const OrdersPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { data: ordersData, isLoading } = useOrders();
  // Normalise the orders array regardless of API response shape
  const orders: any[] = useMemo(() => {
    if (!ordersData) return [];
    const d = ordersData as any;
    // Shape 1: { data: [...orders] }  ← most common (axios interceptor returns response.data)
    if (Array.isArray(d?.data)) return d.data;
    // Shape 2: { data: { data: [...orders] } }
    if (Array.isArray(d?.data?.data)) return d.data.data;
    // Shape 3: { data: { orders: [...] } }
    if (Array.isArray(d?.data?.orders)) return d.data.orders;
    // Shape 4: already an array
    if (Array.isArray(d)) return d;
    return [];
  }, [ordersData]);

  const addItem = useCartStore((s) => s.addItem);
  const toggleCart = useCartStore((s) => s.toggleCart);

  // States for search and status filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'delivered' | 'cancelled'>('all');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!isAuthenticated && !token) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Derived stats
  const stats = useMemo(() => {
    const nonCancelled = orders.filter((o) => o.orderstatus?.toLowerCase() !== 'cancelled');
    const totalCount = orders.length;
    const activeCount = orders.filter((o) => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.orderstatus?.toLowerCase() || '')).length;
    const completedCount = orders.filter((o) => o.orderstatus?.toLowerCase() === 'delivered').length;
    const totalSpent = nonCancelled.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const totalSavings = nonCancelled.reduce((sum, o) => sum + (Number(o.discountAmount) || 0), 0);

    return { totalCount, activeCount, completedCount, totalSpent, totalSavings };
  }, [orders]);

  // Filter orders based on query and status pill
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderId = order._id || '';
      const orderNum = order.orderNumber || '';
      const matchesSearch =
        orderId.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        orderNum.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesStatus =
        statusFilter === 'all' ||
        // 'pending' tab should also show 'confirmed' orders (they're essentially pending)
        (statusFilter === 'pending'
          ? ['pending', 'confirmed'].includes(order.orderstatus?.toLowerCase() || '')
          : order.orderstatus?.toLowerCase() === statusFilter);
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleReorder = (order: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!order.items || order.items.length === 0) {
      toast.error('No items found to reorder.');
      return;
    }

    order.items.forEach((item: any) => {
      const product: Product = {
        _id: item.productId,
        id: item.productId,
        name: item.name,
        price: Number(item.price) || 0,
        image: item.image || '',
        description: item.description || '',
        category: item.category || '',
        rating: item.rating || 5,
        reviews: item.reviews || 0,
        inStock: true,
        stock: 99,
        weight: item.weight || '',
      };
      addItem(product);
    });

    toast.success('Items from this order have been added to your cart!');
    toggleCart();
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] pt-24 pb-12 text-[#3E2314]">
      <PageHelmet
        title="My Orders | Matasree Super Masale"
        description="View and track all your orders from Matasree Super Masale."
        canonicalUrl="https://matasreesuper.com/orders"
        noIndex={true}
      />
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl md:text-5xl font-black text-[#3E2314] mb-2">My Orders</h1>
          <p className="text-muted-foreground font-medium">Track your order statuses, history, and savings</p>
        </div>

        {/* Stats Summary Cards */}
        {orders.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white border-[#3E2314]/8 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#3E2314]/50 uppercase tracking-wider">Total Orders</p>
                  <p className="text-2xl font-black mt-1 text-[#3E2314]">{stats.totalCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700">
                  <Package className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[#3E2314]/8 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#3E2314]/50 uppercase tracking-wider">Active Orders</p>
                  <p className="text-2xl font-black mt-1 text-[#D63220]">{stats.activeCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-700">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[#3E2314]/8 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#3E2314]/50 uppercase tracking-wider">Total Spent</p>
                  <p className="text-xl font-black mt-1 text-[#3E2314]">₹{stats.totalSpent.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-700">
                  <DollarSign className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#128807]/5 border-[#128807]/15 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#128807] uppercase tracking-wider">Total Savings</p>
                  <p className="text-xl font-black mt-1 text-[#128807]">₹{stats.totalSavings.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#128807]/10 flex items-center justify-center text-[#128807]">
                  <Sparkles className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search & Filter bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto" role="tablist" aria-label="Filter orders by status">
            {(['all', 'pending', 'processing', 'delivered', 'cancelled'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 capitalize ${
                  statusFilter === status
                    ? 'bg-gradient-to-r from-[#D63220] to-[#E65C19] text-white border-transparent shadow-sm'
                    : 'bg-white text-[#3E2314] border-[#3E2314]/15 hover:bg-[#D63220]/5 hover:border-[#D63220]/30'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3E2314]/40" />
            <Input
              type="text"
              placeholder="Search by Order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-[#3E2314]/15 rounded-full"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i} className="border-[#3E2314]/8">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <Card
                key={order._id}
                onClick={() => navigate(`/order/${order._id}`)}
                className="hover:shadow-md border-[#3E2314]/8 hover:border-[#3E2314]/20 bg-white transition-all duration-300 cursor-pointer"
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center">
                          <Package className="w-6 h-6 text-[#E65C19]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#3E2314]">Order #{order._id?.slice(-8).toUpperCase()}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Order Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#3E2314]/8">
                        <div>
                          <p className="text-xs font-semibold text-[#3E2314]/50 mb-1">Items</p>
                          <p className="text-lg font-bold text-[#3E2314]">{order.items?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#3E2314]/50 mb-1">Total</p>
                          <p className="text-lg font-bold text-[#3E2314]">₹{order.totalAmount || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#3E2314]/50 mb-1">Status</p>
                          <Badge className={getStatusColor(order.orderstatus)}>
                            {order.orderstatus || 'Pending'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#3E2314]/50 mb-1">Payment</p>
                          <Badge variant={order.paymentStatus === 'completed' || order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                            {order.paymentStatus || 'Pending'}
                          </Badge>
                        </div>
                      </div>

                      {/* Delivery Address */}
                      {order.shippingAddress && (
                        <div className="mt-4 pt-4 border-t border-[#3E2314]/8">
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-[#3E2314]">{order.shippingAddress.name}</p>
                              <p className="text-muted-foreground font-medium">
                                {order.shippingAddress.addressLine1 || order.shippingAddress.address}, {order.shippingAddress.city}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row md:flex-col gap-2 self-end md:self-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1.5 border-[#3E2314]/15 hover:bg-[#D63220]/5 hover:border-[#D63220]/30"
                        onClick={(e) => handleReorder(order, e)}
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#D63220]" />
                        <span>Reorder</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="group flex items-center gap-1 hover:text-[#D63220]"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-[#3E2314]/8 bg-white">
              <CardContent className="pt-6 text-center py-12">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-2">No Orders Found</h3>
                <p className="text-muted-foreground mb-6">No orders match your filters.</p>
                <Button
                  className="bg-gradient-spice hover:opacity-90 text-white font-bold"
                  onClick={() => navigate('/products')}
                >
                  Start Shopping
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
