import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Users, ShoppingCart, DollarSign, TrendingUp, Package, AlertCircle, CheckCircle, Clock, ArrowRight, Tag } from 'lucide-react';
import PageHelmet from '@/components/PageHelmet';

// TopProductsWidget component (Req 14.1, 14.2, 14.5)
const TopProductsWidget = ({ products }: { products: any[] }) => (
  <Card>
    <CardHeader className="flex flex-row items-center gap-2">
      <TrendingUp className="w-5 h-5 text-emerald-600" />
      <CardTitle className="text-lg font-serif">Top Products</CardTitle>
    </CardHeader>
    <CardContent>
      {products.length === 0 ? (
        <p className="text-sm text-[#3E2314]/50 py-4 text-center">No sales data available</p>
      ) : (
        <div className="space-y-3">
          {products.map((p: any, index: number) => {
            const revenue = (p.price ?? 0) * (p.sold ?? 0);
            return (
              <div
                key={p._id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#FAF7F2] transition-colors"
              >
                {/* Rank badge */}
                <span
                  className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                    index === 0
                      ? 'bg-yellow-100 text-yellow-700'
                      : index === 1
                      ? 'bg-gray-100 text-gray-600'
                      : index === 2
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-[#FAF7F2] text-[#3E2314]/50'
                  }`}
                >
                  #{index + 1}
                </span>

                {/* Product image */}
                {p.image && (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-9 h-9 rounded object-cover border border-[#3E2314]/10 flex-shrink-0"
                  />
                )}

                {/* Name + stats */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#3E2314] truncate">{p.name}</p>
                  <p className="text-xs text-[#3E2314]/50">
                    {p.sold ?? 0} units sold
                  </p>
                </div>

                {/* Revenue */}
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm text-emerald-700">
                    ₹{revenue.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-[#3E2314]/40">revenue</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CardContent>
  </Card>
);

// CouponAnalyticsTable component
const CouponAnalyticsTable = ({ data }: { data: any[] }) => (
  <Card>
    <CardHeader className="flex flex-row items-center gap-2">
      <Tag className="w-5 h-5 text-[#D63220]" />
      <CardTitle className="text-lg font-serif">Coupon Analytics</CardTitle>
    </CardHeader>
    <CardContent>
      {data.length === 0 ? (
        <p className="text-sm text-[#3E2314]/50 py-4 text-center">No coupons available</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#3E2314]/10">
                <th className="text-left py-2 px-3 font-semibold text-[#3E2314]/70">Code</th>
                <th className="text-left py-2 px-3 font-semibold text-[#3E2314]/70">Type</th>
                <th className="text-left py-2 px-3 font-semibold text-[#3E2314]/70">Value</th>
                <th className="text-left py-2 px-3 font-semibold text-[#3E2314]/70">Usage/Max</th>
                <th className="text-left py-2 px-3 font-semibold text-[#3E2314]/70">Revenue Saved</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c: any) => (
                <tr key={c.code} className="border-b border-[#3E2314]/5 hover:bg-[#FAF7F2]">
                  <td className="py-2 px-3 font-mono font-bold text-[#D63220]">{c.code}</td>
                  <td className="py-2 px-3 capitalize">{c.discountType}</td>
                  <td className="py-2 px-3">{c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                  <td className="py-2 px-3">{c.usageCount} / {c.maxUses === 0 ? 'Unlimited' : c.maxUses}</td>
                  <td className="py-2 px-3">₹{(c.totalRevenueSaved ?? 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [paymentsData, setPaymentsData] = useState<{
    totalPayments: number;
    cashfreePayments: number;
    codPayments: number;
    paymentMethods: Array<{ _id: string; total: number; count: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // New admin widgets states (Phase 3)
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponAnalytics, setCouponAnalytics] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  // Revenue date range filter state (Req 13.3, 13.4)
  const [revStartDate, setRevStartDate] = useState('');
  const [revEndDate, setRevEndDate] = useState('');

  const fetchRevenue = async (start?: string, end?: string) => {
    try {
      const params: { startDate?: string; endDate?: string } = {};
      if (start) params.startDate = start;
      if (end) params.endDate = end;
      const res = await apiClient.getRevenueAnalytics(params);
      if (res?.data) {
        setAnalytics(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch revenue analytics:', err);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchStats = async () => {
      try {
        const [statsResponse, analyticsResponse, paymentsResponse, lowStockRes, couponsRes, topProductsRes] = await Promise.all([
          apiClient.getAdminStats(),
          apiClient.getRevenueAnalytics(),
          apiClient.getPaymentAnalytics(),
          apiClient.getLowStockProducts(10),
          apiClient.getCouponAnalytics(),
          apiClient.getTopSellingProducts(5),
        ]);

        if (statsResponse?.data) {
          setStats(statsResponse.data);
        }

        if (analyticsResponse?.data) {
          setAnalytics(analyticsResponse.data);
        }

        if (paymentsResponse?.data) {
          setPaymentsData(paymentsResponse.data);
        }

        if (lowStockRes?.data) {
          setLowStock(lowStockRes.data);
        }

        if (couponsRes?.data) {
          setCoupons(couponsRes.data);
          setCouponAnalytics(couponsRes.data);
        }

        if (topProductsRes?.data) {
          setTopProducts(topProductsRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-xl text-gray-600">Loading dashboard...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHelmet
        title="Admin Dashboard | Matasree Super Masale"
        description="Matasree Super Masale admin dashboard."
        canonicalUrl="https://matasreesuper.com/admin/dashboard"
        noIndex={true}
      />
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">Registered customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground">All orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.ordersByStatus?.pending || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting processing</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <CardTitle>Revenue Trends</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={revStartDate}
                  onChange={(e) => setRevStartDate(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                />
                <span className="text-gray-400 text-sm">to</span>
                <input
                  type="date"
                  value={revEndDate}
                  onChange={(e) => setRevEndDate(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                />
                <Button
                  size="sm"
                  onClick={() => fetchRevenue(revStartDate, revEndDate)}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                >
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRevStartDate('');
                    setRevEndDate('');
                    fetchRevenue();
                  }}
                  className="h-8"
                >
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {analytics && analytics.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${value}`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      dot={{ r: 4 }}
                      name="Revenue (₹)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center py-8 text-gray-500">No data available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.ordersByStatus && Object.keys(stats.ordersByStatus).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(stats.ordersByStatus).map(([status, count]) => ({
                      status: status || 'pending',
                      count,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center py-8 text-gray-500">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentsData && (paymentsData.paymentMethods?.length ?? 0) > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-700">{paymentsData.totalPayments}</p>
                      <p className="text-sm text-gray-600">Total Payments</p>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                      <p className="text-2xl font-bold text-emerald-700">{paymentsData.cashfreePayments ?? (paymentsData as any).razorpayPayments ?? 0}</p>
                      <p className="text-sm text-gray-600">Cashfree Payments</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-700">{paymentsData.codPayments}</p>
                      <p className="text-sm text-gray-600">Cash on Delivery</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={paymentsData.paymentMethods.map((m) => ({
                          name: m._id === 'cod' ? 'Cash on Delivery' : 'Cashfree Payments',
                          value: m.count,
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {paymentsData.paymentMethods.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f97316'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">No payment data available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentsData && (paymentsData.paymentMethods?.length ?? 0) > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={paymentsData.paymentMethods.map((m) => ({
                      method: m._id === 'cod' ? 'Cash on Delivery' : 'Cashfree Payments',
                      count: m.count,
                      total: m.total,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => name === 'total' ? `₹${value}` : value} />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Transactions" />
                    <Bar dataKey="total" fill="#10b981" name="Amount (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center py-8 text-gray-500">No payment data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tables Grid (Phase 3) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Top Selling Products (Phase 3, Task 24) */}
          <TopProductsWidget products={topProducts} />

          {/* Low Stock Alerts (Phase 3, Task 18) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {lowStock && lowStock.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                        <th className="p-3 pl-5">Product</th>
                        <th className="p-3 text-center">Stock</th>
                        <th className="p-3 text-right pr-5">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStock.map((p: any) => (
                        <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="p-3 pl-5 font-semibold text-gray-700 truncate max-w-[150px]">
                            {p.name}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                              p.stock <= 5
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {p.stock} left
                            </span>
                          </td>
                          <td className="p-3 text-right pr-5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/admin/products?edit=${p._id}`)}
                              className="text-blue-600 hover:text-blue-700 p-0 h-auto font-bold"
                            >
                              Edit <ArrowRight className="w-3 h-3 ml-0.5 inline" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-8 text-green-600 font-semibold flex items-center justify-center gap-1">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  All products well-stocked!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Coupon Analytics (Phase 3, Task 20) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <Package className="h-5 w-5 text-indigo-600" />
                Coupon Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {coupons && coupons.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                        <th className="p-3 pl-5">Code</th>
                        <th className="p-3 text-center">Uses</th>
                        <th className="p-3 text-right pr-5">Total Saved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map((c: any) => (
                        <tr key={c.code} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="p-3 pl-5">
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                              {c.code}
                            </span>
                          </td>
                          <td className="p-3 text-center text-gray-600">
                            {c.usageCount} / {c.maxUses || '∞'}
                          </td>
                          <td className="p-3 text-right pr-5 text-gray-900 font-bold">
                            ₹{c.totalRevenueSaved.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">No coupon data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coupon Analytics Table (Phase 3, Task 20) */}
        <div className="mb-8">
          <CouponAnalyticsTable data={couponAnalytics} />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/users')}>
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">View and manage all user accounts</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/products')}>
            <CardHeader>
              <CardTitle>Manage Products</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Add, edit, and delete products</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/categories')}>
            <CardHeader>
              <CardTitle>Manage Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Organize products into categories</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/orders')}>
            <CardHeader>
              <CardTitle>Manage Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">View and update order status</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/banners')}>
            <CardHeader>
              <CardTitle>Manage Banners</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Create and schedule seasonal promotional banners</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/recipes')}>
            <CardHeader>
              <CardTitle>Manage Recipes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Add and edit Indian recipes linked to your spice products</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/coupons')}>
            <CardHeader>
              <CardTitle>Manage Coupons</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Create and manage discount coupon codes for customers</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
