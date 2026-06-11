/**
 * OrderDetailPage
 *
 * Shows full details for a single order:
 *  - Order header (number, date, payment status)
 *  - OrderTimeline (status progression + cancel + coupon)
 *  - Order items table
 *  - Order summary (subtotal / shipping / discount / total)
 *  - Shipping address
 *
 * Requirements: 18.5, 31.7, 32.4
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useOrder } from '@/hooks/useApi';
import OrderTimeline, { type OrderStatus } from '@/components/OrderTimeline';
import PageHelmet from '@/components/PageHelmet';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const paymentStatusVariant = (
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status?.toLowerCase()) {
    case 'paid':
    case 'completed':
      return 'default';
    case 'failed':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const paymentStatusLabel = (status?: string): string => {
  if (!status) return 'Pending';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// ─── Loading skeleton ──────────────────────────────────────────────────────────

const OrderDetailSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-64" />
    <Card>
      <CardContent className="pt-6 space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

// ─── Component ─────────────────────────────────────────────────────────────────

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: orderResponse, isLoading, isError, error } = useOrder(id ?? '');

  // The API wraps the order in { data: { data: order } }
  // Inspect the raw shape from the api interceptor (which returns response.data)
  const order = (orderResponse as any)?.data ?? (orderResponse as any);

  const handleCancelSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['order', id] });
    queryClient.invalidateQueries({ queryKey: ['my-orders'] });
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Button
            variant="ghost"
            className="mb-6 -ml-2"
            onClick={() => navigate('/orders')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <OrderDetailSkeleton />
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (isError || !order) {
    const errMsg =
      (error as any)?.response?.data?.message ||
      (error as any)?.message ||
      'Order not found.';
    return (
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Button
            variant="ghost"
            className="mb-6 -ml-2"
            onClick={() => navigate('/orders')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <Card>
            <CardContent className="pt-6 text-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                Order not found
              </h3>
              <p className="text-muted-foreground mb-6">{errMsg}</p>
              <Button onClick={() => navigate('/orders')}>Go to My Orders</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const orderId: string        = order._id ?? id ?? '';
  const orderNumber: string    = order.orderNumber ?? `#${orderId.slice(-8).toUpperCase()}`;
  const displayNumber: string  = orderId.slice(-8).toUpperCase();
  const createdAt: string      = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—';

  const orderstatus: OrderStatus = (order.orderstatus as OrderStatus) ?? 'pending';
  const paymentStatus: string    = order.paymentStatus ?? '';
  const items: any[]             = order.items ?? [];
  const shippingAddress: any     = order.shippingAddress ?? {};

  const discountAmount: number    = Number(order.discountAmount) || 0;
  const couponCode: string        = order.couponCode ?? '';
  const totalAmount: number       = Number(order.totalAmount) || 0;
  const shippingFee: number       = 0; // fee is baked into totalAmount on this backend
  const subtotal: number          = items.reduce(
    (sum: number, item: any) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <PageHelmet
        title={`Order ${displayNumber} | Matasree Super Masale`}
        description={`View details for your order ${displayNumber} from Matasree Super Masale.`}
        canonicalUrl={`https://matasreesuper.com/order/${orderId}`}
        noIndex={true}
      />
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-6 -ml-2"
          onClick={() => navigate('/orders')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>

        {/* ── Order header ──────────────────────────────────────────────────── */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="font-serif text-2xl">
                  Order #{displayNumber}
                </CardTitle>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{createdAt}</span>
                </div>
              </div>
              <Badge variant={paymentStatusVariant(paymentStatus)} className="text-sm">
                Payment: {paymentStatusLabel(paymentStatus)}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* ── Order timeline ─────────────────────────────────────────────────── */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline
              currentStatus={orderstatus}
              orderId={orderId}
              couponCode={couponCode || undefined}
              discountAmount={discountAmount}
              onCancelSuccess={handleCancelSuccess}
            />
          </CardContent>
        </Card>

        {/* ── Order items ────────────────────────────────────────────────────── */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Items Ordered</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No items found.</p>
            ) : (
              items.map((item: any, idx: number) => {
                const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
                return (
                  <div key={item.productId ?? idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    {/* Product image */}
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name ?? 'Product'}
                        className="h-16 w-16 rounded-lg object-cover flex-shrink-0 border"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 border">
                        <Package className="h-7 w-7 text-muted-foreground/50" />
                      </div>
                    )}

                    {/* Item details */}
                    <div className="flex flex-1 flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{item.name ?? '—'}</p>
                        <p className="text-sm text-muted-foreground">
                          ₹{(Number(item.price) || 0).toFixed(2)} × {item.quantity ?? 1}
                        </p>
                      </div>
                      <p className="font-semibold text-foreground">
                        ₹{lineTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* ── Order summary ────────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shippingFee === 0 ? 'Free' : `₹${shippingFee.toFixed(2)}`}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    Discount
                    {couponCode ? ` (${couponCode})` : ''}
                  </span>
                  <span>−₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* ── Shipping address ─────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-0.5">
              {shippingAddress.name && (
                <p className="font-medium text-foreground">{shippingAddress.name}</p>
              )}
              {shippingAddress.addressLine1 && (
                <p className="text-muted-foreground">{shippingAddress.addressLine1}</p>
              )}
              {shippingAddress.addressLine2 && (
                <p className="text-muted-foreground">{shippingAddress.addressLine2}</p>
              )}
              {(shippingAddress.city || shippingAddress.state) && (
                <p className="text-muted-foreground">
                  {[shippingAddress.city, shippingAddress.state]
                    .filter(Boolean)
                    .join(', ')}
                  {shippingAddress.pincode ? ` — ${shippingAddress.pincode}` : ''}
                </p>
              )}
              {shippingAddress.phone && (
                <p className="text-muted-foreground pt-1">📞 {shippingAddress.phone}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
