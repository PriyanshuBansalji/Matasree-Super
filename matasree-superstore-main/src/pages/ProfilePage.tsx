import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  User, Mail, Phone, MapPin, Edit2, X, Save, Loader2,
  ShoppingBag, Star, CreditCard, Heart, ChevronRight, Package,
  Copy, Gift,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHelmet from '@/components/PageHelmet';
import { toast } from 'sonner';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0, loyaltyPoints: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Referrals State (Phase 2, Req 10.1)
  const [referrals, setReferrals] = useState<any[]>([]);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralsLoading, setReferralsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let cancelled = false;
    setReferralsLoading(true);
    // Referral code comes from the user profile (field: referralCode)
    setReferralCode((user as any).referralCode ?? '');
    apiClient.get('/referrals')
      .then((res: any) => {
        if (cancelled) return;
        const list = res?.data?.referrals ?? res?.data ?? [];
        setReferrals(Array.isArray(list) ? list : []);
      })
      .catch(() => { if (!cancelled) setReferrals([]); })
      .finally(() => { if (!cancelled) setReferralsLoading(false); });
    return () => { cancelled = true; };
  }, [user, isAuthenticated]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!isAuthenticated && !token) navigate('/login');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setStatsLoading(true);
    Promise.all([
      apiClient.getLoyaltyBalance() as Promise<any>,
      apiClient.getOrders() as Promise<any>,
    ])
      .then(([loyaltyRes, ordersRes]) => {
        if (cancelled) return;
        const points = loyaltyRes?.data?.pointsBalance ?? loyaltyRes?.pointsBalance ?? 0;
        const rawOrders = ordersRes?.data?.data ?? ordersRes?.data ?? ordersRes ?? [];
        const orders = Array.isArray(rawOrders) ? rawOrders : [];
        const active = orders.filter((o: any) => o.orderstatus !== 'cancelled');
        setStats({
          totalOrders: orders.length,
          totalSpent: active.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0),
          loyaltyPoints: points,
        });
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  const handleEditOpen = () => { setEditName(user?.name || ''); setEditPhone(user?.phone || ''); setIsEditing(true); };
  const handleEditCancel = () => setIsEditing(false);

  const handleEditSave = async () => {
    if (!editName.trim()) { toast.error('Name cannot be empty'); return; }
    setIsSaving(true);
    try {
      const res = await apiClient.updateProfile({ name: editName.trim(), phone: editPhone.trim() });
      const updated = (res as any)?.data?.user ?? (res as any)?.data ?? null;
      useAuthStore.getState().setUser(
        updated ? { ...user!, ...updated } : { ...user!, name: editName.trim(), phone: editPhone.trim() }
      );
      toast.success('Profile updated!');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const memberYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <PageHelmet
        title="My Profile | Matasree Super Masale"
        description="Manage your Matasree Super Masale account."
        canonicalUrl="https://matasreesuper.com/profile"
        noIndex={true}
      />
      <Navbar />

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <div className="relative pt-16 overflow-hidden">
        <div
          className="h-48 md:h-56 w-full"
          style={{ background: 'linear-gradient(135deg, #3E2314 0%, #8B4513 40%, #D63220 100%)' }}
        >
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #F4D03F 0%, transparent 50%), radial-gradient(circle at 80% 20%, #E65C19 0%, transparent 50%)' }}
          />
          {/* Spice emoji particles */}
          {['🌶️', '✨', '🧄', '🌿', '⭐'].map((e, i) => (
            <span key={i} className="absolute text-2xl opacity-20 select-none"
              style={{ left: `${10 + i * 18}%`, top: `${20 + (i % 3) * 20}%` }}>{e}</span>
          ))}
        </div>

        {/* Avatar — overlaps banner */}
        <div className="container mx-auto px-4">
          <div className="relative -mt-14 flex items-end gap-5 pb-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="w-24 h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-2xl border-4 border-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #D63220 0%, #E65C19 50%, #8B4513 100%)' }}
            >
              {initials}
            </motion.div>
            <div className="pb-2">
              <h1 className="font-serif text-2xl md:text-3xl font-black text-[#3E2314]">{user.name}</h1>
              <p className="text-[#3E2314]/50 text-sm font-medium">Member since {memberYear} · {user.email}</p>
            </div>
            {!isEditing && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEditOpen}
                className="ml-auto mb-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3E2314] text-white text-sm font-bold hover:bg-[#5A3520] transition-colors shadow-md"
              >
                <Edit2 className="w-4 h-4" /> Edit Profile
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 pb-16">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8">
          {[
            { label: 'Total Orders', value: stats.totalOrders, icon: Package, color: 'from-orange-500 to-red-500', light: 'bg-orange-50', text: 'text-orange-700' },
            { label: 'Total Spent', value: statsLoading ? null : `₹${stats.totalSpent.toFixed(0)}`, icon: CreditCard, color: 'from-blue-500 to-indigo-500', light: 'bg-blue-50', text: 'text-blue-700' },
            { label: 'Loyalty Points', value: stats.loyaltyPoints, icon: Star, color: 'from-amber-400 to-yellow-500', light: 'bg-amber-50', text: 'text-amber-700' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-[#3E2314]/8 flex flex-col gap-3"
            >
              <div className={`w-10 h-10 rounded-xl ${s.light} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.text}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#3E2314]/50 uppercase tracking-wider">{s.label}</p>
                <p className={`text-xl md:text-2xl font-black mt-0.5 ${s.text}`}>
                  {statsLoading ? <Skeleton className="h-7 w-16 inline-block" /> : s.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Profile Card ────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#3E2314]/8 overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-[#3E2314]/8 flex items-center justify-between">
              <div>
                <h2 className="font-serif font-bold text-lg text-[#3E2314]">Account Information</h2>
                <p className="text-sm text-[#3E2314]/50">Your personal details</p>
              </div>
              {isEditing && (
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full">Editing</span>
              )}
            </div>

            <div className="p-6">
              {isEditing ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name" className="text-sm font-semibold text-[#3E2314]/70 flex items-center gap-2">
                        <User className="w-4 h-4" /> Full Name
                      </Label>
                      <Input
                        id="edit-name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Your name"
                        disabled={isSaving}
                        className="border-[#3E2314]/20 focus-visible:ring-primary rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone" className="text-sm font-semibold text-[#3E2314]/70 flex items-center gap-2">
                        <Phone className="w-4 h-4" /> Phone Number
                      </Label>
                      <Input
                        id="edit-phone"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="10-digit number"
                        maxLength={10}
                        disabled={isSaving}
                        className="border-[#3E2314]/20 focus-visible:ring-primary rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-[#3E2314]/70 flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Email Address
                      </Label>
                      <p className="text-[#3E2314] font-medium text-sm py-2">{user.email}</p>
                      <p className="text-xs text-[#3E2314]/40">Email cannot be changed.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      onClick={handleEditSave}
                      disabled={isSaving}
                      className="bg-gradient-to-r from-[#D63220] to-[#E65C19] text-white rounded-xl font-bold px-6 hover:opacity-90"
                    >
                      {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
                    </Button>
                    <Button variant="outline" onClick={handleEditCancel} disabled={isSaving} className="rounded-xl border-[#3E2314]/20">
                      <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[
                      { icon: User, label: 'Full Name', value: user.name },
                      { icon: Mail, label: 'Email Address', value: user.email },
                      ...(user.phone ? [{ icon: Phone, label: 'Phone', value: user.phone }] : []),
                    ].map((field, i) => (
                      <div key={i} className="group">
                        <p className="text-xs font-semibold text-[#3E2314]/40 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                          <field.icon className="w-3.5 h-3.5" /> {field.label}
                        </p>
                        <p className="text-[#3E2314] font-semibold">{field.value}</p>
                      </div>
                    ))}
                    <div>
                      <p className="text-xs font-semibold text-[#3E2314]/40 uppercase tracking-wider mb-1.5">Member Since</p>
                      <p className="text-[#3E2314] font-semibold">{memberYear}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-[#3E2314]/8">
                    <Button onClick={handleEditOpen}
                      className="bg-gradient-to-r from-[#D63220] to-[#E65C19] text-white rounded-xl font-bold hover:opacity-90"
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Right Column ────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl shadow-sm border border-[#3E2314]/8 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-[#3E2314]/8">
                <h3 className="font-serif font-bold text-[#3E2314]">Quick Actions</h3>
              </div>
              <div className="p-3 space-y-1">
                {[
                  { icon: ShoppingBag, label: 'My Orders', sub: `${stats.totalOrders} orders`, path: '/orders', color: 'text-orange-600 bg-orange-50' },
                  { icon: MapPin, label: 'Addresses', sub: 'Manage delivery addresses', path: '/addresses', color: 'text-blue-600 bg-blue-50' },
                  { icon: Heart, label: 'Wishlist', sub: 'Saved products', path: '/wishlist', color: 'text-red-500 bg-red-50' },
                ].map((action, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ x: 3 }}
                    onClick={() => navigate(action.path)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#FAF7F2] transition-colors group"
                  >
                    <div className={`w-9 h-9 rounded-xl ${action.color} flex items-center justify-center shrink-0`}>
                      <action.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-[#3E2314]">{action.label}</p>
                      <p className="text-xs text-[#3E2314]/40">{action.sub}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#3E2314]/30 group-hover:text-[#3E2314]/60 transition-colors" />
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Loyalty Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl overflow-hidden shadow-sm"
              style={{ background: 'linear-gradient(135deg, #3E2314 0%, #8B4513 60%, #D63220 100%)' }}
            >
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <Star className="w-4 h-4 text-[#F4D03F] fill-[#F4D03F]" />
                  </div>
                  <span className="text-white/80 text-sm font-bold">Loyalty Rewards</span>
                </div>
                <p className="text-white/60 text-xs mb-1">Available Points</p>
                <p className="text-white text-4xl font-black">
                  {statsLoading ? <Skeleton className="h-10 w-16 bg-white/20" /> : stats.loyaltyPoints}
                </p>
                <div className="mt-4 pt-4 border-t border-white/15">
                  <p className="text-white/50 text-xs">Earn 1 point per ₹10 spent</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Referrals Section (Req 10.1, 10.2, 10.3, 10.5) ─────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6 bg-white rounded-2xl shadow-sm border border-[#3E2314]/8 overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-[#3E2314]/8 flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#D63220]" />
            <h2 className="font-serif font-bold text-lg text-[#3E2314]">Referrals</h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Referral code + invite link */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <p className="text-xs font-semibold text-[#3E2314]/50 uppercase mb-1">Your Referral Code</p>
                <div className="flex items-center gap-2 bg-[#FAF7F2] rounded-xl px-4 py-2 border border-[#3E2314]/10">
                  <span className="font-mono font-bold text-[#D63220] tracking-widest flex-1">
                    {referralCode || '—'}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={!referralCode}
                    onClick={() => {
                      navigator.clipboard.writeText(referralCode);
                      toast.success('Code copied!');
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-[#3E2314]/50 uppercase mb-1">Invite Link</p>
                <div className="flex items-center gap-2 bg-[#FAF7F2] rounded-xl px-4 py-2 border border-[#3E2314]/10">
                  <span className="text-sm text-[#3E2314]/70 truncate flex-1">
                    {referralCode
                      ? `https://matasreesuper.com/register?ref=${referralCode}`
                      : '—'}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={!referralCode}
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `https://matasreesuper.com/register?ref=${referralCode}`
                      );
                      toast.success('Link copied!');
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Referral history table */}
            {referralsLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : referrals.length === 0 ? (
              <p className="text-sm text-[#3E2314]/50 py-4 text-center">
                You haven't referred anyone yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referee</TableHead>
                    <TableHead>Date Joined</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((r: any) => (
                    <TableRow key={r._id}>
                      <TableCell>{r.referee?.name ?? r.refereeName ?? r.refereeId ?? 'User'}</TableCell>
                      <TableCell>
                        {new Date(r.createdAt).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            r.status === 'rewarded'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {r.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default ProfilePage;
