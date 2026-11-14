# Tasks: Matasree Full Improvement

## Phase 1: Critical Bug Fixes

- [x] 1. Fix order number collision in orderController
  - Replace `ORD-${Date.now()}` with `ORD-${Date.now()}-${crypto.randomUUID().slice(0,8).toUpperCase()}` in `createOrder`
  - Add duplicate-key (11000) error handler around `Order.create()` returning HTTP 409
  - Add explicit `orderSchema.index({ orderNumber: 1 }, { unique: true, background: true })` to `Order.ts` if not already declared
  - File: `matasree-backend/src/controllers/orderController.ts`
  - File: `matasree-backend/src/models/Order.ts`
  - Requirements: 1.1, 1.2, 1.3

- [x] 2. Remove double cart sync from CheckoutPage
  - Delete the `await syncCartToBackend()` call inside `handlePlaceOrder` (keep the call in `handleProceedToCheckout`)
  - Preserve the `syncCartToBackend` helper function itself untouched
  - File: `matasree-superstore-main/src/pages/CheckoutPage.tsx`
  - Requirements: 2.1, 2.2, 2.3

- [x] 3. Add stock reservation field to Order model
  - Add `stockReservedAt?: Date | null` to the `IOrder` interface
  - Add `stockReservedAt: { type: Date, default: null }` to `orderSchema`
  - File: `matasree-backend/src/models/Order.ts`
  - Requirements: 3.3

- [x] 4. Implement stock pre-check and atomic decrement in createOrder
  - Insert a pre-check loop before `Order.create()` that verifies `product.stock >= item.quantity` for every cart item; return HTTP 400 naming the out-of-stock product if any fail
  - Replace the existing post-create stock loop with atomic `findOneAndUpdate({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty, sold: qty } })` for Razorpay orders; rollback (delete order) and return HTTP 400 if any atomic update returns null
  - After successful Razorpay order creation, set `stockReservedAt` via `Order.findByIdAndUpdate`
  - For COD orders, keep existing `$inc` behaviour unchanged
  - File: `matasree-backend/src/controllers/orderController.ts`
  - Requirements: 3.1, 3.2, 3.3, 3.7

- [x] 5. Clear stockReservedAt on payment verification and order cancellation
  - In `verifyPayment`: update `Order.findByIdAndUpdate` call to also set `stockReservedAt: null`
  - In `cancelOrder`: set `order.stockReservedAt = null` before `await order.save()`
  - File: `matasree-backend/src/controllers/orderController.ts`
  - Requirements: 3.4, 3.6

- [x] 6. Create stock release cron job for expired Razorpay orders
  - Create new file `matasree-backend/src/jobs/stockReleaseJob.ts`
  - Implement `startStockReleaseJob()`: runs every 2 minutes via `node-cron`, finds orders where `paymentMethod=razorpay`, `paymentStatus=pending`, `stockReservedAt <= now-15min`; restores stock with `$inc`, sets `paymentStatus=failed`, clears `stockReservedAt`
  - Import and call `startStockReleaseJob()` inside the `startServer` function in `matasree-backend/src/server.ts`
  - File: `matasree-backend/src/jobs/stockReleaseJob.ts` (new)
  - File: `matasree-backend/src/server.ts`
  - Requirements: 3.5

- [x] 7. Switch product image upload to Cloudinary memory storage
  - In `matasree-backend/src/middleware/upload.ts`: replace `multer.diskStorage` with `multer.memoryStorage()`; remove `fs`/`path` imports used only for disk storage; keep file-type filter and 10MB size limit
  - In `matasree-backend/src/middleware/imageOptimizer.ts`: add guard `if (!req.file?.path) return next();` so memory-storage uploads bypass the sharp optimizer
  - File: `matasree-backend/src/middleware/upload.ts`
  - File: `matasree-backend/src/middleware/imageOptimizer.ts`
  - Requirements: 4.4

- [x] 8. Update uploadImage controller to use Cloudinary
  - Replace the `uploadImage` handler body in `productController.ts` to call `uploadToCloudinary(req.file.buffer, 'matasree/products')` from `../config/cloudinary`
  - Return `{ imageUrl: result.secure_url, publicId: result.public_id }` on success
  - Return HTTP 500 on Cloudinary error; never return a local filesystem path
  - File: `matasree-backend/src/controllers/productController.ts`
  - Requirements: 4.1, 4.2, 4.3

- [x] 9. Fix password reset OTP reuse vulnerability
  - In `verifyPasswordResetOtp`, add `await deleteOTP(key)` immediately after the OTP match check passes and before the success response is sent
  - File: `matasree-backend/src/controllers/authController.ts`
  - Requirements: 5.1, 5.2, 5.3

- [x] 10. Sync wishlist from backend on app load
  - In `matasree-superstore-main/src/App.tsx`, inside the `AppRoutes` component, add `useAuthStore` and `useWishlistStore` selectors
  - Add a `useEffect` that fires when `isAuthenticated` / `user?.id` changes: call `apiClient.getWishlist()`, map the response items into `WishlistItem` shape, and call `setWishlistItems()`; silently catch errors
  - Do not run the fetch when the user is not authenticated
  - File: `matasree-superstore-main/src/App.tsx`
  - Requirements: 6.1, 6.2, 6.3, 6.4

## Phase 2: Feature Completion

- [x] 11. Add review rating auto-recalculation helper
  - In `reviewController.ts`, add private async function `recalculateProductRating(productId)` that runs a MongoDB aggregation on approved reviews for the product and writes the result back to `Product.rating` (2 d.p.) and `Product.reviews`; handles zero-review case by setting both to 0
  - File: `matasree-backend/src/controllers/reviewController.ts`
  - Requirements: 7.1, 7.2, 7.3, 7.4, 7.5

- [x] 12. Call rating recalculation from approveReview and deleteReview
  - In `approveReview`: call `await recalculateProductRating(review.productId)` after the `Review.findByIdAndUpdate` succeeds
  - In `deleteReview`: call `await recalculateProductRating(review.productId)` after `Review.findByIdAndDelete` succeeds
  - File: `matasree-backend/src/controllers/reviewController.ts`
  - Requirements: 7.1, 7.2, 7.3

- [x] 13. Add order status transactional email functions
  - In `email.ts`, add three exported async functions after `sendOrderConfirmationEmail`: `sendShippedEmail(orderNumber, recipientEmail, estimatedDelivery, shippingAddress)`, `sendDeliveredEmail(orderNumber, recipientEmail)`, `sendCancelledEmail(orderNumber, recipientEmail, refundAmount)`
  - All three use the same orange gradient header, body padding, and footer as `sendOrderConfirmationEmail`
  - Subjects: `Order Shipped – #<orderNumber> | Matasree`, `Order Delivered – #<orderNumber> | Matasree`, `Order Cancelled – #<orderNumber> | Matasree`
  - File: `matasree-backend/src/utils/email.ts`
  - Requirements: 8.1, 8.2, 8.3, 8.8

- [x] 14. Dispatch order status emails from orderController
  - Import `sendShippedEmail`, `sendDeliveredEmail`, `sendCancelledEmail` into `orderController.ts`
  - In `updateOrderStatus`: after the order is saved, add a try/catch block that looks up the user's email and calls the appropriate email function based on `orderstatus` (`shipped`/`delivered`/`cancelled`); log warning on failure but do not fail the response
  - In `cancelOrder`: after `order.save()`, add a similar try/catch that calls `sendCancelledEmail`
  - File: `matasree-backend/src/controllers/orderController.ts`
  - Requirements: 8.4, 8.5, 8.6, 8.7

- [x] 15. Add cascade delete to adminController.deleteUser
  - Import `Cart`, `Wishlist`, `Address`, `LoyaltyAccount`, `LoyaltyTransaction`, `RefreshToken` models into `adminController.ts`
  - Replace the `deleteUser` handler body: after `User.findByIdAndDelete`, run `Promise.allSettled` on deleteMany/deleteOne for all 6 collections using the deleted user's ID; log errors for any rejected settlement; return HTTP 200 regardless of cascade outcome
  - Do NOT delete Order documents
  - File: `matasree-backend/src/controllers/adminController.ts`
  - Requirements: 9.1, 9.2, 9.3, 9.4

- [x] 16. Add Referrals section to ProfilePage
  - Add `referrals`, `referralCode`, `referralsLoading` state variables
  - Add `useEffect` that reads `user.referralCode` from auth store and fetches `GET /api/referrals` via `apiClient.get('/referrals')`
  - Render a new card section below the existing Quick Actions card with: referral code display + copy button, shareable invite link (`https://matasreesuper.com/register?ref=<code>`) + copy button, and a table with columns Referee / Date Joined / Status; show empty state message when list is empty; show skeleton while loading
  - File: `matasree-superstore-main/src/pages/ProfilePage.tsx`
  - Requirements: 10.1, 10.2, 10.3, 10.4, 10.5

## Phase 3: Admin Improvements

- [x] 17. Add getLowStockProducts backend endpoint
  - Add `getLowStockProducts` handler to `adminController.ts`: accepts `threshold` query param (default 10), returns `Product.find({ stock: { $lt: threshold } }).select('name stock price image').sort({ stock: 1 })`
  - Register route `GET /products/low-stock` in `adminRoutes.ts` behind the existing `verifyToken + verifyAdmin` middleware wall
  - Add `getLowStockProducts(threshold = 10)` method to `ApiClient` in `api.ts`
  - File: `matasree-backend/src/controllers/adminController.ts`
  - File: `matasree-backend/src/routes/adminRoutes.ts`
  - File: `matasree-superstore-main/src/services/api.ts`
  - Requirements: 11.3, 11.4

- [x] 18. Add Low Stock widget to AdminDashboard
  - Add `lowStock` state; fetch from `apiClient.getLowStockProducts()` during `fetchStats`
  - Add inline `LowStockWidget` component: renders a Card with an orange AlertCircle icon, lists each product's name + stock count + an Edit button linking to `/admin/products?edit=<id>`; shows "All products have adequate stock" when list is empty
  - Render `<LowStockWidget products={lowStock} />` in the dashboard grid
  - File: `matasree-superstore-main/src/pages/AdminDashboard.tsx`
  - Requirements: 11.1, 11.2, 11.5

- [x] 19. Add getCouponAnalytics backend endpoint
  - Add `getCouponAnalytics` handler to `adminController.ts`: fetches all Coupons; runs an Order aggregation to sum `discountAmount` per `couponCode`; returns array of `{ code, discountType, discountValue, usageCount, maxUses, totalRevenueSaved }` per coupon
  - Import `Coupon` model into `adminController.ts`
  - Register route `GET /coupons/analytics` in `adminRoutes.ts` behind the auth middleware
  - Add `getCouponAnalytics()` method to `ApiClient` in `api.ts`
  - File: `matasree-backend/src/controllers/adminController.ts`
  - File: `matasree-backend/src/routes/adminRoutes.ts`
  - File: `matasree-superstore-main/src/services/api.ts`
  - Requirements: 12.2, 12.3

- [x] 20. Add Coupon Analytics table to AdminDashboard
  - Add `couponAnalytics` state; fetch from `apiClient.getCouponAnalytics()` during `fetchStats`
  - Add inline `CouponAnalyticsTable` component: renders a Card with a plain HTML table with columns Code / Type / Value / Usage/Max / Revenue Saved; formats `maxUses === 0` as "Unlimited"; formats `totalRevenueSaved` as ₹ with `toLocaleString('en-IN')`; shows "No coupons available" when empty
  - Render `<CouponAnalyticsTable data={couponAnalytics} />` in the dashboard grid
  - File: `matasree-superstore-main/src/pages/AdminDashboard.tsx`
  - Requirements: 12.1, 12.4, 12.5

- [x] 21. Add date range filter to getRevenueAnalytics backend
  - Replace `getRevenueAnalytics` in `adminController.ts` with a version that accepts `startDate` and `endDate` query params in `YYYY-MM-DD` format, builds the `$match.createdAt` filter accordingly, validates that `startDate <= endDate` (return HTTP 400 otherwise), and falls back to last 30 days when no params are provided
  - Update `getRevenueAnalytics(params?)` method signature in `api.ts` to accept `{ startDate?: string; endDate?: string }`
  - File: `matasree-backend/src/controllers/adminController.ts`
  - File: `matasree-superstore-main/src/services/api.ts`
  - Requirements: 13.1, 13.2, 13.5

- [x] 22. Add date range picker to AdminDashboard revenue chart
  - Add `revStartDate` and `revEndDate` state variables
  - Add a `fetchRevenue(start?, end?)` helper that calls `apiClient.getRevenueAnalytics()` with optional date params and updates the analytics state
  - Add two `<input type="date">` controls and Apply / Reset buttons above the Revenue Trends `CardHeader`; on Apply, call `fetchRevenue(revStartDate, revEndDate)`; on Reset, clear dates and call `fetchRevenue()`
  - File: `matasree-superstore-main/src/pages/AdminDashboard.tsx`
  - Requirements: 13.3, 13.4

- [x] 23. Add getTopSellingProducts backend endpoint
  - Add `getTopSellingProducts` handler to `adminController.ts`: accepts `limit` query param (default 5, max 20), returns `Product.find({ sold: { $gt: 0 } }).select('name sold price image').sort({ sold: -1 }).limit(limit)`
  - Register route `GET /products/top-selling` in `adminRoutes.ts` behind the auth middleware
  - Add `getTopSellingProducts(limit = 5)` method to `ApiClient` in `api.ts`
  - File: `matasree-backend/src/controllers/adminController.ts`
  - File: `matasree-backend/src/routes/adminRoutes.ts`
  - File: `matasree-superstore-main/src/services/api.ts`
  - Requirements: 14.3, 14.4

- [x] 24. Add Top Products widget to AdminDashboard
  - Add `topProducts` state; fetch from `apiClient.getTopSellingProducts()` during `fetchStats`
  - Add inline `TopProductsWidget` component: renders a Card with a TrendingUp icon, ranks each product #1–5 with name + units sold + revenue (`price × sold`) formatted as ₹; shows "No sales data available" when list is empty
  - Render `<TopProductsWidget products={topProducts} />` in the dashboard grid
  - File: `matasree-superstore-main/src/pages/AdminDashboard.tsx`
  - Requirements: 14.1, 14.2, 14.5

- [x] 25. Add activeOnly server-side filtering to getSeasonalBanners
  - In `adminController.ts`, update `getSeasonalBanners` to check `req.query.activeOnly === 'true'`; when true, add `{ activeFrom: { $lte: now }, activeTo: { $gte: now } }` to the query filter; when absent, return all banners unchanged
  - Update `getSeasonalBanners(activeOnly = true)` in `api.ts` to pass `{ params: activeOnly ? { activeOnly: 'true' } : {} }`
  - File: `matasree-backend/src/controllers/adminController.ts`
  - File: `matasree-superstore-main/src/services/api.ts`
  - Requirements: 15.1, 15.2, 15.3

## Phase 4: Infrastructure

- [x] 26. Fix robots.txt admin path directive
  - Change `Disallow: /admin` to `Disallow: /admin/` (add trailing slash)
  - Preserve all other existing Disallow directives unchanged
  - File: `matasree-superstore-main/public/robots.txt`
  - Requirements: 16.1, 16.2, 16.3

- [x] 27. Parameterise MongoDB password in docker-compose.yml
  - Change `MONGO_INITDB_ROOT_PASSWORD: secure_password` to `MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD:-secure_password}` in the `mongodb` service
  - Change the `MONGODB_URI` value in the `backend` service to `mongodb://admin:${MONGO_PASSWORD:-secure_password}@mongodb:27017/matasree?authSource=admin`
  - Verify no other hardcoded `secure_password` strings remain in the file
  - File: `docker-compose.yml`
  - Requirements: 17.1, 17.2, 17.3
