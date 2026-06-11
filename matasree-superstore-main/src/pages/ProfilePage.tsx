import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { User, Mail, Phone, MapPin, Edit2, Copy, Check, Users, Gift } from 'lucide-react';
import PageHelmet from '@/components/PageHelmet';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ReferralEntry {
  _id: string;
  referee: { _id: string; name: string; email: string };
  code: string;
  status: 'pending' | 'rewarded';
  rewardedAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// ProfilePage
// ---------------------------------------------------------------------------
const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  // --- referral state ---
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);
  const [referralLoading, setReferralLoading] = useState(true);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // auth guard
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!isAuthenticated && !token) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // fetch referral data in parallel
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setReferralLoading(true);
    setReferralError(null);

    Promise.all([
      (apiClient.getReferralCode() as Promise<any>),
      (apiClient.getReferralHistory() as Promise<any>),
    ])
      .then(([codeRes, historyRes]) => {
        if (cancelled) return;
        setReferralCode(codeRes?.data?.referralCode ?? null);
        setReferrals(historyRes?.data?.referrals ?? []);
      })
      .catch(() => {
        if (!cancelled) setReferralError('Unable to load referral information');
      })
      .finally(() => {
        if (!cancelled) setReferralLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleCopy = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <PageHelmet
        title="My Profile | Matasree Super Masale"
        description="Manage your Matasree Super Masale account — view and update personal information, referral code, and preferences."
        canonicalUrl="https://matasreesuper.com/profile"
        noIndex={true}
      />
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Avatar */}
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-spice flex items-center justify-center text-white">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                  <p className="text-muted-foreground">Member since {new Date().getFullYear()}</p>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
                {/* Name */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  <p className="text-lg font-medium text-foreground">{user.name}</p>
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <p className="text-lg font-medium text-foreground">{user.email}</p>
                </div>

                {/* Phone */}
                {user.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </label>
                    <p className="text-lg font-medium text-foreground">{user.phone}</p>
                  </div>
                )}

                {/* User ID */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">User ID</label>
                  <p className="text-sm font-mono text-muted-foreground">{user.id?.slice(0, 12)}...</p>
                </div>
              </div>

              {/* Edit Button */}
              <div className="pt-4 border-t">
                <Button className="bg-gradient-spice hover:opacity-90 text-white">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/orders')}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  View Orders
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/addresses')}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Manage Addresses
                </Button>
              </CardContent>
            </Card>

            {/* Account Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Orders</span>
                  <span className="font-bold text-foreground">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Spent</span>
                  <span className="font-bold text-foreground">₹0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Loyalty Points</span>
                  <span className="font-bold text-foreground">0</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ----------------------------------------------------------------
              Referral Program — full-width row spanning all 3 columns
          ---------------------------------------------------------------- */}
          <Card className="md:col-span-3">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                <CardTitle>Referral Program</CardTitle>
              </div>
              <CardDescription>
                Share your code with friends. When they make their first purchase, you earn 50 loyalty points!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

              {/* --- Referral Code --- */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Your Referral Code
                </h3>

                {referralLoading ? (
                  <Skeleton className="h-12 w-64 rounded-md" />
                ) : referralError ? (
                  <p className="text-sm text-destructive">{referralError}</p>
                ) : referralCode ? (
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 border rounded-md bg-muted font-mono text-lg tracking-widest font-semibold text-foreground select-all">
                      {referralCode}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="flex items-center gap-2"
                      aria-label="Copy referral code"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Generating your code...</p>
                )}
              </div>

              {/* --- Referral History --- */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Referral History</h3>

                {referralLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-md" />
                    ))}
                  </div>
                ) : referralError ? (
                  <p className="text-sm text-destructive">Unable to load referral history</p>
                ) : referrals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border rounded-md bg-muted/30">
                    <Users className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">No referrals yet. Share your code to get started!</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Friend</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reward Earned</TableHead>
                          <TableHead>Date Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referrals.map((entry) => (
                          <TableRow key={entry._id}>
                            <TableCell className="font-medium">
                              {entry.referee?.name ?? '—'}
                            </TableCell>
                            <TableCell>
                              {entry.status === 'rewarded' ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                  Rewarded
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {entry.status === 'rewarded' ? '50 points' : '—'}
                            </TableCell>
                            <TableCell>
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
