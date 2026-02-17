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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.isAdmin && user?.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchStats = async () => {
      try {
        const [statsResponse, analyticsResponse] = await Promise.all([
          apiClient.getAdminStats(),
          apiClient.getRevenueAnalytics()
        ]);

        if (statsResponse?.data?.data) {
          setStats(statsResponse.data.data);
        }

        if (analyticsResponse?.data?.data) {
          setAnalytics(analyticsResponse.data.data);
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

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
