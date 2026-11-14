# Design Document: Matasree Full Improvement

## Overview

This document describes the concrete implementation plan for all 17 improvements to the Matasree Store platform. Each requirement maps to exact file paths, function signatures, schema changes, and API endpoint specifications. The project uses Node.js + Express + TypeScript + MongoDB + Redis on the backend (`matasree-backend`) and React 18 + Vite + TypeScript + Tailwind + shadcn/ui + Zustand on the frontend (`matasree-superstore-main`).

---

## Architecture Summary

```
matasree-backend/
  src/
    controllers/
      orderController.ts       ← Reqs 1, 3, 8
      authController.ts        ← Req 5
      adminController.ts       ← Reqs 9, 11, 12, 13, 14, 15
      productController.ts     ← Req 4
      reviewController.ts      ← Req 7
    models/
      Order.ts                 ← Reqs 1, 3
    middleware/
      upload.ts                ← Req 4
    utils/
      email.ts                 ← Req 8
    routes/
      adminRoutes.ts           ← Reqs 11, 12, 13, 14, 15
      productRoutes.ts         ← Req 4

matasree-superstore-main/
  src/
    App.tsx                    ← Req 6
    pages/
      CheckoutPage.tsx         ← Req 2
      ProfilePage.tsx          ← Req 10
      AdminDashboard.tsx       ← Reqs 11, 12, 13, 14
    services/
      api.ts                   ← Reqs 11, 12, 13, 14, 15
  public/
    robots.txt                 ← Req 16

docker-compose.yml             ← Req 17
```

---

## Requirement 1: Unique Order Number Generation

### File: `matasree-backend/src/controllers/orderController.ts`

**Change**: Replace the `const orderNumber = \`ORD-${Date.now()}\`` line (~line 70) with:

```typescript
import crypto from 'crypto';

const orderNumber = `ORD-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
```

This produces strings in the format `ORD-1716000000000-A1B2C3D4`. The UUID suffix makes simultaneous requests collision-resistant even when `Date.now()` returns the same millisecond.

**Change**: Add duplicate-key error handler around `Order.create(...)`:

```typescript
try {
  const order = await Order.create({ ..., orderNumber });
} catch (err: any) {
  if (err.code === 11000 && err.keyPattern?.orderNumber) {
    return res.status(409).json(new ApiResponse(false, 'Duplicate order number; please retry', null, 409));
  }
  throw err;
}
```

### File: `matasree-backend/src/models/Order.ts`

**Change**: The `orderNumber` field already has `unique: true` in the schema, so no schema change is needed. Verify the index exists:

```typescript
orderSchema.index({ orderNumber: 1 }, { unique: true, background: true });
```

Add this explicit index declaration after the existing indexes (around line 75) if not already present.

---

## Requirement 2: Eliminate Double Cart Sync at Checkout

### File: `matasree-superstore-main/src/pages/CheckoutPage.tsx`

**Change**: Remove the `await syncCartToBackend()` call at the start of `handlePlaceOrder`.

Current code (approximately line 243):
```typescript
const handlePlaceOrder = async () => {
  // ...
  setIsProcessing(true);
  try {
    // 1. Sync cart to backend   ← DELETE THIS BLOCK
    await syncCartToBackend();

    // 2. Create order
    const orderResponse = await apiClient.createOrder({ ... });
```

After the change:
```typescript
const handlePlaceOrder = async () => {
  if (!selectedAddressId) {
    toast.error('Please select a delivery address');
    return;
  }
  setIsProcessing(true);
  try {
    // Create order directly — cart was already synced in handleProceedToCheckout
    const totalDiscount = (couponDiscount || 0) + (loyaltyDiscount || 0);
    const orderResponse = await apiClient.createOrder({ ... });
```

The `syncCartToBackend` helper function and the `syncCart` call in `handleProceedToCheckout` are **preserved as-is**. Only the duplicated call inside `handlePlaceOrder` is removed.

---

## Requirement 3: Stock Availability Check and Reservation System

### File: `matasree-backend/src/models/Order.ts`

**Add** a new field to the schema:

```typescript
stockReservedAt: {
  type: Date,
  default: null,
},
```

Add to the `IOrder` interface:
```typescript
stockReservedAt?: Date | null;
```

### File: `matasree-backend/src/controllers/orderController.ts`

**Step 1 — Pre-check loop** (insert before `Order.create`, after cart items are assembled):

```typescript
// Req 3.1/3.2: Verify stock for every cart item before creating the order
for (const item of cart.items) {
  const product = await Product.findById(item.productId._id);
  if (!product || product.stock < item.quantity) {
    const name = (product?.name) ?? String(item.productId._id);
    return res.status(400).json(
      new ApiResponse(false, `Insufficient stock for "${name}"`, null, 400)
    );
  }
}
```

**Step 2 — Atomic stock decrement** (replace the current post-create loop):

```typescript
// Req 3.3/3.7: Atomic decrement with floor guard — only for razorpay orders
if (paymentMethod === 'razorpay') {
  for (const item of orderItems) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity, sold: item.quantity } }
    );
    if (!updated) {
      // Race condition: stock depleted between check and decrement — rollback
      await Order.findByIdAndDelete(order._id);
      return res.status(400).json(
        new ApiResponse(false, `Stock just sold out for "${item.name}"`, null, 400)
      );
    }
  }
  // Record reservation timestamp
  await Order.findByIdAndUpdate(order._id, { stockReservedAt: new Date() });
} else {
  // COD: decrement sold + stock immediately (existing behaviour)
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { sold: item.quantity, stock: -item.quantity }
    });
  }
}
```

**Step 3 — Verify payment confirms reservation** (in `verifyPayment`):

```typescript
// Req 3.4: Mark order, clear reservation timestamp on successful payment
const order = await Order.findByIdAndUpdate(
  orderId,
  { paymentStatus: 'paid', orderstatus: 'confirmed', stockReservedAt: null },
  { new: true }
);
```

**Step 4 — Timeout release job** — add a new file:

### File: `matasree-backend/src/jobs/stockReleaseJob.ts` (new file)

```typescript
import cron from 'node-cron';
import Order from '../models/Order';
import Product from '../models/Product';
import logger from '../config/logger';

const HOLD_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export const startStockReleaseJob = () => {
  // Run every 2 minutes
  cron.schedule('*/2 * * * *', async () => {
    const cutoff = new Date(Date.now() - HOLD_WINDOW_MS);
    const expired = await Order.find({
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      stockReservedAt: { $lte: cutoff, $ne: null },
    });

    for (const order of expired) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity, sold: -item.quantity },
        });
      }
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus: 'failed',
        stockReservedAt: null,
      });
      logger.info(`[stockReleaseJob] Released stock for expired order ${order.orderNumber}`);
    }
  });
};
```

Register in `matasree-backend/src/index.ts` (or `app.ts`):
```typescript
import { startStockReleaseJob } from './jobs/stockReleaseJob';
startStockReleaseJob();
```

**Step 5 — cancelOrder stock restore** (already exists in `cancelOrder`; ensure it also clears `stockReservedAt`):

```typescript
order.orderstatus = 'cancelled';
order.stockReservedAt = null;  // Req 3.6
await order.save();
// existing stock restore loop is unchanged
```

---

## Requirement 4: Cloudinary Image Upload

### File: `matasree-backend/src/middleware/upload.ts`

**Change**: Replace `multer.diskStorage` with `multer.memoryStorage()`:

```typescript
import multer from 'multer';

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, png, webp, gif)'));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),  // ← changed from diskStorage
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export default upload;
```

Remove the `fs.mkdirSync` block and all `path`/`fs` imports that were only needed for disk storage.

### File: `matasree-backend/src/controllers/productController.ts`

**Change**: Replace the `uploadImage` handler body:

```typescript
import { uploadToCloudinary } from '../config/cloudinary';

export const uploadImage = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json(new ApiResponse(false, 'No file uploaded', null, 400));
    }

    // Req 4.1/4.4: pass buffer to Cloudinary — no local file written
    const result = await uploadToCloudinary(req.file.buffer, 'matasree/products');

    return res.status(200).json(
      new ApiResponse(true, 'Image uploaded successfully', {
        imageUrl: result.secure_url,
        publicId: result.public_id,
      })
    );
  } catch (error: any) {
    // Req 4.3: return 500 on Cloudinary failure
    return res.status(500).json(
      new ApiResponse(false, error.message || 'Failed to upload image to Cloudinary', null, 500)
    );
  }
};
```

The `uploadToCloudinary` signature (from `src/config/cloudinary.ts`) is:
```typescript
uploadToCloudinary(fileBuffer: Buffer, folder?: string): Promise<UploadApiResponse>
```

The returned `result.secure_url` is the CDN-hosted HTTPS URL stored in the product's `image` field.

### File: `matasree-backend/src/middleware/imageOptimizer.ts`

The `optimizeProductImage` middleware currently reads `req.file.path`. After switching to memory storage, `req.file.path` will be `undefined`. Update the middleware to work with `req.file.buffer` (sharp accepts a Buffer), or remove its route-level usage on the upload endpoint since Cloudinary applies its own transformations. The simplest safe change is to guard with:

```typescript
// In imageOptimizer.ts: skip if file came from memory storage (no path)
if (!req.file?.path) return next();
```

---

## Requirement 5: Password Reset OTP Single-Use Enforcement

### File: `matasree-backend/src/controllers/authController.ts`

**Change**: In `verifyPasswordResetOtp`, add `await deleteOTP(key)` **before** the success response (currently the OTP is only updated on failure but not deleted on success):

```typescript
export const verifyPasswordResetOtp = async (req: any, res: Response) => {
  // ... validation ...
  const key = `otp:reset:${email}`;

  const stored = await getOTP(key);
  if (!stored) return res.status(400).json(new ApiResponse(false, 'OTP not found or expired', null, 400));
  if (stored.attempts >= 3) {
    await deleteOTP(key);
    return res.status(400).json(new ApiResponse(false, 'Too many attempts', null, 400));
  }
  if (stored.otp !== otp) {
    await updateOTPAttempts(key, stored);
    return res.status(400).json(new ApiResponse(false, 'Invalid OTP', null, 400));
  }

  await deleteOTP(key);  // ← ADD THIS LINE (Req 5.1)

  res.status(200).json(new ApiResponse(true, 'OTP verified successfully'));
};
```

The `resetPassword` handler already independently calls `getOTP(key)` (Req 5.3). Since `verifyPasswordResetOtp` now deletes the key, a second call to `resetPassword` with the same OTP will fail at its own `getOTP` check, returning HTTP 400 "OTP not found or expired" — satisfying Req 5.2 and 5.3 with no further changes to `resetPassword`.

---

## Requirement 6: Wishlist Sync on App Load

### File: `matasree-superstore-main/src/App.tsx`

**Change**: Add a `useEffect` inside `AppRoutes` (or as a new inner component) that syncs the wishlist when the authenticated user changes. Inject after the existing `open_cart` effect:

```typescript
import { useWishlistStore } from './store/wishlistStore';

// Inside AppRoutes component, after existing useEffect:
const { isAuthenticated, user } = useAuthStore();
const setWishlistItems = useWishlistStore((s) => s.setItems);

useEffect(() => {
  if (!isAuthenticated || !user) return;  // Req 6.2

  apiClient.getWishlist()
    .then((res: any) => {
      const raw = res?.data?.items ?? res?.data ?? [];
      const products: WishlistItem[] = (Array.isArray(raw) ? raw : []).map((entry: any) => {
        const p = entry.productId ?? entry;
        return {
          id: p._id ?? p.id,
          name: p.name,
          price: p.price,
          originalPrice: p.originalPrice,
          image: p.image,
          category: p.category,
          rating: p.rating,
        };
      });
      setWishlistItems(products);  // Req 6.1
    })
    .catch(() => {
      // Req 6.3: silently ignore errors
    });
}, [isAuthenticated, user?.id]);  // Req 6.4
```

Add the `WishlistItem` type import from `store/wishlistStore` or inline it. No new API endpoint is needed — `GET /api/wishlist` already exists.

---

## Requirement 7: Review Rating Auto-Recalculation

### File: `matasree-backend/src/controllers/reviewController.ts`

Add a shared helper function:

```typescript
/**
 * Recalculates Product.rating and Product.reviews from approved reviews.
 * Req 7.1, 7.2, 7.3, 7.4, 7.5
 */
async function recalculateProductRating(productId: mongoose.Types.ObjectId | string): Promise<void> {
  const agg = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(String(productId)), isApproved: true } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const avgRating = agg.length > 0 ? agg[0].avgRating : 0;
  const count     = agg.length > 0 ? agg[0].count    : 0;

  await Product.findByIdAndUpdate(productId, {
    rating:  parseFloat(avgRating.toFixed(2)),
    reviews: count,
  });
}
```

**Change in `approveReview` handler** — call the helper after updating the review:

```typescript
export const approveReview = async (req: any, res: Response) => {
  // ...existing code that updates review isApproved / isFeatured...
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { isApproved: data.isApproved, ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}) },
    { new: true }
  );
  if (!review) return res.status(404).json(...);

  // Req 7.1, 7.2, 7.5
  await recalculateProductRating(review.productId);

  return res.status(200).json(new ApiResponse(true, 'Review updated', review));
};
```

**Change in `deleteReview` handler** — call the helper after deleting:

```typescript
export const deleteReview = async (req: any, res: Response) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) return res.status(404).json(...);

  // Req 7.3, 7.4, 7.5
  await recalculateProductRating(review.productId);

  return res.status(200).json(new ApiResponse(true, 'Review deleted'));
};
```

---

## Requirement 8: Order Status Transactional Emails

### File: `matasree-backend/src/utils/email.ts`

Add three new exported functions after `sendOrderConfirmationEmail`. All three reuse the same gradient header (`linear-gradient(135deg, #ff8c00, #e65c00)`) and footer as the confirmation email.

```typescript
// Req 8.1
export const sendShippedEmail = async (
  orderNumber: string,
  recipientEmail: string,
  estimatedDelivery: string,
  shippingAddress: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;}
      .container{max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;}
      .header{background:linear-gradient(135deg,#ff8c00,#e65c00);padding:30px 40px;text-align:center;}
      .logo{font-size:28px;font-weight:bold;color:#fff;}
      .body{padding:30px 40px;}
      .footer{background:#f5f5f5;text-align:center;padding:20px;color:#999;font-size:12px;border-top:1px solid #eee;}
    </style></head><body>
    <div class="container">
      <div class="header"><div class="logo">🌶️ Matasree</div></div>
      <div class="body">
        <h2 style="color:#333;">Your Order Has Shipped! 🚚</h2>
        <p>Order <strong style="color:#ff8c00;">#${orderNumber}</strong> is on its way.</p>
        <p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>
        <p><strong>Delivering to:</strong><br>${shippingAddress}</p>
      </div>
      <div class="footer"><p>© 2026 Matasree. All rights reserved.</p></div>
    </div></body></html>`;
  return sendEmail({ email: recipientEmail, subject: `Order Shipped – #${orderNumber} | Matasree`, html });
};

// Req 8.2
export const sendDeliveredEmail = async (
  orderNumber: string,
  recipientEmail: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      body{font-family:Arial,sans-serif;background:#f5f5f5;}
      .container{max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;}
      .header{background:linear-gradient(135deg,#ff8c00,#e65c00);padding:30px 40px;text-align:center;}
      .logo{font-size:28px;font-weight:bold;color:#fff;}
      .body{padding:30px 40px;}
      .footer{background:#f5f5f5;text-align:center;padding:20px;color:#999;font-size:12px;border-top:1px solid #eee;}
    </style></head><body>
    <div class="container">
      <div class="header"><div class="logo">🌶️ Matasree</div></div>
      <div class="body">
        <h2 style="color:#333;">Order Delivered! ✅</h2>
        <p>Order <strong style="color:#ff8c00;">#${orderNumber}</strong> has been delivered.</p>
        <p>Thank you for shopping with Matasree. Enjoy your spices!</p>
      </div>
      <div class="footer"><p>© 2026 Matasree. All rights reserved.</p></div>
    </div></body></html>`;
  return sendEmail({ email: recipientEmail, subject: `Order Delivered – #${orderNumber} | Matasree`, html });
};

// Req 8.3
export const sendCancelledEmail = async (
  orderNumber: string,
  recipientEmail: string,
  refundAmount: number
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      body{font-family:Arial,sans-serif;background:#f5f5f5;}
      .container{max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;}
      .header{background:linear-gradient(135deg,#ff8c00,#e65c00);padding:30px 40px;text-align:center;}
      .logo{font-size:28px;font-weight:bold;color:#fff;}
      .body{padding:30px 40px;}
      .footer{background:#f5f5f5;text-align:center;padding:20px;color:#999;font-size:12px;border-top:1px solid #eee;}
    </style></head><body>
    <div class="container">
      <div class="header"><div class="logo">🌶️ Matasree</div></div>
      <div class="body">
        <h2 style="color:#333;">Order Cancelled</h2>
        <p>Order <strong style="color:#ff8c00;">#${orderNumber}</strong> has been cancelled.</p>
        ${refundAmount > 0 ? `<p><strong>Refund of ₹${refundAmount.toFixed(2)}</strong> will be credited within 5-7 business days.</p>` : ''}
      </div>
      <div class="footer"><p>© 2026 Matasree. All rights reserved.</p></div>
    </div></body></html>`;
  return sendEmail({ email: recipientEmail, subject: `Order Cancelled – #${orderNumber} | Matasree`, html });
};
```

### File: `matasree-backend/src/controllers/orderController.ts`

**Import** the new functions:
```typescript
import { sendOrderConfirmationEmail, sendShippedEmail, sendDeliveredEmail, sendCancelledEmail } from '../utils/email';
```

**Change in `updateOrderStatus`** — add email dispatch after status update:

```typescript
// Req 8.4, 8.5 — send status emails (fire-and-forget; Req 8.7)
try {
  const userDoc = await User.findById(order.userId).select('email');
  if (userDoc?.email) {
    if (orderstatus === 'shipped') {
      await sendShippedEmail(
        order.orderNumber,
        userDoc.email,
        'Within 3-5 business days',
        [order.shippingAddress.name, order.shippingAddress.addressLine1,
         order.shippingAddress.city, order.shippingAddress.state].join(', ')
      );
    } else if (orderstatus === 'delivered') {
      await sendDeliveredEmail(order.orderNumber, userDoc.email);
    } else if (orderstatus === 'cancelled') {
      await sendCancelledEmail(order.orderNumber, userDoc.email, order.totalAmount);
    }
  }
} catch (emailErr) {
  logger.warn(`[orderController] Status email failed for order ${order.orderNumber}:`, emailErr);
}
```

**Change in `cancelOrder`** — add after the existing save:

```typescript
// Req 8.6 — send cancellation email (fire-and-forget)
try {
  const userDoc = await User.findById(order.userId).select('email');
  if (userDoc?.email) {
    await sendCancelledEmail(order.orderNumber, userDoc.email, order.totalAmount);
  }
} catch (emailErr) {
  logger.warn(`[orderController] Cancellation email failed for order ${order.orderNumber}:`, emailErr);
}
```

---

## Requirement 9: Cascade Delete on User

### File: `matasree-backend/src/controllers/adminController.ts`

**Imports to add**:
```typescript
import Cart from '../models/Cart';
import Wishlist from '../models/Wishlist';
import Address from '../models/Address';
import LoyaltyAccount from '../models/LoyaltyAccount';
import LoyaltyTransaction from '../models/LoyaltyTransaction';
import RefreshToken from '../models/RefreshToken';
```

**Replace `deleteUser`** with:

```typescript
export const deleteUser = async (req: any, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json(new ApiResponse(false, 'User not found', null, 404));
    }

    const userId = req.params.id;

    // Req 9.1: cascade-delete personal data (Req 9.3: all before response)
    const cascadeOps = [
      Cart.deleteMany({ userId }),
      Wishlist.deleteMany({ userId }),
      Address.deleteMany({ userId }),
      LoyaltyAccount.deleteOne({ userId }),
      LoyaltyTransaction.deleteMany({ userId }),
      RefreshToken.deleteMany({ userId }),
    ];

    // Req 9.4: run all; log individual errors; don't fail response
    const results = await Promise.allSettled(cascadeOps);
    results.forEach((r, i) => {
      const labels = ['Cart','Wishlist','Address','LoyaltyAccount','LoyaltyTransaction','RefreshToken'];
      if (r.status === 'rejected') {
        logger.error(`[deleteUser] Cascade delete failed for ${labels[i]} of user ${userId}:`, r.reason);
      }
    });

    // Req 9.2: Orders are intentionally NOT deleted

    return res.status(200).json(new ApiResponse(true, 'User deleted successfully'));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to delete user', null, 500));
  }
};
```

---

## Requirement 10: Referral Tab on Profile Page

### File: `matasree-superstore-main/src/pages/ProfilePage.tsx`

Add state and fetch logic for referrals. Add imports:
```typescript
import { Copy, Gift } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
```

Add state inside `ProfilePage`:
```typescript
const [referrals, setReferrals] = useState<any[]>([]);
const [referralCode, setReferralCode] = useState<string>('');
const [referralsLoading, setReferralsLoading] = useState(true);
```

Add fetch effect (Req 10.4):
```typescript
useEffect(() => {
  if (!user) return;
  // Referral code comes from the user profile (field: referralCode)
  setReferralCode((user as any).referralCode ?? '');

  apiClient.get('/referrals')
    .then((res: any) => {
      const list = res?.data?.referrals ?? res?.data ?? [];
      setReferrals(Array.isArray(list) ? list : []);
    })
    .catch(() => setReferrals([]))
    .finally(() => setReferralsLoading(false));
}, [user]);
```

Add a Referrals section in the JSX, below the Quick Actions card:

```tsx
{/* Referrals Section (Req 10.1, 10.2, 10.3, 10.5) */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.25 }}
  className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-[#3E2314]/8 overflow-hidden"
>
  <div className="px-6 py-5 border-b border-[#3E2314]/8 flex items-center gap-2">
    <Gift className="w-5 h-5 text-[#D63220]" />
    <h2 className="font-serif font-bold text-lg text-[#3E2314]">Referrals</h2>
  </div>
  <div className="p-6 space-y-4">
    {/* Referral code + copy */}
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <p className="text-xs font-semibold text-[#3E2314]/50 uppercase mb-1">Your Referral Code</p>
        <div className="flex items-center gap-2 bg-[#FAF7F2] rounded-xl px-4 py-2 border border-[#3E2314]/10">
          <span className="font-mono font-bold text-[#D63220] tracking-widest">{referralCode || '—'}</span>
          <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(referralCode); toast.success('Code copied!'); }}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-[#3E2314]/50 uppercase mb-1">Invite Link</p>
        <div className="flex items-center gap-2 bg-[#FAF7F2] rounded-xl px-4 py-2 border border-[#3E2314]/10">
          <span className="text-sm text-[#3E2314]/70 truncate">
            {`https://matasreesuper.com/register?ref=${referralCode}`}
          </span>
          <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(`https://matasreesuper.com/register?ref=${referralCode}`); toast.success('Link copied!'); }}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>

    {/* Referral history table */}
    {referralsLoading ? (
      <Skeleton className="h-20 w-full" />
    ) : referrals.length === 0 ? (
      <p className="text-sm text-[#3E2314]/50 py-4 text-center">You haven't referred anyone yet.</p>
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
              <TableCell>{r.refereeName ?? r.refereeId}</TableCell>
              <TableCell>{new Date(r.createdAt).toLocaleDateString('en-IN')}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.status === 'rewarded' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
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
```

### API: `GET /api/referrals`

This endpoint already exists in `matasree-backend/src/routes/referralRoutes.ts` and `referralController.ts`. No backend change required.

---

## Requirement 11: Low Stock Alert Widget on Admin Dashboard

### Backend

**File: `matasree-backend/src/controllers/adminController.ts`**

Add new handler:
```typescript
/**
 * GET /api/admin/products/low-stock
 * Req 11.3, 11.4
 */
export const getLowStockProducts = async (req: any, res: Response) => {
  try {
    const threshold = parseInt(String(req.query.threshold ?? '10'), 10);
    const products = await Product.find({ stock: { $lt: threshold } })
      .select('name stock price image')
      .sort({ stock: 1 })
      .lean();
    return res.status(200).json(new ApiResponse(true, 'Low stock products fetched', products));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch low stock', null, 500));
  }
};
```

**File: `matasree-backend/src/routes/adminRoutes.ts`**

Add import of `getLowStockProducts` from `adminController` and register the route **after** the `router.use(verifyToken, verifyAdmin)` middleware:

```typescript
router.get('/products/low-stock', adminController.getLowStockProducts);
```

The full path is `GET /api/admin/products/low-stock?threshold=10`.

### Frontend

**File: `matasree-superstore-main/src/services/api.ts`**

Add method to `ApiClient`:
```typescript
getLowStockProducts(threshold = 10) {
  return this.client.get('/admin/products/low-stock', { params: { threshold } });
}
```

**File: `matasree-superstore-main/src/pages/AdminDashboard.tsx`**

Add state:
```typescript
const [lowStock, setLowStock] = useState<any[]>([]);
```

Add to `fetchStats` Promise.all:
```typescript
const lowStockResponse = await apiClient.getLowStockProducts();
if (lowStockResponse?.data) setLowStock(lowStockResponse.data);
```

Add `LowStockWidget` component (inline or separate file `src/components/admin/LowStockWidget.tsx`):

```tsx
// LowStockWidget component
const LowStockWidget = ({ products }: { products: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-orange-500" />
        Low Stock Alert
      </CardTitle>
    </CardHeader>
    <CardContent>
      {products.length === 0 ? (
        <p className="text-center py-4 text-gray-500">All products have adequate stock.</p>
      ) : (
        <div className="space-y-2">
          {products.map((p: any) => (
            <div key={p._id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs text-orange-600 font-bold">Stock: {p.stock}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate(`/admin/products?edit=${p._id}`)}>
                Edit
              </Button>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);
```

Render inside the dashboard grid:
```tsx
<LowStockWidget products={lowStock} />
```

---

## Requirement 12: Coupon Analytics Table on Admin Dashboard

### Backend

**File: `matasree-backend/src/controllers/adminController.ts`**

Add new handler:
```typescript
/**
 * GET /api/admin/coupons/analytics
 * Req 12.2, 12.3
 */
export const getCouponAnalytics = async (req: any, res: Response) => {
  try {
    const coupons = await Coupon.find().lean();

    // Aggregate totalRevenueSaved from Orders per coupon code
    const revenueAgg = await Order.aggregate([
      { $match: { couponCode: { $exists: true, $ne: null } } },
      { $group: { _id: '$couponCode', totalRevenueSaved: { $sum: '$discountAmount' } } },
    ]);
    const revenueMap: Record<string, number> = {};
    for (const row of revenueAgg) {
      revenueMap[row._id] = row.totalRevenueSaved ?? 0;
    }

    const analytics = coupons.map((c) => ({
      code:             c.code,
      discountType:     c.discountType,
      discountValue:    c.discountValue,
      usageCount:       c.usageCount,
      maxUses:          c.maxUses,
      totalRevenueSaved: revenueMap[c.code] ?? 0,
    }));

    return res.status(200).json(new ApiResponse(true, 'Coupon analytics fetched', analytics));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch coupon analytics', null, 500));
  }
};
```

Add `Coupon` import:
```typescript
import Coupon from '../models/Coupon';
```

**File: `matasree-backend/src/routes/adminRoutes.ts`**

Register after the verifyToken/verifyAdmin wall:
```typescript
router.get('/coupons/analytics', adminController.getCouponAnalytics);
```

### Frontend

**File: `matasree-superstore-main/src/services/api.ts`**
```typescript
getCouponAnalytics() {
  return this.client.get('/admin/coupons/analytics');
}
```

**File: `matasree-superstore-main/src/pages/AdminDashboard.tsx`**

Add state and fetch:
```typescript
const [couponAnalytics, setCouponAnalytics] = useState<any[]>([]);
// Inside fetchStats:
const couponRes = await apiClient.getCouponAnalytics();
if (couponRes?.data) setCouponAnalytics(couponRes.data);
```

Add `CouponAnalyticsTable` component:
```tsx
const CouponAnalyticsTable = ({ data }: { data: any[] }) => (
  <Card>
    <CardHeader><CardTitle>Coupon Analytics</CardTitle></CardHeader>
    <CardContent>
      {data.length === 0 ? (
        <p className="text-center py-4 text-gray-500">No coupons available.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Code</th>
              <th className="text-left py-2">Type</th>
              <th className="text-right py-2">Value</th>
              <th className="text-right py-2">Usage / Max</th>
              <th className="text-right py-2">Revenue Saved</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c: any) => (
              <tr key={c.code} className="border-b hover:bg-gray-50">
                <td className="py-2 font-mono font-bold">{c.code}</td>
                <td className="py-2 capitalize">{c.discountType}</td>
                <td className="py-2 text-right">
                  {c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                </td>
                <td className="py-2 text-right">
                  {c.usageCount} / {c.maxUses === 0 ? 'Unlimited' : c.maxUses}
                </td>
                <td className="py-2 text-right text-green-700 font-semibold">
                  ₹{c.totalRevenueSaved.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CardContent>
  </Card>
);
```

---

## Requirement 13: Revenue Date Range Filter

### Backend

**File: `matasree-backend/src/controllers/adminController.ts`**

**Replace `getRevenueAnalytics`**:

```typescript
export const getRevenueAnalytics = async (req: any, res: Response) => {
  try {
    const { startDate, endDate } = req.query as Record<string, string | undefined>;

    let matchStage: Record<string, any> = { orderstatus: { $ne: 'cancelled' } };

    if (startDate || endDate) {
      // Req 13.5: validate order
      const start = startDate ? new Date(`${startDate}T00:00:00.000Z`) : null;
      const end   = endDate   ? new Date(`${endDate}T23:59:59.999Z`)   : null;

      if (start && end && start > end) {
        return res.status(400).json(
          new ApiResponse(false, 'startDate must not be after endDate', null, 400)
        );
      }

      const dateFilter: Record<string, Date> = {};
      if (start) dateFilter.$gte = start;
      if (end)   dateFilter.$lte = end;
      matchStage.createdAt = dateFilter;
    } else {
      // Req 13.2: default — last 30 calendar days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchStage.createdAt = { $gte: thirtyDaysAgo };
    }

    const dailyRevenue = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json(new ApiResponse(true, 'Revenue analytics fetched', dailyRevenue));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch analytics', null, 500));
  }
};
```

### Frontend

**File: `matasree-superstore-main/src/services/api.ts`**

Update `getRevenueAnalytics`:
```typescript
getRevenueAnalytics(params?: { startDate?: string; endDate?: string }) {
  return this.client.get('/admin/analytics/revenue', { params });
}
```

**File: `matasree-superstore-main/src/pages/AdminDashboard.tsx`**

Add state:
```typescript
const [revStartDate, setRevStartDate] = useState('');
const [revEndDate, setRevEndDate] = useState('');
```

Add a `fetchRevenue` helper:
```typescript
const fetchRevenue = async (start?: string, end?: string) => {
  try {
    const res = await apiClient.getRevenueAnalytics(start && end ? { startDate: start, endDate: end } : undefined);
    if (res?.data) setAnalytics(res.data);
  } catch (e) {
    console.error('Revenue fetch failed', e);
  }
};
```

Add date picker controls above the Revenue Trends chart:
```tsx
<CardHeader>
  <CardTitle>Revenue Trends</CardTitle>
  <div className="flex gap-2 items-center flex-wrap mt-2">
    <input type="date" value={revStartDate} onChange={e => setRevStartDate(e.target.value)}
      className="border rounded px-2 py-1 text-sm" />
    <span className="text-sm text-gray-500">to</span>
    <input type="date" value={revEndDate} onChange={e => setRevEndDate(e.target.value)}
      className="border rounded px-2 py-1 text-sm" />
    <Button size="sm" onClick={() => fetchRevenue(revStartDate, revEndDate)}>Apply</Button>
    <Button size="sm" variant="outline" onClick={() => { setRevStartDate(''); setRevEndDate(''); fetchRevenue(); }}>Reset</Button>
  </div>
</CardHeader>
```

---

## Requirement 14: Top Selling Products Widget on Admin Dashboard

### Backend

**File: `matasree-backend/src/controllers/adminController.ts`**

Add handler:
```typescript
/**
 * GET /api/admin/products/top-selling
 * Req 14.3, 14.4
 */
export const getTopSellingProducts = async (req: any, res: Response) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '5'), 10), 20);
    const products = await Product.find({ sold: { $gt: 0 } })
      .select('name sold price image')
      .sort({ sold: -1 })
      .limit(limit)
      .lean();
    return res.status(200).json(new ApiResponse(true, 'Top selling products fetched', products));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch top selling', null, 500));
  }
};
```

**File: `matasree-backend/src/routes/adminRoutes.ts`**

```typescript
router.get('/products/top-selling', adminController.getTopSellingProducts);
```

### Frontend

**File: `matasree-superstore-main/src/services/api.ts`**
```typescript
getTopSellingProducts(limit = 5) {
  return this.client.get('/admin/products/top-selling', { params: { limit } });
}
```

**File: `matasree-superstore-main/src/pages/AdminDashboard.tsx`**

Add state and fetch:
```typescript
const [topProducts, setTopProducts] = useState<any[]>([]);
// Inside fetchStats:
const topRes = await apiClient.getTopSellingProducts();
if (topRes?.data) setTopProducts(topRes.data);
```

Add `TopProductsWidget`:
```tsx
const TopProductsWidget = ({ products }: { products: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-blue-500" />
        Top Products
      </CardTitle>
    </CardHeader>
    <CardContent>
      {products.length === 0 ? (
        <p className="text-center py-4 text-gray-500">No sales data available.</p>
      ) : (
        <div className="space-y-3">
          {products.map((p: any, i: number) => (
            <div key={p._id} className="flex items-center gap-3">
              <span className="text-lg font-black text-gray-400 w-6 shrink-0">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-500">{p.sold} units sold</p>
              </div>
              <p className="font-bold text-sm text-green-700">
                ₹{(p.price * p.sold).toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);
```

---

## Requirement 15: Server-Side Active Banner Filtering

### Backend

**File: `matasree-backend/src/controllers/adminController.ts`**

**Replace `getSeasonalBanners`**:

```typescript
export const getSeasonalBanners = async (req: any, res: Response) => {
  try {
    const activeOnly = req.query.activeOnly === 'true';   // Req 15.1
    const now = new Date();

    const filter = activeOnly
      ? { activeFrom: { $lte: now }, activeTo: { $gte: now } }
      : {};                                               // Req 15.2: no filter

    const banners = await SeasonalBanner.find(filter).sort({ activeFrom: 1 }).lean();
    return res.status(200).json(new ApiResponse(true, 'Banners fetched', banners));
  } catch (error: any) {
    return res.status(500).json(
      new ApiResponse(false, error.message || 'Failed to fetch banners', null, 500)
    );
  }
};
```

Note: The `GET /api/admin/banners` route is cached for 30 minutes. Because `activeOnly=true` and `activeOnly` absent produce different results, the cache key must include the query parameter. Update the cache key in `adminRoutes.ts`:

```typescript
// Replace:
router.get('/banners', cacheMiddleware(1800, 'banners'), adminController.getSeasonalBanners);
// With:
router.get('/banners', cacheMiddleware(1800, 'banners', true), adminController.getSeasonalBanners);
// where the third argument signals the cache middleware to append req.query to the key
```

If the existing `cacheMiddleware` signature does not support query-aware keys, use a shorter TTL (e.g., 300s) so stale active-only results expire quickly, or add query-param support to the cache middleware implementation.

### Frontend

**File: `matasree-superstore-main/src/services/api.ts`**

Update `getSeasonalBanners`:
```typescript
getSeasonalBanners(activeOnly = true) {
  return this.client.get('/admin/banners', { params: activeOnly ? { activeOnly: 'true' } : {} });
}
```

All call sites that called `apiClient.getSeasonalBanners()` will now automatically pass `?activeOnly=true`. Any client-side `Date.now()` filtering logic in components that consume banner data can be removed.

---

## Requirement 16: robots.txt Admin Path Block Fix

### File: `matasree-superstore-main/public/robots.txt`

**Replace** `Disallow: /admin` with `Disallow: /admin/`:

```
User-agent: *
Disallow: /admin/
Disallow: /profile
Disallow: /orders
Disallow: /addresses
Disallow: /checkout
Disallow: /cart

Sitemap: https://matasreesuper.com/sitemap.xml
```

---

## Requirement 17: Docker Compose MongoDB Password Parameterisation

### File: `docker-compose.yml`

**Change** the `mongodb` service `MONGO_INITDB_ROOT_PASSWORD`:
```yaml
MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD:-secure_password}
```

**Change** the `backend` service `MONGODB_URI`:
```yaml
- MONGODB_URI=mongodb://admin:${MONGO_PASSWORD:-secure_password}@mongodb:27017/matasree?authSource=admin
```

These are the only two occurrences of the password. No other lines require modification.

---

## Data Models Summary

### `Order` (modified)

| Field              | Type     | Change        | Notes                                  |
|--------------------|----------|---------------|----------------------------------------|
| `orderNumber`      | String   | format change | `ORD-<ms>-<8-char UUID>`; unique index |
| `stockReservedAt`  | Date     | **new field** | Null for COD; set at razorpay creation |

### `Product` (no schema change)

Existing fields `stock`, `sold`, `rating`, `reviews` are all used; no new fields required.

---

## API Endpoints Summary

| Method | Path                                  | Auth  | Req | Notes                                  |
|--------|---------------------------------------|-------|-----|----------------------------------------|
| GET    | `/api/admin/products/low-stock`       | Admin | 11  | `?threshold=10`                        |
| GET    | `/api/admin/products/top-selling`     | Admin | 14  | `?limit=5`                             |
| GET    | `/api/admin/coupons/analytics`        | Admin | 12  | Aggregates discountAmount from Orders  |
| GET    | `/api/admin/analytics/revenue`        | Admin | 13  | `?startDate=YYYY-MM-DD&endDate=...`    |
| GET    | `/api/admin/banners`                  | Public| 15  | `?activeOnly=true` (new param)         |

All existing endpoints retain backward compatibility.

---

## Error Handling

- **Req 1 duplicate-key**: HTTP 409 — client retries with new request
- **Req 3 stock race**: HTTP 400 — order cleaned up before 400 is returned; client prompts re-check
- **Req 4 Cloudinary failure**: HTTP 500 — no partial state left; no local file written
- **Req 8 email failure**: warning logged; HTTP 200 still returned — email is non-blocking
- **Req 9 cascade failure**: partial deletions logged; HTTP 200 returned — user record is gone
- **Req 13 invalid date range**: HTTP 400 with descriptive message

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Order Number Format and Uniqueness

*For any* sequence of N concurrent order-creation calls, every generated `orderNumber` must (a) match the pattern `/^ORD-\d{13,}-[A-F0-9]{8}$/` and (b) be distinct from all others in the sequence.

**Validates: Requirements 1.1**

---

### Property 2: Stock Pre-Check Rejects Under-Stocked Carts

*For any* set of cart items and corresponding product stock values, if any single item's requested quantity exceeds the product's `stock`, the order controller must return HTTP 400 without creating an order document or modifying any product stock.

**Validates: Requirements 3.1, 3.2**

---

### Property 3: Razorpay Stock Decrement Invariant

*For any* valid cart with items of arbitrary quantities, after a successful Razorpay order creation, each affected `Product.stock` must decrease by exactly `item.quantity` and `Product.sold` must increase by exactly `item.quantity`, with `Order.stockReservedAt` set to a non-null timestamp.

**Validates: Requirements 3.3**

---

### Property 4: Cancellation Stock Restoration

*For any* order in `pending` or `confirmed` status with arbitrary item quantities, cancelling the order must restore every affected `Product.stock` by exactly `item.quantity`, leaving the net stock change from order-creation-then-cancel equal to zero.

**Validates: Requirements 3.6**

---

### Property 5: Cloudinary Upload — Buffer Forwarded, No Local File

*For any* uploaded image file buffer, the `uploadImage` handler must call `uploadToCloudinary` with that exact buffer and return the `secure_url` from Cloudinary's response. No file must be written to the local filesystem during or after the call.

**Validates: Requirements 4.1, 4.2, 4.4**

---

### Property 6: Password Reset OTP Single-Use

*For any* valid (email, OTP) pair, after a successful call to `verifyPasswordResetOtp`, a subsequent call with the same pair must return HTTP 400 ("OTP not found or expired"), because the key must no longer exist in Redis.

**Validates: Requirements 5.1, 5.2**

---

### Property 7: Wishlist Sync on Auth Identity Change

*For any* authenticated user identity, mounting the `App` component must result in exactly one call to `apiClient.getWishlist()` and exactly one call to `WishlistStore.setItems()` with the deserialized products. When the user is not authenticated, neither call must occur.

**Validates: Requirements 6.1, 6.2, 6.4**

---

### Property 8: Review Rating Accuracy

*For any* product with N approved reviews having arbitrary rating values r₁…rN, after any approve or delete operation, `Product.rating` must equal `(r₁ + … + rN) / N` (rounded to two decimal places) and `Product.reviews` must equal N. When N = 0, both must equal `0`.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

---

### Property 9: Order Status Email Subject Format

*For any* order number string `s`, the subjects produced by `sendShippedEmail`, `sendDeliveredEmail`, and `sendCancelledEmail` must match exactly `"Order Shipped – #s | Matasree"`, `"Order Delivered – #s | Matasree"`, and `"Order Cancelled – #s | Matasree"` respectively.

**Validates: Requirements 8.1, 8.2, 8.3**

---

### Property 10: Cascade Delete Completeness

*For any* user ID that has associated documents in Cart, Wishlist, Address, LoyaltyAccount, LoyaltyTransaction, and RefreshToken, after `adminController.deleteUser` completes, all six collections must contain zero documents with that `userId`. Order documents for that user must still exist.

**Validates: Requirements 9.1, 9.2**

---

### Property 11: Low Stock Endpoint Threshold Invariant

*For any* threshold value T and any set of products with arbitrary stock values, `GET /api/admin/products/low-stock?threshold=T` must return exactly the products where `stock < T`, sorted by `stock` ascending, with no products where `stock >= T` included.

**Validates: Requirements 11.4**

---

### Property 12: Coupon Analytics Revenue Accuracy

*For any* coupon code and any set of orders referencing that code with arbitrary `discountAmount` values, the `totalRevenueSaved` returned by `GET /api/admin/coupons/analytics` must equal the arithmetic sum of all `discountAmount` values across those orders.

**Validates: Requirements 12.3**

---

### Property 13: Revenue Date Range Filtering

*For any* `startDate` and `endDate` (where `startDate <= endDate`), `GET /api/admin/analytics/revenue` must return only order data for days D where `startDate <= D <= endDate`, and must return HTTP 400 when `startDate > endDate`.

**Validates: Requirements 13.1, 13.5**

---

### Property 14: Active Banner Filter Correctness

*For any* set of banners with arbitrary `activeFrom` and `activeTo` dates and any server time `now`, calling `GET /api/admin/banners?activeOnly=true` must return exactly the banners where `activeFrom <= now <= activeTo`, and calling without `activeOnly` must return all banners.

**Validates: Requirements 15.1, 15.2**

---
