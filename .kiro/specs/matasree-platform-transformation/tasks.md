# Implementation Plan: Matasree Platform Transformation

## Overview

This plan converts the Matasree Platform Transformation design into incremental coding tasks, organized into eight groups that build on each other. Foundation tasks establish DB indexes, bundle infrastructure, security hardening, and codebase cleanup first. Backend services follow, then frontend components, page enhancements, content pages, conversion/loyalty UI, SEO/accessibility, and finally property-based tests. Each task references the specific requirement(s) it satisfies.

## Tasks

---

### Group 1: Foundation

- [x] 1. Add MongoDB indexes to existing collections
  - [x] 1.1 Add compound and single-field indexes to Order, Address, and Payment models
    - In `matasree-backend/src/models/Order.ts`, add `orderSchema.index({ userId: 1, createdAt: -1 })` and `orderSchema.index({ orderstatus: 1 })` with `{ background: true }`
    - In `matasree-backend/src/models/Address.ts`, add `addressSchema.index({ userId: 1 }, { background: true })`
    - In `matasree-backend/src/models/Payment.ts`, add `paymentSchema.index({ orderId: 1 }, { background: true })` and `paymentSchema.index({ userId: 1, status: 1 }, { background: true })`
    - Wrap each `createIndex` call so that failures log the index name and collection but do not crash the server (try/catch in DB connect hook)
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7_

- [x] 2. Configure Vite bundle splitting and analysis
  - [x] 2.1 Add `rollup-plugin-visualizer` and configure `manualChunks` in `vite.config.ts`
    - Install `rollup-plugin-visualizer@^5.12.0` as a dev dependency
    - Add `visualizer({ filename: 'dist/bundle-analysis.html', open: false })` to `plugins`
    - Configure `build.rollupOptions.output.manualChunks` with chunks: `vendor-react`, `vendor-ui`, `vendor-framer`, `vendor-zustand`, `vendor-axios`, `vendor-charts`, `pages-admin`
    - Verify `npm run build` outputs `dist/bundle-analysis.html`
    - _Requirements: 25.1, 25.2, 25.4_
  - [x] 2.2 Audit and fix tree-shaking imports across the frontend
    - Search for `import * as` patterns on `framer-motion`, `@radix-ui/*`, and `recharts`; replace with named imports
    - _Requirements: 25.3_

- [x] 3. Security hardening — JWT secret validation and OAuth token delivery fix
  - [x] 3.1 Add JWT weak-secret detection to `src/config/env.ts`
    - Define `WEAK_SECRETS` set as specified in design (6 known-weak values)
    - Implement `validateJwtSecret(key)` that calls `process.exit(1)` in production or `logger.warn` in development
    - Call `validateJwtSecret('JWT_SECRET')` and `validateJwtSecret('JWT_REFRESH_SECRET')` in the startup sequence
    - Handle absent/empty values as weak defaults
    - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5_
  - [x] 3.2 Fix OAuth token delivery — backend `oauthCallback` and `/api/auth/token` endpoint
    - Modify `oauthCallback` in `authController.ts`: issue httpOnly refresh-token cookie and redirect to `/auth/callback` with NO token in the URL
    - Add `GET /api/auth/token` (cookie-authenticated) that returns `{ accessToken, user }` exactly once per OAuth flow
    - _Requirements: 29.1, 29.2_
  - [x] 3.3 Implement `/auth/callback` frontend page for OAuth token handoff
    - Create `src/pages/OAuthCallbackPage.tsx`
    - On mount: fetch `GET /api/auth/token`, validate origin matches `VITE_API_BASE_URL`, call `store.setAuth(accessToken, user)`, clear sessionStorage, redirect to `/`
    - If sessionStorage entry absent or malformed, redirect to `/login?error=auth_failed`
    - Token stored in Zustand in-memory only, never `localStorage`
    - _Requirements: 29.2, 29.3, 29.4, 29.5_

- [x] 4. Codebase cleanup
  - [x] 4.1 Remove `isAdmin` runtime reads; consolidate on `role === 'admin'`
    - Audit all controllers for `req.user.isAdmin` reads and replace with `req.user.role === 'admin'`
    - Update `verifyAdmin` middleware to use `role === 'admin'` exclusively
    - Remove `isAdmin` from API response payloads where `role` is already present
    - Add deprecation comment to `isAdmin` field in `User.ts` schema
    - _Requirements: 34.1, 34.2, 34.3, 34.4_
  - [x] 4.2 Delete unused static data files and dead components
    - Check imports of `src/data/products.ts` and `src/data/companyData.ts`; delete files if unreferenced
    - Check imports of `TeamSection` and `TraditionalElements`; delete components if unreferenced
    - Run `tsc --noEmit` with `noUnusedLocals: true` to confirm no remaining references
    - Record removed files in `CHANGELOG.md`
    - _Requirements: 35.1, 35.2, 35.3, 35.4_
  - [x] 4.3 Document Twilio SMS stub
    - Add JSDoc comment to `sendOTPSMS` in `src/utils/email.ts` stating stub status and env var requirements
    - Add startup warning log when Twilio env vars are absent
    - Guard `sendOTPSMS` so it returns `false` (no unhandled exception) when credentials are absent
    - Add "SMS Configuration" section and "Validation Strategy" section to `matasree-backend/README.md`
    - _Requirements: 36.1, 36.2, 36.3, 36.4, 33.5_

- [x] 5. Checkpoint — Foundation complete
  - Ensure `npm run build` in frontend succeeds and `dist/bundle-analysis.html` is present; ensure `tsc --noEmit` passes in both frontend and backend; ask the user if questions arise.

---

### Group 2: Backend Services

- [x] 6. Create new Mongoose models
  - [x] 6.1 Create `Wishlist`, `LoyaltyAccount`, `LoyaltyTransaction`, `Referral`, `SeasonalBanner`, and `Recipe` models
    - Create `src/models/Wishlist.ts` with interface, schema, indexes `{ userId: 1 }` (unique) and `{ 'items.productId': 1 }`
    - Create `src/models/LoyaltyAccount.ts` with interface, schema, index `{ userId: 1 }` unique
    - Create `src/models/LoyaltyTransaction.ts` with interface, schema, indexes `{ userId: 1, createdAt: -1 }` and `{ orderId: 1 }`
    - Create `src/models/Referral.ts` with interface, schema, indexes `{ referrerId: 1 }`, `{ refereeId: 1 }` (unique), `{ code: 1 }`
    - Create `src/models/SeasonalBanner.ts` with interface, schema, index `{ activeFrom: 1, activeTo: 1 }`
    - Create `src/models/Recipe.ts` with interface, schema, indexes `{ productTags: 1 }` and `{ region: 1 }`
    - _Requirements: 3, 10, 11, 9_
  - [x] 6.2 Extend existing Order, Cart, User, and Coupon schemas
    - Add `couponCode`, `discountAmount`, `loyaltyPointsEarned`, `loyaltyPointsRedeemed`, `loyaltyDiscountAmount` to Order model
    - Add `abandonmentEmailSentAt?: Date` to Cart model
    - Add `referralCode: string` (unique) and `loyaltyAccountId` to User model
    - Add `usageCount: number` (default 0) and `categoryRestrictions?: string[]` to Coupon model
    - _Requirements: 10, 11, 12.2, 12.3, 14.3, 32.1_

- [x] 7. Implement Wishlist API
  - [x] 7.1 Create `src/controllers/wishlistController.ts` and `src/routes/wishlistRoutes.ts`
    - Implement `getWishlist`: populate `name`, `price`, `image`, `stock`; omit stale product refs and remove them from DB; cap at 100 items
    - Implement `addToWishlist`: validate ObjectId; return 409 on duplicate; return 400 if at 100-item cap; return 201 on success
    - Implement `removeFromWishlist`: return 404 if not found; return 200 on success
    - All routes protected by `verifyToken`; return 401 on unauthenticated access
    - Register routes in `server.ts` as `/api/wishlist`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 8. Implement Loyalty Engine
  - [x] 8.1 Create `src/services/loyaltyService.ts` with pure-function engine
    - Implement `awardLoyaltyPoints(orderId, userId, subtotalPaid)`: `FLOOR(subtotal/10)` points; upsert `LoyaltyAccount`; create `LoyaltyTransaction` with `reason: 'order_earn'`; update Order `loyaltyPointsEarned`
    - Implement `redeemLoyaltyPoints(userId, pointsRequested, orderSubtotal)`: check balance; cap discount at 50% of subtotal; decrement balance; create `LoyaltyTransaction` with `reason: 'redemption'`; return `discountAmount`
    - Implement `reverseLoyaltyPoints(orderId, userId)`: find earn transaction for order; create negative transaction; decrement balance
    - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.6_
  - [x] 8.2 Create `src/controllers/loyaltyController.ts` and `src/routes/loyaltyRoutes.ts`
    - `GET /api/loyalty/balance` — returns current balance
    - `GET /api/loyalty/transactions` — paginated transaction history
    - `POST /api/loyalty/redeem` — calls `redeemLoyaltyPoints`; returns `discountAmount`
    - All routes protected by `verifyToken`
    - Register in `server.ts` as `/api/loyalty`
    - _Requirements: 10.4_
  - [x] 8.3 Wire loyalty point award into order payment confirmation
    - In `orderController.ts` (or payment webhook handler): call `awardLoyaltyPoints` when `paymentStatus` transitions to `paid`, or for COD when `orderstatus` transitions to `delivered`
    - _Requirements: 10.1_

- [x] 9. Implement Referral Engine
  - [x] 9.1 Create `src/services/referralService.ts`
    - Implement `generateReferralCode(userId)`: create a unique alphanumeric code; assign to `user.referralCode`; called in `authService` on registration
    - Implement `applyReferralCode(newUserId, code)`: validate code exists; reject self-referral (HTTP 400); create `Referral` document with `status: 'pending'`
    - Implement `rewardReferrer(refereeId)`: find pending Referral by `refereeId`; credit referrer 50 loyalty points; send email notification; set `status: 'rewarded'`; called from order payment hook on referee's first paid order
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.6_
  - [x] 9.2 Create `src/controllers/referralController.ts` and `src/routes/referralRoutes.ts`
    - `GET /api/referral/my-code` — returns own referral code
    - `GET /api/referral/history` — lists referred users with status and reward
    - `POST /api/referral/apply` — public; applies code during registration
    - Register in `server.ts` as `/api/referral`
    - _Requirements: 11.5_

- [x] 10. Implement enhanced Search and Filter endpoints
  - [x] 10.1 Add autocomplete search endpoint to `productRoutes.ts`
    - Add `GET /api/products/search?q=&limit=10`: validate `q` ≤ 200 chars (return 400 if exceeded); MongoDB text search on `name`, `description`, `tags`; return ≤ 10 results; target ≤ 300 ms
    - Return empty array + HTTP 200 when no results; return structured error when DB unavailable
    - _Requirements: 1.1, 1.2, 1.4, 1.6, 1.7_
  - [x] 10.2 Extend `GET /api/products` to accept filter query parameters
    - Accept and apply: `minPrice`, `maxPrice`, `category`, `weight`, `minRating`, `inStock`, `page`, `limit`
    - Skip absent parameters; paginate at 10 per page; return total count in response
    - _Requirements: 2.1, 2.5, 2.7, 1.5_
  - [x] 10.3 Add Recently Viewed endpoints to `productRoutes.ts`
    - `GET /api/products/recently-viewed` (verifyToken): return ≤ 10 products ordered by most-recent timestamp, omitting deleted products
    - `POST /api/products/recently-viewed/:productId` (verifyToken): upsert product into sliding window of 10
    - _Requirements: 4.1, 4.4, 4.5_

- [x] 11. Implement Cart Sync and Cancel Order routes
  - [x] 11.1 Add `POST /api/cart/sync` to `cartRoutes.ts`
    - Create `syncCart(userId, clientItems)` logic: fetch live products, compare prices and stock, return `{ syncedItems, priceDiffs, removedItems }`; persist reconciled cart to DB
    - Protect with `verifyToken`
    - _Requirements: 24.1, 24.2, 24.3, 24.4_
  - [x] 11.2 Add `PUT /api/orders/:id/cancel` to `orderRoutes.ts`
    - Verify ownership (403 if not owner); verify order exists (404); allow cancellation only for `pending` or `confirmed` status (400 otherwise)
    - On success: set `orderstatus: 'cancelled'`; restore stock for each item; call `reverseLoyaltyPoints` if loyalty active; return updated order
    - If `paymentMethod === 'razorpay'` and `paymentStatus === 'paid'`: initiate Razorpay refund; update Payment `status` to `'refund_initiated'`
    - _Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6_

- [x] 12. Implement Cart Abandonment scheduled job
  - [x] 12.1 Create `src/jobs/cartAbandonmentJob.ts` using `node-cron`
    - Install `node-cron@^3.0.3`
    - Schedule every 30 minutes: find Carts where `updatedAt < (now - abandonWindow)` AND `abandonmentEmailSentAt = null` AND `items.length > 0`
    - For each cart: check if order created after `cart.updatedAt` (skip if so); send abandonment email with items, checkout deep link, optional coupon; set `abandonmentEmailSentAt = now`
    - Read `abandonWindow` and optional coupon from `AdminConfig` document at job runtime
    - Add admin `GET /api/admin/abandonment-config` and `PUT /api/admin/abandonment-config` routes (verifyAdmin)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 13. Coupon Engine improvements and order discount persistence
  - [x] 13.1 Update coupon validation logic in the coupon controller/service
    - Validate: existence, `expiresAt`, `usageCount >= maxUses` (when `maxUses > 0`), `minOrderAmount`
    - Apply category restriction: filter `cartItems` by `categoryRestrictions` to compute `effectiveAmount`
    - Apply percentage vs. fixed discount; cap by `maxDiscount`; cap by `orderAmount`
    - Increment `usageCount` on redemption
    - Return descriptive 400 error messages for each failure reason
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
  - [x] 13.2 Persist coupon code and discount amount on Order document
    - In `createOrder` handler: set `couponCode` and `discountAmount` from validated coupon result
    - Compute `totalAmount = itemsTotal + shippingFee - discountAmount` (clamp to ≥ 0)
    - _Requirements: 32.2, 32.3_

- [x] 14. Input validation audit — consolidate to Joi
  - [x] 14.1 Audit and refactor all route handlers to use Joi exclusively
    - Replace any `express-validator` or `zod` request-body validation in auth, product, order, coupon, review, and address routes with Joi schemas
    - All Joi schemas use `abortEarly: false, stripUnknown: true`; return `{ success: false, message: "<field>: <message>" }` on failure
    - Confirm `sanitizer.ts` middleware remains globally applied in `server.ts`
    - _Requirements: 33.1, 33.2, 33.3, 33.4_

- [x] 15. Checkpoint — Backend services complete
  - Run `npm test` in `matasree-backend`; ensure all existing tests pass and new routes return expected responses. Ask the user if questions arise.

---

### Group 3: Core Frontend Components

- [x] 16. Build Search and Filter UI components
  - [x] 16.1 Create `src/components/SearchBar.tsx`
    - Debounced input (300 ms); calls `GET /api/products/search?q=`; renders dropdown of ≤ 10 suggestions
    - On suggestion select: navigate to product detail if single match, else navigate to `/products?q=` filtered results
    - Display "No products found" empty state with category browse suggestion on empty results
    - Handles `q` trimmed to 200 chars on client side
    - `aria-label` on input; keyboard accessible (arrow keys, Enter, Escape)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_
  - [x] 16.2 Create `src/components/FilterPanel.tsx`
    - Supports simultaneous filters: price range, category (multi-select), weight (multi-select), minRating (1–5), inStock toggle
    - On filter change: update URL query string (`minPrice`, `maxPrice`, `category`, `weight`, `minRating`, `inStock`) and refetch products without page reload within 500 ms
    - "No products match your filters" empty state with "Clear filters" CTA
    - Display skeleton loaders during filter request in-flight
    - On clear all: restore default unfiltered list sorted by `createdAt` desc
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 17. Build QuickViewModal
  - [x] 17.1 Create `src/components/QuickViewModal.tsx`
    - Props: `productId | null`, `triggerRef`, `onClose`, `onAddToCart`
    - Fetch product data on open; display skeleton loader while loading
    - Display: images, name, price, rating, weight options, short description, stock status, Add-to-Cart button
    - Add-to-Cart inside modal: add to cart then close modal on success
    - `role="dialog"`, `aria-modal="true"`, `aria-label="Quick view: {productName}"`
    - Focus trap on open; restore focus to `triggerRef` on close
    - Visible close button with `aria-label="Close quick view"`; Escape key closes
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 18. Build ComparisonTray
  - [x] 18.1 Create `src/store/comparisonStore.ts` and `src/components/ComparisonTray.tsx`
    - Zustand store: `items[]` (max 4), `addProduct`, `removeProduct`, `clearAll`, `isOpen`
    - Guard: if `items.length >= 4`, toast "You can compare up to 4 products at a time."
    - Sticky bottom tray UI; comparison view shows attributes side-by-side: name, price, rating, weight, category, stock status, description
    - Remove product updates view without page reload; session-lifetime persistence (no localStorage persist)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 19. Build StickyAddToCartBar
  - [x] 19.1 Create `src/components/StickyAddToCartBar.tsx`
    - Use `IntersectionObserver` on the primary Add-to-Cart button ref; show bar when button exits viewport
    - Display: product name (truncated at 30 chars with ellipsis), current price (synced), Add-to-Cart button
    - _Requirements: 13.1_

- [x] 20. Build MobileNavDrawer and BottomTabBar
  - [x] 20.1 Create `src/components/MobileNavDrawer.tsx`
    - Renders when viewport < 768 px; slide-in drawer with logo, nav links, category links, wishlist, cart, account links
    - Focus trap (no Tab escape); `overflow: hidden` on `<body>` while open
    - Closes on Escape key, overlay tap, or close button; close animation ≤ 300 ms (Framer Motion exit)
    - Close button with `aria-label="Close navigation menu"`
    - _Requirements: 19.1, 19.2, 19.3, 19.4_
  - [x] 20.2 Create `src/components/BottomTabBar.tsx`
    - Renders when viewport < 768 px; fixed bottom bar with Home, Products, Cart (badge when count > 0), Account
    - _Requirements: 19.5_

- [x] 21. Build EmptyState components and SkeletonLoaders
  - [x] 21.1 Create `src/components/EmptyState.tsx` with all five variants
    - Variants: `cart`, `wishlist`, `search`, `orders`, `reviews`
    - Each: icon ≥ 64 × 64 px, descriptive message, CTA button with correct label and href
    - Consistent layout: icon centred above message (`text-muted-foreground`), primary button style
    - _Requirements: 21.1, 21.2, 21.3_
  - [x] 21.2 Create `src/components/skeletons/` — `ProductCardSkeleton.tsx` and `TestimonialSkeleton.tsx`
    - `ProductCardSkeleton`: mimics ProductCard layout with shimmer animation
    - `TestimonialSkeleton`: mimics testimonial card layout
    - _Requirements: 17.4, 2.6, 6.5_

- [x] 22. Checkpoint — Core frontend components complete
  - Verify all new components compile without TypeScript errors (`tsc --noEmit`). Ask the user if questions arise.

---

### Group 4: Product Experience

- [x] 23. Enhance ProductCard component
  - [x] 23.1 Update `src/components/ProductCard.tsx` with all required fields and micro-interactions
    - Display: image, name, price (with `originalPrice` struck through when higher), star rating (filled/empty stars), weight, stock badge ("In Stock" / "Low Stock" when `stock ≤ 10` / "Out of Stock" when `stock = 0`), wishlist toggle icon, "Quick View" trigger button
    - Micro-interactions: image zoom to `scale(1.1)` on hover (CSS transform, 200 ms); animated heart fill on wishlist toggle; Add-to-Cart shows loading spinner then checkmark for ≥ 1500 ms before reverting
    - Low-stock indicator "Only [N] left in stock!" when `stock` between 1 and 9 inclusive
    - Wire wishlist toggle to `POST/DELETE /api/wishlist/:productId`
    - Wire "Quick View" trigger button to open `QuickViewModal` (pass `triggerRef`)
    - Wire "Add to Comparison" action to `comparisonStore.addProduct`
    - _Requirements: 18.1, 18.2, 13.2, 3_

- [x] 24. Enhance ProductDetailPage
  - [x] 24.1 Update `src/pages/ProductDetailPage.tsx` — gallery, detail fields, sticky bar, sharing
    - Image gallery with 1–8 images; thumbnail navigation updates main image; `loading="eager"` for primary image
    - Display: name, price, discount badge (% off when `originalPrice > price`), star rating + review count, weight selector, stock indicator, description, Add-to-Cart, Add-to-Wishlist, native Share button (Web Share API with clipboard fallback)
    - Show "Only [N] left in stock!" when `stock` 1–9; low-stock indicator on card too
    - Show "[N] people bought this in the last 30 days" when `sold > 0`
    - Render `StickyAddToCartBar` wired to primary button via `IntersectionObserver`
    - Render `TrustBadges` row below Add-to-Cart
    - Render `WhatsAppButton` when `VITE_WHATSAPP_NUMBER` is set
    - Render `OrderTimeline` (for order detail page — separate concern; see Group 6)
    - _Requirements: 18.3, 18.4, 13.1, 13.2, 13.3, 13.4, 15.1, 15.2_
  - [x] 24.2 Add Related Products and Frequently Bought Together sections to ProductDetailPage
    - "Related Products": `GET /api/products?category=&limit=8` excluding current product; lazy-load after main content renders
    - "Frequently Bought Together": derive from co-purchase data or fall back to top-selling same-category products (≤ 3); lazy-load
    - Adding from either section updates cart count in header
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [x] 24.3 Add Recently Viewed section to Homepage and ProductDetailPage
    - On product view: call `POST /api/products/recently-viewed/:productId` (logged-in) or update `localStorage` key `matasree-recently-viewed` (guest)
    - Merge localStorage + server list on login: deduplicate by productId, keep most-recent timestamp, cap at 10
    - Render recently-viewed carousel (≤ 10 cards, most-recent first) on homepage and product detail page
    - Omit deleted products silently
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 25. Apply image lazy loading across the platform
  - [x] 25.1 Create `src/components/ProductImage.tsx` and audit all product `<img>` elements
    - Implement `ProductImage` with `isAboveFold` prop: `loading="eager"` for hero/first homepage image, `loading="lazy"` for all others
    - Use skeleton placeholder matching declared aspect ratio while image loads
    - Set explicit `width`, `height` or CSS `aspect-ratio` to keep CLS contribution < 0.1
    - Replace bare `<img>` tags in ProductCard, ProductDetailPage, and carousels with `ProductImage`
    - _Requirements: 22.1, 22.2, 22.3, 22.4_

- [x] 26. Checkpoint — Product experience complete
  - Verify ProductCard, ProductDetailPage, and related features compile and render. Ask the user if questions arise.

---

### Group 5: Customer Engagement

- [x] 27. Wire Reviews to Products
  - [x] 27.1 Update review controller and routes to enforce product association
    - Ensure `productId` is required when submitting a review via `POST /api/reviews`
    - Check that authenticated `userId` has a completed, paid order containing `productId`; return 403 with "You must purchase this product before reviewing it." if not
    - Set `isApproved: false` on creation; send admin email notification
    - Prevent duplicate review per customer per product (HTTP 409)
    - On Admin approval: set `isApproved: true`; recompute product `rating` as arithmetic mean of all approved ratings (rounded to 1 decimal) and update Product document
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7_
  - [x] 27.2 Update ProductDetailPage to display approved reviews
    - Fetch approved reviews for `productId` from backend; paginate 10 per page, sorted `createdAt` desc
    - Display "Be the first to review this product" when no approved reviews
    - Show star rating + review count in product header
    - _Requirements: 8.6, 8.8_

- [x] 28. Build Testimonials section and Recipes page
  - [x] 28.1 Add Testimonials section to Homepage
    - Fetch reviews where `isFeatured: true` from Review model
    - Render `TestimonialSkeleton` while loading (3 skeletons)
    - _Requirements: 9.1_
  - [x] 28.2 Create `src/pages/RecipesPage.tsx` and Recipe content
    - List recipes with title, ingredients, step-by-step instructions, product tags
    - Filter by product tag: display only matching recipes when tag selected
    - Group recipes by Indian regional cuisine (North Indian, South Indian, Bengali, Rajasthani, Other)
    - _Requirements: 9.2, 9.3, 16.3_
  - [x] 28.3 Add Seasonal Banners to Homepage
    - Fetch `GET /api/admin/banners`; filter client-side where current date is within `activeFrom`–`activeTo`
    - Render one seasonal banner slot on homepage (only when an active banner exists)
    - _Requirements: 9.4, 9.5, 17.1_

- [x] 29. Build and enhance About, Spice Guide pages
  - [x] 29.1 Update `src/pages/AboutPage.tsx` with full brand content
    - Sections: brand story, manufacturing process, quality assurance, "Why Choose Us" (≥ 4 value propositions with icons), customer success stories
    - Add ARIA landmark roles (`main`, `nav`, `aside`, `footer`) to all content pages
    - _Requirements: 16.1, 16.4, 16.5_
  - [x] 29.2 Create `src/pages/SpiceGuidePage.tsx`
    - Browse spices by region, flavor profile, and culinary use
    - Each spice links to associated products via product tags
    - _Requirements: 16.2_

- [x] 30. Checkpoint — Customer engagement complete
  - Run TypeScript compilation check; verify review wiring, testimonials, and new pages build. Ask the user if questions arise.

---

### Group 6: Conversion and Loyalty UI

- [x] 31. Build LoyaltyWidget
  - [x] 31.1 Create `src/components/LoyaltyWidget.tsx`
    - Display current points balance; fetches `GET /api/loyalty/balance`
    - On checkout page: render redeem input + "Apply" button; calls `POST /api/loyalty/redeem`
    - Display insufficient balance error inline (mirrors backend 400 response)
    - _Requirements: 10.4_

- [x] 32. Build Referral UI on ProfilePage
  - [x] 32.1 Add referral section to `src/pages/ProfilePage.tsx`
    - Display `GET /api/referral/my-code` — show referral code with copy button
    - Display `GET /api/referral/history` — table of referee name, status, reward earned
    - _Requirements: 11.5_

- [x] 33. Build WhatsApp Button
  - [x] 33.1 Create `src/components/WhatsAppButton.tsx`
    - "Order via WhatsApp" button on ProductDetailPage: opens `https://wa.me/{VITE_WHATSAPP_NUMBER}?text={encodedMessage}` in new tab with product name, qty, price message
    - "Order via WhatsApp" button on cart page: constructs multi-item message
    - Floating action button (fixed bottom-right, mobile < 768 px) on all pages: links to generic help message
    - Hide entirely (no error) when `VITE_WHATSAPP_NUMBER` is absent
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 34. Build ExitIntentModal and TrustBadges
  - [x] 34.1 Create `src/components/ExitIntentModal.tsx`
    - Detect pointer moving toward top edge of browser window (`mouseleave` on document with `clientY < 10`)
    - Show modal exactly once per browser session (sessionStorage flag); only on checkout page with non-empty cart and order not yet placed
    - Modal contains discount code valid for 30 minutes
    - _Requirements: 13.5_
  - [x] 34.2 Create `src/components/TrustBadges.tsx`
    - Four badges: "Secure Payment", "Free Delivery on orders ₹499+", "100% Natural Quality", "Easy 7-Day Returns"
    - Render below Add-to-Cart on ProductDetailPage and in order summary on CheckoutPage
    - _Requirements: 13.3_

- [x] 35. Build OrderTimeline on OrderDetailPage
  - [x] 35.1 Create `src/components/OrderTimeline.tsx` and wire to `src/pages/OrderDetailPage.tsx`
    - Render status progression: pending → confirmed → shipped → delivered → cancelled (cancelled as terminal branch)
    - Current status: filled icon + primary colour; future/inactive: outlined icon + muted colour
    - Show "Cancel Order" button when `orderstatus` is `pending` or `confirmed`; hide for all other statuses
    - Cancel button calls `PUT /api/orders/:id/cancel`; on success refresh order data
    - Display `couponCode` and discount savings row when `discountAmount > 0`
    - _Requirements: 18.5, 31.7, 32.4_

- [x] 36. Homepage redesign and page transitions
  - [x] 36.1 Update `src/pages/Index.tsx` with redesigned section order and animations
    - Section order: hero banner with CTA, featured categories, bestseller products, seasonal banner slot, testimonials, newsletter signup
    - Page transition animations using Framer Motion on route changes (≤ 400 ms total)
    - Scroll-triggered animations with `whileInView` triggering at 20% viewport entry
    - Skeleton loaders for featured products (8 card skeletons) and testimonials (3 skeletons) during loading
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [x] 37. Checkout Cart Sync integration
  - [x] 37.1 Wire `POST /api/cart/sync` into the checkout flow on the frontend
    - On "Proceed to Checkout": call `POST /api/cart/sync` before rendering address step; show loading spinner on button
    - If price changes returned: update displayed prices; show blocking notification with changed items before proceeding
    - If out-of-stock items returned: remove from client cart; show notification; block progression until customer acknowledges
    - If sync fails (network/non-2xx): display "Unable to verify cart. Please try again."; retain all items; do NOT navigate to payment
    - If sync takes > 3 s: display "Verifying your cart…" overlay
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_

- [x] 38. Checkpoint — Conversion and loyalty UI complete
  - Compile and check all new components; verify checkout sync flow integration. Ask the user if questions arise.

---

### Group 7: SEO and Accessibility

- [x] 39. Implement PageHelmet and per-page meta tags
  - [x] 39.1 Install `react-helmet-async@^2.0.4` and create `src/components/PageHelmet.tsx`
    - Add `<HelmetProvider>` to root `App.tsx`
    - `PageHelmet` props: `title`, `description`, `ogImage`, `ogType`, `canonicalUrl`, `noIndex`
    - Set `<link rel="canonical">` on every page
    - Set `og:title`, `og:description`, `og:image`, `og:url`, `og:type` on all public pages
    - Apply `noIndex: true` (renders `<meta name="robots" content="noindex, nofollow">`) on: login, register, forgot-password, cart, checkout, `/profile/*`, `/orders/*`, `/addresses/*`, `/admin/*`
    - Apply per-page title templates per the Page Meta Tag Matrix in the design
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5_

- [x] 40. Implement JSON-LD structured data
  - [x] 40.1 Create `src/components/JsonLd.tsx` and add schema injection to relevant pages
    - `JsonLd` renders `<script type="application/ld+json">` via react-helmet-async
    - ProductDetailPage: inject `Product` schema with `name`, `image`, `description`, `sku`, `offers.price`, `offers.priceCurrency: "INR"`, `offers.availability`, and `aggregateRating` (when reviews > 0)
    - Homepage + AboutPage: inject `Organization` schema with name, url, logo, contactPoint, sameAs
    - ProductDetailPage + category pages: inject `BreadcrumbList` schema (Home → Category → Product)
    - AboutPage + ContactPage: inject `LocalBusiness` schema with name, address, telephone, openingHours
    - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5_

- [x] 41. Generate sitemap script and robots.txt
  - [x] 41.1 Create `matasree-backend/src/scripts/generateSitemap.ts`
    - Connect to MongoDB; query all active products and categories
    - Write valid `sitemap.xml` to `matasree-superstore-main/public/sitemap.xml`
    - Include: homepage (`priority: 1.0`, `changefreq: monthly`), `/products` (`0.8`, `weekly`), each `/product/{_id}` (`0.8`, `weekly`, `lastmod: updatedAt`), each category, `/about`, `/recipes`, `/contact` (`0.6`, `monthly`)
    - Exit with code 1 and `stderr` message on MongoDB connection error
    - Add `"generate:sitemap": "ts-node src/scripts/generateSitemap.ts"` to `matasree-backend/package.json` scripts
    - _Requirements: 28.1, 28.2, 28.4, 28.5_
  - [x] 41.2 Create `matasree-superstore-main/public/robots.txt`
    - `User-agent: *`; Disallow: `/admin`, `/profile`, `/orders`, `/addresses`, `/checkout`, `/cart`
    - `Sitemap: {FRONTEND_URL}/sitemap.xml`
    - _Requirements: 28.3_

- [x] 42. Accessibility audit and ARIA fixes
  - [x] 42.1 Audit and fix ARIA attributes, focus indicators, and alt text across the platform
    - Ensure all buttons, links, and form inputs have discernible accessible names via `aria-label`, `aria-labelledby`, or visible text
    - Replace missing `alt` attributes on informational images; set `alt=""` on decorative images
    - Add ARIA landmark roles (`main`, `nav`, `aside`, `footer`) to all content pages
    - Ensure all form error messages use `aria-describedby` to associate with their input field
    - Verify all modal dialogs have `role="dialog"` and `aria-modal="true"` and correct focus trap/restoration
    - Add visible focus indicators with ≥ 3:1 contrast ratio and 2 px outline with 2 px offset to all focusable elements
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 16.5_

- [x] 43. Checkpoint — SEO and accessibility complete
  - Run `tsc --noEmit` in frontend; run `npm run generate:sitemap` to verify script executes. Ask the user if questions arise.

---

### Group 8: Property-Based Tests

- [x] 44. Write property-based tests for LoyaltyEngine
  - [x] 44.1 Create `src/tests/loyalty.property.test.ts`
    - Install `fast-check@^3.19.0` as a dev dependency
    - **Property 1: Loyalty Balance Non-Negative** — `fc.property(fc.integer({min:0}), fc.integer({min:0}), (balance, redeem) => { const effective = Math.min(redeem, balance); return balance - effective >= 0; })` — Validates: Requirements 10.2, 10.3, 10.5
    - **Property 2: Loyalty Transaction Consistency** — `fc.property(fc.integer({min:0, max:10000}), fc.integer({min:-1000, max:1000}), (prior, delta) => { const after = Math.max(0, prior + delta); return after >= 0; })` — Validates: Requirements 10.1, 10.6
    - **Property 3: Redemption Cap (50% of Subtotal)** — `fc.property(fc.integer({min:0, max:10000}), fc.float({min:0.01, max:100000}), (points, subtotal) => { const discount = Math.min(points * 0.5, subtotal * 0.5); return discount <= subtotal * 0.5; })` — Validates: Requirements 10.2
    - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.6_
  - [x] 44.2 Run LoyaltyEngine property tests
    - Execute `npx jest loyalty.property.test.ts --testPathPattern` and confirm all three properties pass
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 45. Write property-based tests for CouponEngine
  - [x] 45.1 Create `src/tests/coupon.property.test.ts`
    - **Property 4: Coupon Discount Bounded by Order Amount** — `fc.property(fc.record({ type: fc.constantFrom('percentage','fixed'), value: fc.float({min:0,max:200}), max: fc.float({min:0,max:10000}) }), fc.float({min:0.01,max:100000}), (coupon, order) => { const raw = coupon.type==='percentage' ? order*(coupon.value/100) : coupon.value; const capped = coupon.max>0 ? Math.min(raw,coupon.max) : raw; return Math.min(capped,order) <= order; })` — Validates: Requirements 12.1, 12.3, 12.5
    - **Property (expired coupon always invalid)** — `fc.property(fc.date({ max: new Date(Date.now() - 1) }), (expiresAt) => { const isExpired = expiresAt < new Date(); return isExpired === true; })` — Validates: Requirements 12.1
    - **Property (maxUses=0 never usage-limited)** — `fc.property(fc.integer({ min: 0, max: 10000 }), (usageCount) => { const isLimited = 0 > 0 && usageCount >= 0; return isLimited === false; })` — Validates: Requirements 12.2
    - _Requirements: 12.1, 12.2, 12.3, 12.5_
  - [x] 45.2 Run CouponEngine property tests
    - Execute Jest with the coupon property test file and confirm all three properties pass
    - _Requirements: 12.1, 12.2, 12.5_

- [x] 46. Write property-based tests for CartSync
  - [x] 46.1 Create `src/tests/cartSync.property.test.ts`
    - **Property 5: Cart Sync Price Integrity** — Every item in `syncedItems` has `item.price === liveProduct.price` — Validates: Requirements 24.1, 24.2
    - **Property 6: Cart Sync Stock Guard** — No out-of-stock product appears in `syncedItems` (all items with `stock=0` end up in `removedItems`) — Validates: Requirements 24.3
    - Use exact `fc.property` expressions from the design document's Testing Strategy section
    - _Requirements: 24.1, 24.2, 24.3_
  - [x] 46.2 Run CartSync property tests
    - Execute Jest with the cartSync property test file and confirm both properties pass
    - _Requirements: 24.1, 24.3_

- [x] 47. Write property-based tests for WishlistDeduplication
  - [x] 47.1 Create `src/tests/wishlist.property.test.ts`
    - **Property 7: Wishlist Uniqueness** — Adding the same productId twice results in exactly one entry; `new Set(items).size === items.length` — Validates: Requirements 3.3
    - **Property 8: Wishlist Size Cap** — `items.length ≤ 100` at all times — Validates: Requirements 3.5
    - **Property 9: Order Discount Persistence** — When `discountAmount > 0`, `couponCode !== null && couponCode !== undefined` — Validates: Requirements 32.1, 32.2, 32.3
    - **Property 10: Referral Uniqueness Per Referee** — `referrer !== referee` implies no self-referral — Validates: Requirements 11.1, 11.6
    - Use exact `fc.property` expressions from the design document
    - _Requirements: 3.3, 3.5, 11.1, 11.6, 32.1, 32.2, 32.3_
  - [x] 47.2 Run WishlistDeduplication and remaining property tests
    - Execute Jest with wishlist property test file and confirm all four properties pass
    - _Requirements: 3.3, 3.5_

- [x] 48. Final checkpoint — All tests pass
  - Run `npm test` in `matasree-backend`; run `npm run build` in `matasree-superstore-main`; confirm all property-based tests pass, no TypeScript errors, and `dist/bundle-analysis.html` is present. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation between phases
- Property tests (Group 8) validate universal correctness properties from the design
- Unit and integration tests follow the existing Jest + supertest pattern in `src/tests/`
- All new backend routes follow the existing Express + asyncHandler + Joi validation pattern
- Frontend components use existing shadcn/ui + Tailwind + Framer Motion; no new UI libraries are introduced
- The `fast-check` library must be installed (`npm install --save-dev fast-check`) before running Group 8 tasks

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1", "4.1", "4.2", "4.3"] },
    { "id": 1, "tasks": ["2.2", "3.2", "6.1", "6.2"] },
    { "id": 2, "tasks": ["3.3", "7.1", "8.1", "9.1", "10.1", "10.2", "10.3", "13.1", "14.1"] },
    { "id": 3, "tasks": ["8.2", "8.3", "9.2", "11.1", "11.2", "12.1", "13.2"] },
    { "id": 4, "tasks": ["16.1", "16.2", "17.1", "18.1", "19.1", "19.2", "20.1", "20.2", "21.1", "21.2"] },
    { "id": 5, "tasks": ["23.1", "24.1", "24.2", "24.3", "25.1", "27.1", "27.2", "28.1", "28.2", "28.3", "29.1", "29.2"] },
    { "id": 6, "tasks": ["31.1", "32.1", "33.1", "34.1", "34.2", "35.1", "36.1", "37.1"] },
    { "id": 7, "tasks": ["39.1", "40.1", "41.1", "41.2", "42.1"] },
    { "id": 8, "tasks": ["44.1", "44.2", "45.1", "45.2", "46.1", "46.2", "47.1", "47.2"] }
  ]
}
```
