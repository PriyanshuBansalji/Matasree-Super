/**
 * OrderTimeline
 *
 * Renders the order status progression:
 *   pending → confirmed → shipped → delivered
 * with "cancelled" as a terminal branch.
 *
 * Requirements: 18.5, 31.7, 32.4
 */

import { useState } from 'react';
import { CheckCircle2, Circle, Package, ClipboardCheck, Truck, Home, XCircle, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { apiClient } from '@/services/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderTimelineProps {
  currentStatus: OrderStatus;
  orderId: string;
  couponCode?: string;
  discountAmount?: number;
  onCancelSuccess: () => void;
}

// ─── Step config ───────────────────────────────────────────────────────────────

interface StepConfig {
  key: OrderStatus;
  label: string;
  Icon: React.ElementType;
}

const STEPS: StepConfig[] = [
  { key: 'pending',   label: 'Order Placed',  Icon: Package },
  { key: 'confirmed', label: 'Confirmed',      Icon: ClipboardCheck },
  { key: 'shipped',   label: 'Shipped',        Icon: Truck },
  { key: 'delivered', label: 'Delivered',      Icon: Home },
];

const STEP_ORDER: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getStepIndex = (status: OrderStatus): number =>
  STEP_ORDER.indexOf(status);

// ─── Component ─────────────────────────────────────────────────────────────────

const OrderTimeline = ({
  currentStatus,
  orderId,
  couponCode,
  discountAmount,
  onCancelSuccess,
}: OrderTimelineProps) => {
  const [cancelling, setCancelling] = useState(false);

  const isCancelled = currentStatus === 'cancelled';
  const currentIndex = isCancelled ? -1 : getStepIndex(currentStatus);
  const canCancel = currentStatus === 'pending' || currentStatus === 'confirmed';

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await apiClient.cancelOrder(orderId);
      toast.success('Order cancelled successfully.');
      onCancelSuccess();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to cancel order. Please try again.';
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Cancelled banner ─────────────────────────────────────────────────── */}
      {isCancelled ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Order Cancelled</p>
            <p className="text-sm text-red-600">This order has been cancelled and will not be processed.</p>
          </div>
        </div>
      ) : (
        /* ── Main timeline ───────────────────────────────────────────────────── */
        <div className="relative">
          {/* Vertical connector line (mobile) / hidden on lg */}
          <div
            className="absolute left-5 top-5 bottom-5 w-px bg-border lg:hidden"
            aria-hidden="true"
          />

          {/* Horizontal connector line (desktop) */}
          <div
            className="absolute hidden lg:block top-5 left-[2.5rem] right-[2.5rem] h-px bg-border"
            aria-hidden="true"
          />

          {/* Steps */}
          <ol className="relative flex flex-col gap-6 lg:flex-row lg:gap-0 lg:justify-between">
            {STEPS.map((step, idx) => {
              const isCompleted = idx < currentIndex;
              const isCurrent  = idx === currentIndex;
              const isFuture   = idx > currentIndex;
              const { Icon }   = step;

              return (
                <li
                  key={step.key}
                  className="flex items-start gap-3 lg:flex-col lg:items-center lg:flex-1 lg:gap-2"
                >
                  {/* Icon bubble */}
                  <div
                    className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                      isCompleted
                        ? 'border-green-600 bg-green-50'
                        : isCurrent
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-background'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : isCurrent ? (
                      <Icon className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Label */}
                  <div className="pt-1 lg:pt-0 lg:text-center">
                    <p
                      className={`text-sm font-medium ${
                        isCompleted
                          ? 'text-green-700'
                          : isCurrent
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </p>
                    {isFuture && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5">Upcoming</p>
                    )}
                    {isCompleted && (
                      <p className="text-xs text-green-600/80 mt-0.5">Completed</p>
                    )}
                    {isCurrent && (
                      <p className="text-xs text-primary/80 mt-0.5">In progress</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* ── Coupon / discount row ─────────────────────────────────────────────── */}
      {discountAmount != null && discountAmount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm">
          <Tag className="h-4 w-4 flex-shrink-0 text-green-600" />
          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
            {couponCode && (
              <span className="font-medium text-green-700">
                Coupon Applied:{' '}
                <span className="font-mono tracking-wide">{couponCode}</span>
              </span>
            )}
            <span className="text-green-600">You saved ₹{discountAmount.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* ── Cancel Order button ───────────────────────────────────────────────── */}
      {canCancel && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={cancelling}
              className="w-full sm:w-auto"
            >
              {cancelling ? 'Cancelling…' : 'Cancel Order'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The order will be cancelled and any eligible
                refund will be processed automatically.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Order</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, Cancel Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default OrderTimeline;
