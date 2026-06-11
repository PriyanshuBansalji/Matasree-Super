import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Users, ShoppingCart, DollarSign, TrendingUp, Package, AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import PageHelmet from '@/components/PageHelmet';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [paymentsData, setPaymentsData] = useState<{
    totalPayments: number;
    razorpayPayments: number;
    codPayments: number;
    paymentMethods: Array<{ _id: string; total: number; count: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.isAdmin && user?.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchStats = async () => {
      try {
        const [statsResponse, analyticsResponse, paymentsResponse] = await Promise.all([
          apiClient.getAdminStats(),
          apiClient.getRevenueAnalytics(),
          apiClient.getPaymentAnalytics(),
        ]);

        // Response structure after interceptor: { success, data: {...}, statusCode }
        if (statsResponse?.data) {
          setStats(statsResponse.data);
        }

        if (analyticsResponse?.data) {
          setAnalytics(analyticsResponse.data);
        }

        if (paymentsResponse?.data) {
          setPaymentsData(paymentsResponse.data);
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
            <CardHeader>
              <CardTitle>Revenue Trends (Last 30 Days)</CardTitle>
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
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">{paymentsData.razorpayPayments}</p>
                      <p className="text-sm text-gray-600">Razorpay</p>
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
                          name: m._id === 'cod' ? 'Cash on Delivery' : 'Razorpay',
                          value: m.count,
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {paymentsData.paymentMethods.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#f97316'} />
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
                      method: m._id === 'cod' ? 'Cash on Delivery' : 'Razorpay',
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
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
