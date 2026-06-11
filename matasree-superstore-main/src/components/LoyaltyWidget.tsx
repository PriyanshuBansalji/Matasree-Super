/**
 * LoyaltyWidget
 * Displays current points balance. On checkout, also shows a redeem UI.
 *
 * Requirements: 10.4
 */
import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Gift, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';

interface LoyaltyBalance {
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
}

interface LoyaltyWidgetProps {
  isCheckout?: boolean;
  orderSubtotal?: number;
  onRedeemSuccess?: (discountAmount: number) => void;
}

const LoyaltyWidget = ({
  isCheckout = false,
  orderSubtotal = 0,
  onRedeemSuccess,
}: LoyaltyWidgetProps) => {
  const { isAuthenticated } = useAuthStore();

  const [balance, setBalance] = useState<LoyaltyBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Redeem state (checkout mode only)
  const [pointsInput, setPointsInput] = useState<number>(1);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchBalance = async () => {
      setBalanceLoading(true);
      setBalanceError(null);
      try {
        const response: any = await apiClient.getLoyaltyBalance();
        const data = response?.data ?? response;
        setBalance(data);
      } catch (err: any) {
        setBalanceError(err?.response?.data?.message || 'Failed to load loyalty balance');
      } finally {
        setBalanceLoading(false);
      }
    };

    fetchBalance();
  }, [isAuthenticated]);

  // Guard: only render for authenticated users
  if (!isAuthenticated) return null;

  const handleRedeem = async () => {
    if (!balance || pointsInput < 1) return;

    setRedeemLoading(true);
    setRedeemError(null);
    try {
      const response: any = await apiClient.redeemLoyaltyPoints({
        pointsRequested: pointsInput,
        orderSubtotal,
      });
      const data = response?.data ?? response;
      const discount: number = data?.discountAmount ?? 0;
      setAppliedDiscount(discount);
      onRedeemSuccess?.(discount);
      // Refresh balance display
      setBalance((prev) =>
        prev ? { ...prev, balance: prev.balance - pointsInput } : prev
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Redemption failed. Please try again.';
      setRedeemError(msg);
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleRemove = () => {
    setAppliedDiscount(null);
    setRedeemError(null);
    setPointsInput(1);
    onRedeemSuccess?.(0);
    // Restore balance
    if (balance && appliedDiscount !== null) {
      // Re-fetch to get accurate balance
      apiClient.getLoyaltyBalance().then((response: any) => {
        const data = response?.data ?? response;
        setBalance(data);
      }).catch(() => {});
    }
  };

  // ── Skeleton loader ──────────────────────────────────────────────────────
  if (balanceLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-primary" />
          <div className="h-5 w-32 bg-secondary animate-pulse rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-10 w-24 bg-secondary animate-pulse rounded" />
          <div className="h-4 w-48 bg-secondary animate-pulse rounded" />
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (balanceError) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Star className="w-5 h-5 text-primary" />
          <h3 className="font-serif text-lg font-bold">Loyalty Points</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{balanceError}</span>
        </div>
      </div>
    );
  }

  const currentBalance = balance?.balance ?? 0;
  const worthInRupees = (currentBalance * 0.5).toFixed(0);

  // ── Profile mode ─────────────────────────────────────────────────────────
  if (!isCheckout) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Gift className="w-5 h-5 text-primary" />
          <h3 className="font-serif text-lg font-bold">Loyalty Points</h3>
        </div>

        <div className="text-center mb-6">
          <p className="text-5xl font-serif font-bold text-primary">{currentBalance}</p>
          <p className="text-muted-foreground text-sm mt-1">Points available (worth ₹{worthInRupees})</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/40 rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-foreground">{balance?.lifetimeEarned ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Lifetime Earned</p>
          </div>
          <div className="bg-secondary/40 rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-foreground">{balance?.lifetimeRedeemed ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Lifetime Redeemed</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Checkout mode ────────────────────────────────────────────────────────
  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg font-bold flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" /> Loyalty Points
        </h3>
        <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
          {currentBalance} pts
        </span>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        You have <strong className="text-foreground">{currentBalance}</strong> points (worth ₹{worthInRupees})
      </p>

      {currentBalance === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No points available to redeem yet.
        </p>
      ) : appliedDiscount !== null ? (
        // ── Success state ─────────────────────────────────────────────────
        <div>
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium flex-1">
              ₹{appliedDiscount.toFixed(2)} discount applied!
            </span>
            <button
              onClick={handleRemove}
              className="text-green-600 hover:text-red-500 transition-colors ml-2"
              aria-label="Remove loyalty discount"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">
            <button
              onClick={handleRemove}
              className="underline hover:text-foreground transition-colors"
            >
              Remove
            </button>
          </p>
        </div>
      ) : (
        // ── Redeem form ───────────────────────────────────────────────────
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              max={currentBalance}
              value={pointsInput}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                  setPointsInput(Math.min(currentBalance, Math.max(1, val)));
                }
              }}
              placeholder="Points to redeem"
              className="bg-secondary/30 rounded-xl"
              aria-label="Points to redeem"
            />
            <Button
              onClick={handleRedeem}
              disabled={redeemLoading || pointsInput < 1 || pointsInput > currentBalance}
              variant="outline"
              className="px-5 rounded-xl border-primary text-primary hover:bg-primary hover:text-white transition-all font-bold whitespace-nowrap"
            >
              {redeemLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" /> Applying…
                </>
              ) : (
                'Apply'
              )}
            </Button>
          </div>

          {redeemError && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{redeemError}</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Each point is worth ₹0.50. Max redemption: {currentBalance} pts = ₹{worthInRupees}
          </p>
        </div>
      )}
    </div>
  );
};

export default LoyaltyWidget;
