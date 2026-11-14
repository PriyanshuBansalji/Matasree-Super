import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, Plus, Trash2, Ticket, Percent, IndianRupee, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import PageHelmet from '@/components/PageHelmet';

interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number;
  maxUses: number;
  usageCount: number;
  isUsed: boolean;
  expiresAt: string;
  source: string;
  createdAt: string;
}

const emptyForm = {
  code: '',
  discountType: 'percentage' as 'percentage' | 'fixed',
  discountValue: 10,
  minOrderAmount: 0,
  maxDiscount: 0,
  maxUses: 0,
  expiresInDays: 30,
};

const AdminCoupons = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchCoupons();
  }, [user, navigate]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response: any = await apiClient.getAdminCoupons({ limit: 100 });
      const data = response?.data?.coupons ?? [];
      setCoupons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.discountValue <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.createAdminCoupon({
        code: formData.code.trim() || undefined,
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        minOrderAmount: formData.minOrderAmount,
        maxDiscount: formData.maxDiscount,
        maxUses: formData.maxUses,
        expiresInDays: formData.expiresInDays,
      });
      toast.success('Coupon created successfully!');
      setFormData({ ...emptyForm });
      setShowForm(false);
      fetchCoupons();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to create coupon';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await apiClient.deleteAdminCoupon(id);
      toast.success('Coupon deleted');
      setCoupons((prev) => prev.filter((c) => c._id !== id));
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(`Copied: ${code}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date();
    const expiry = new Date(coupon.expiresAt);
    if (expiry < now) return { label: 'Expired', variant: 'destructive' as const };
    if (coupon.maxUses > 0 && coupon.usageCount >= coupon.maxUses) return { label: 'Used Up', variant: 'secondary' as const };
    return { label: 'Active', variant: 'default' as const };
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      <PageHelmet
        title="Admin — Coupons | Matasree Super"
        description="Manage discount coupon codes"
        canonicalUrl="https://matasreesuper.com/admin/coupons"
      />
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Ticket className="w-6 h-6 text-brand-chili" />
                Coupon Codes
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Create and manage discount codes for customers</p>
            </div>
          </div>
          <Button
            onClick={() => { setShowForm(!showForm); setFormData({ ...emptyForm }); }}
            className="bg-brand-chili hover:bg-brand-chili/90 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            New Coupon
          </Button>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card className="mb-8 border-brand-chili/20 shadow-lg animate-in slide-in-from-top-2 duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Ticket className="w-5 h-5 text-brand-chili" />
                Create New Coupon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCoupon} className="space-y-5">
                {/* Row 1: Code + Discount Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Coupon Code <span className="text-muted-foreground">(optional — auto-generated if empty)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                      placeholder="e.g. DIWALI20"
                      maxLength={20}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-brand-chili/30 focus:border-brand-chili outline-none transition-all uppercase font-mono tracking-wider text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Discount Type</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, discountType: 'percentage' })}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all font-medium ${
                          formData.discountType === 'percentage'
                            ? 'border-brand-chili bg-brand-chili/10 text-brand-chili'
                            : 'border-border text-muted-foreground hover:border-brand-chili/50'
                        }`}
                      >
                        <Percent className="w-4 h-4" />
                        Percentage (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, discountType: 'fixed' })}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all font-medium ${
                          formData.discountType === 'fixed'
                            ? 'border-brand-chili bg-brand-chili/10 text-brand-chili'
                            : 'border-border text-muted-foreground hover:border-brand-chili/50'
                        }`}
                      >
                        <IndianRupee className="w-4 h-4" />
                        Fixed (₹)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 2: Discount Value + Min Order */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Discount Value {formData.discountType === 'percentage' ? '(%)' : '(₹)'}
                    </label>
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                      min={0}
                      max={formData.discountType === 'percentage' ? 100 : undefined}
                      required
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-brand-chili/30 focus:border-brand-chili outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Min Order Amount (₹) <span className="text-muted-foreground">— 0 = no minimum</span>
                    </label>
                    <input
                      type="number"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                      min={0}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-brand-chili/30 focus:border-brand-chili outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Row 3: Max Discount + Max Uses */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Max Discount Cap (₹) <span className="text-muted-foreground">— 0 = no cap</span>
                    </label>
                    <input
                      type="number"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                      min={0}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-brand-chili/30 focus:border-brand-chili outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Max Uses <span className="text-muted-foreground">— 0 = unlimited</span>
                    </label>
                    <input
                      type="number"
                      value={formData.maxUses}
                      onChange={(e) => setFormData({ ...formData, maxUses: Number(e.target.value) })}
                      min={0}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-brand-chili/30 focus:border-brand-chili outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Expires In (days)
                    </label>
                    <input
                      type="number"
                      value={formData.expiresInDays}
                      onChange={(e) => setFormData({ ...formData, expiresInDays: Number(e.target.value) })}
                      min={1}
                      required
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-brand-chili/30 focus:border-brand-chili outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-brand-chili hover:bg-brand-chili/90 text-white min-w-[140px]"
                  >
                    {submitting ? 'Creating...' : 'Create Coupon'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Coupons Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">All Coupons ({coupons.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading coupons…</div>
            ) : coupons.length === 0 ? (
              <div className="p-12 text-center">
                <Ticket className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground font-medium">No coupons yet</p>
                <p className="text-sm text-muted-foreground mt-1">Click "New Coupon" to create your first discount code</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Min Order</TableHead>
                      <TableHead className="hidden md:table-cell">Max Cap</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead className="hidden md:table-cell">Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((coupon) => {
                      const status = getCouponStatus(coupon);
                      return (
                        <TableRow key={coupon._id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="bg-brand-chili/10 text-brand-chili px-2 py-1 rounded font-mono font-bold text-sm tracking-wider">
                                {coupon.code}
                              </code>
                              <button
                                onClick={() => handleCopyCode(coupon.code, coupon._id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                                title="Copy code"
                              >
                                {copiedId === coupon._id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">
                              {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                            </span>
                            <span className="text-muted-foreground text-xs ml-1">
                              {coupon.discountType === 'percentage' ? 'off' : 'flat'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {coupon.minOrderAmount > 0 ? `₹${coupon.minOrderAmount}` : '—'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {coupon.maxDiscount > 0 ? `₹${coupon.maxDiscount}` : '—'}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{coupon.usageCount ?? 0}</span>
                            <span className="text-muted-foreground text-xs">
                              {coupon.maxUses > 0 ? ` / ${coupon.maxUses}` : ' / ∞'}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {formatDate(coupon.expiresAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(coupon._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default AdminCoupons;
