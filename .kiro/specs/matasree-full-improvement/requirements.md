# Requirements Document

## Introduction

This document defines the requirements for the comprehensive improvement of the Matasree Store e-commerce platform. The improvements are grouped into four categories: Critical Bug Fixes (6), Feature Completion (4), Admin Improvements (4), and Growth/Infrastructure (3). Each improvement covers both backend and frontend changes end-to-end. The goal is to eliminate known defects, complete partially implemented features, strengthen admin tooling, and harden the platform's infrastructure and SEO posture.

## Glossary

- **OrderController**: The Express controller in `matasree-backend/src/controllers/orderController.ts` responsible for order lifecycle management.
- **AuthController**: The Express controller in `matasree-backend/src/controllers/authController.ts` responsible for authentication and OTP flows.
- **AdminController**: The Express controller in `matasree-backend/src/controllers/adminController.ts` responsible for admin dashboard, user management, and analytics.
- **ProductController**: The Express controller in `matasree-backend/src/controllers/productController.ts` responsible for product CRUD and image uploads.
- **CheckoutPage**: The React component at `matasree-superstore-main/src/pages/CheckoutPage.tsx` that manages the checkout flow.
- **App**: The root React component at `matasree-superstore-main/src/App.tsx` that bootstraps routing and global state.
- **ProfilePage**: The React component at `matasree-superstore-main/src/pages/ProfilePage.tsx` for user account management.
- **AdminDashboard**: The React component at `matasree-superstore-main/src/pages/AdminDashboard.tsx` for the admin analytics interface.
- **WishlistStore**: The Zustand store at `matasree-superstore-main/src/store/wishlistStore.ts` managing client-side wishlist state.
- **EmailService**: The utility module at `matasree-backend/src/utils/email.ts` responsible for sending transactional emails.
- **CloudinaryHelper**: The helper function `uploadToCloudinary` in `matasree-backend/src/config/cloudinary.ts` used to upload files to Cloudinary.
- **RedisClient**: The Redis client instance used for OTP storage and session management.
- **Order**: The Mongoose model at `matasree-backend/src/models/Order.ts` representing a customer order.
- **Product**: The Mongoose model at `matasree-backend/src/models/Product.ts` representing a product with `stock`, `sold`, `rating`, and `reviews` fields.
- **Review**: The Mongoose model at `matasree-backend/src/models/Review.ts` with `isApproved`, `rating`, and `productId` fields.
- **Coupon**: The Mongoose model at `matasree-backend/src/models/Coupon.ts` with `usageCount`, `maxUses`, and `discountType` fields.
- **Referral**: The Mongoose model at `matasree-backend/src/models/Referral.ts` linking referrer and referee users.
- **SeasonalBanner**: The Mongoose model at `matasree-backend/src/models/SeasonalBanner.ts` with `activeFrom` and `activeTo` date fields.
- **Stock Reservation**: A mechanism that decrements `Product.stock` at order creation and restores it if Razorpay payment is not completed within the hold window.
- **Hold Window**: The maximum duration a stock reservation remains in effect for a Razorpay order before automatic release; set to 15 minutes.
- **Branded Email**: An HTML transactional email using the same header, color scheme, typography, and footer as the existing order confirmation email template in `EmailService`.
- **robots.txt**: The file at `matasree-superstore-main/public/robots.txt` controlling search-engine crawl directives.
- **docker-compose.yml**: The container orchestration file at the workspace root defining MongoDB, Redis, backend, and frontend services.

---

## Requirements

### Requirement 1: Unique Order Number Generation

**User Story:** As a store operator, I want every order to have a globally unique identifier, so that concurrent order placements never produce colliding order numbers.

#### Acceptance Criteria

1. WHEN the OrderController creates a new order, THE OrderController SHALL generate the `orderNumber` using the pattern `ORD-${Date.now()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`.
2. THE Order model SHALL enforce a unique index on the `orderNumber` field so that two documents with the same value cannot exist in the database.
3. IF a database write fails with a duplicate-key error on `orderNumber`, THEN THE OrderController SHALL return HTTP 409 with a descriptive error message.

---

### Requirement 2: Eliminate Double Cart Sync at Checkout

**User Story:** As a customer, I want the checkout flow to sync my cart exactly once, so that cart quantities are not duplicated on the server when I place an order.

#### Acceptance Criteria

1. WHEN a customer advances from the address step to the payment step, THE CheckoutPage SHALL call `syncCartToBackend()` exactly once via `handleProceedToCheckout`.
2. THE CheckoutPage `handlePlaceOrder` function SHALL NOT invoke `syncCartToBackend()` before creating the order.
3. WHEN `handleProceedToCheckout` completes successfully, THE CheckoutPage SHALL advance the checkout step to 2 without performing a second cart sync.

---

### Requirement 3: Stock Availability Check and Reservation System

**User Story:** As a store operator, I want stock to be reserved at order creation and released on payment failure or timeout, so that customers cannot oversell products.

#### Acceptance Criteria

1. WHEN the OrderController receives a create-order request, THE OrderController SHALL verify that `Product.stock >= item.quantity` for every item in the cart before creating the Order document.
2. IF any item has insufficient stock at order creation time, THEN THE OrderController SHALL return HTTP 400 with a message identifying the out-of-stock product and SHALL NOT create the order or decrement any stock.
3. WHEN the OrderController creates an order with `paymentMethod` of `razorpay`, THE OrderController SHALL decrement `Product.stock` by `item.quantity` for each item immediately upon order creation, and SHALL record the reservation timestamp on the Order document.
4. WHEN a Razorpay payment verification succeeds, THE OrderController SHALL confirm the stock decrement as permanent and mark the order `paymentStatus` as `paid`.
5. WHEN a Razorpay payment is not verified within the 15-minute hold window, THE OrderController SHALL restore `Product.stock` by `item.quantity` for each reserved item and SHALL update the Order `paymentStatus` to `failed`.
6. WHEN an order is cancelled while stock is reserved, THE OrderController SHALL restore `Product.stock` by `item.quantity` for each item in the cancelled order.
7. THE stock check, decrement, and restoration operations SHALL be performed atomically using MongoDB transactions or conditional `findOneAndUpdate` with `$inc` and a stock floor of 0.

---

### Requirement 4: Cloudinary Image Upload

**User Story:** As an admin, I want product images to be stored in Cloudinary instead of the local filesystem, so that images persist across deployments and are served via CDN.

#### Acceptance Criteria

1. WHEN an admin submits a file to the product image upload endpoint, THE ProductController SHALL pass the file buffer to `CloudinaryHelper.uploadToCloudinary` and return the resulting Cloudinary URL.
2. THE ProductController `uploadImage` handler SHALL NOT write the uploaded file to the local filesystem.
3. IF `CloudinaryHelper.uploadToCloudinary` throws an error, THEN THE ProductController SHALL return HTTP 500 with an error message and SHALL NOT return a local filesystem path.
4. THE ProductController SHALL use the `multer` memory-storage middleware (not disk storage) so that no temporary files are created on the server.

---

### Requirement 5: Password Reset OTP Single-Use Enforcement

**User Story:** As a security-conscious user, I want a password reset OTP to be invalidated immediately after successful verification, so that the same OTP cannot be used a second time.

#### Acceptance Criteria

1. WHEN the AuthController verifies a password reset OTP successfully, THE AuthController SHALL call `deleteOTP(key)` on the Redis key `otp:reset:<email>` before returning the success response.
2. WHEN a caller attempts to verify the same OTP a second time after a successful verification, THE AuthController SHALL return HTTP 400 with a message stating the OTP is not found or has expired.
3. THE AuthController `resetPassword` handler SHALL independently re-verify the OTP from Redis, so that a password reset is not possible after `verifyPasswordResetOtp` has consumed the key.

---

### Requirement 6: Wishlist Sync on App Load

**User Story:** As a returning customer, I want my wishlist to be populated from the server when the app loads, so that my saved items are consistent across sessions and devices.

#### Acceptance Criteria

1. WHEN the App mounts and the user is authenticated, THE App SHALL fetch the user's wishlist from the backend API and call `WishlistStore.setItems()` with the retrieved products.
2. WHEN the App mounts and the user is not authenticated, THE App SHALL NOT fetch the wishlist from the backend.
3. WHEN the backend wishlist fetch fails, THE App SHALL silently ignore the error and retain any items already present in the local WishlistStore.
4. THE wishlist fetch SHALL execute inside a `useEffect` that depends on the authenticated user's identity, so that it re-runs when the user logs in during the same session.

---

### Requirement 7: Review Rating Auto-Recalculation

**User Story:** As a shopper, I want product ratings to reflect only approved reviews, so that unapproved or deleted reviews do not distort the displayed rating.

#### Acceptance Criteria

1. WHEN an admin approves a Review, THE ReviewController SHALL recalculate `Product.rating` as the arithmetic mean of the `rating` field across all Reviews where `productId` equals the affected product and `isApproved` equals `true`.
2. WHEN an admin approves a Review, THE ReviewController SHALL update `Product.reviews` to equal the count of Reviews where `productId` equals the affected product and `isApproved` equals `true`.
3. WHEN an admin deletes a Review, THE ReviewController SHALL recalculate `Product.rating` and `Product.reviews` using the same logic as criteria 1 and 2, considering only the remaining approved Reviews for that product.
4. WHEN there are no approved Reviews for a product after an approve or delete operation, THE ReviewController SHALL set `Product.rating` to `0` and `Product.reviews` to `0`.
5. THE recalculation SHALL be performed within the same database operation sequence as the approval or deletion to avoid inconsistent intermediate states.

---

### Requirement 8: Order Status Transactional Emails

**User Story:** As a customer, I want to receive a branded HTML email when my order is shipped, delivered, or cancelled, so that I am always informed of my order progress.

#### Acceptance Criteria

1. THE EmailService SHALL provide a `sendShippedEmail` function that accepts an order number, recipient email, estimated delivery date, and shipping address, and sends a Branded Email with subject `Order Shipped – #<orderNumber> | Matasree`.
2. THE EmailService SHALL provide a `sendDeliveredEmail` function that accepts an order number and recipient email, and sends a Branded Email with subject `Order Delivered – #<orderNumber> | Matasree`.
3. THE EmailService SHALL provide a `sendCancelledEmail` function that accepts an order number, recipient email, and total amount refunded, and sends a Branded Email with subject `Order Cancelled – #<orderNumber> | Matasree`.
4. WHEN the OrderController `updateOrderStatus` handler transitions an order to `shipped`, THE OrderController SHALL call `sendShippedEmail` with the order's details and the customer's email address.
5. WHEN the OrderController `updateOrderStatus` handler transitions an order to `delivered`, THE OrderController SHALL call `sendDeliveredEmail` with the order's details and the customer's email address.
6. WHEN the OrderController `cancelOrder` handler or `updateOrderStatus` handler transitions an order to `cancelled`, THE OrderController SHALL call `sendCancelledEmail` with the order's details and the customer's email address.
7. IF an order status email send operation fails, THEN THE OrderController SHALL log a warning and SHALL NOT fail the status update response.
8. THE three new email functions SHALL use the same HTML layout, gradient header (`linear-gradient(135deg, #ff8c00, #e65c00)`), table structure, and footer as `sendOrderConfirmationEmail` in EmailService.

---

### Requirement 9: Cascade Delete on User

**User Story:** As an admin, I want deleting a user account to remove all associated personal data, so that the platform complies with data minimisation principles and does not retain orphaned records.

#### Acceptance Criteria

1. WHEN an admin deletes a user via the AdminController `deleteUser` handler, THE AdminController SHALL delete the following documents where `userId` equals the deleted user's ID: Cart, Wishlist, Address, LoyaltyAccount, LoyaltyTransaction, and RefreshToken.
2. WHEN an admin deletes a user, THE AdminController SHALL NOT delete Order documents associated with that user so that order history is retained for business records.
3. WHEN an admin deletes a user, THE AdminController SHALL perform all cascade deletions before returning the HTTP 200 success response.
4. IF any cascade deletion step fails, THEN THE AdminController SHALL log the error, continue with the remaining deletions, and still return HTTP 200 for the user deletion, so that a partial data-cleanup failure does not block the primary operation.

---

### Requirement 10: Referral Tab on Profile Page

**User Story:** As a registered customer, I want to view my referral code and referral history on my profile page, so that I can share my code and track the status of referrals I have made.

#### Acceptance Criteria

1. THE ProfilePage SHALL render a "Referrals" section that displays the authenticated user's unique referral code with a one-click copy-to-clipboard button.
2. THE ProfilePage Referrals section SHALL display a shareable invite link in the format `https://matasreesuper.com/register?ref=<code>` with a copy-to-clipboard button.
3. THE ProfilePage Referrals section SHALL render a table listing all Referral documents where `referrerId` equals the current user's ID, with columns: referee name, date joined, and status (`pending` or `rewarded`).
4. WHEN the ProfilePage Referrals section mounts, THE ProfilePage SHALL fetch the referral list from `GET /api/referrals` and the user's referral code from the authenticated user profile.
5. IF the referral list is empty, THE ProfilePage SHALL display a message indicating that the user has not yet referred anyone.

---

### Requirement 11: Low Stock Alert Widget on Admin Dashboard

**User Story:** As an admin, I want a low-stock widget on the dashboard, so that I can identify products nearing stockout without navigating to the product list.

#### Acceptance Criteria

1. THE AdminDashboard SHALL render a "Low Stock" widget that lists every Product where `stock` is less than `10`, ordered by `stock` ascending.
2. THE "Low Stock" widget SHALL display the product name, current stock quantity, and a navigation link to the product edit page for each low-stock product.
3. WHEN the AdminDashboard mounts, THE AdminDashboard SHALL fetch the low-stock product list from the backend via a dedicated API endpoint `GET /api/admin/products/low-stock?threshold=10`.
4. THE backend `GET /api/admin/products/low-stock` endpoint SHALL accept a `threshold` query parameter (integer, default `10`) and return Products where `stock < threshold`, sorted by `stock` ascending.
5. IF no products are below the threshold, THE "Low Stock" widget SHALL display a message indicating that all products have adequate stock.

---

### Requirement 12: Coupon Analytics Table on Admin Dashboard

**User Story:** As an admin, I want a coupon analytics table on the dashboard, so that I can monitor coupon performance and redemption rates.

#### Acceptance Criteria

1. THE AdminDashboard SHALL render a "Coupon Analytics" table with columns: code, discount type, discount value, usage count / max uses, and total revenue saved.
2. WHEN the AdminDashboard mounts, THE AdminDashboard SHALL fetch coupon statistics from `GET /api/admin/coupons/analytics`.
3. THE backend `GET /api/admin/coupons/analytics` endpoint SHALL return, for each Coupon, the fields: `code`, `discountType`, `discountValue`, `usageCount`, `maxUses`, and `totalRevenueSaved` (computed as the sum of `discountAmount` across all Orders that reference the coupon code).
4. THE "Coupon Analytics" table SHALL display `maxUses` as "Unlimited" when the Coupon `maxUses` field equals `0`.
5. THE "Coupon Analytics" table SHALL display `totalRevenueSaved` formatted as a currency value in Indian Rupees.

---

### Requirement 13: Revenue Date Range Filter

**User Story:** As an admin, I want to filter the revenue analytics chart by a custom date range, so that I can analyse revenue trends for any period rather than just the last 30 days.

#### Acceptance Criteria

1. THE AdminController `getRevenueAnalytics` handler SHALL accept `startDate` and `endDate` query parameters in `YYYY-MM-DD` format and filter Order documents by `createdAt` within the inclusive range `[startDate 00:00:00 UTC, endDate 23:59:59 UTC]`.
2. WHEN `startDate` and `endDate` are not provided, THE AdminController `getRevenueAnalytics` handler SHALL default to returning data for the last 30 calendar days.
3. THE AdminDashboard revenue chart SHALL render a date range picker with two date inputs (`startDate` and `endDate`) that, when changed, re-fetch the analytics data using the selected range.
4. WHEN the user applies a date range, THE AdminDashboard SHALL call `GET /api/admin/analytics/revenue?startDate=<value>&endDate=<value>` and update the chart with the returned data.
5. IF `startDate` is after `endDate`, THEN THE AdminController SHALL return HTTP 400 with a message indicating the date range is invalid.

---

### Requirement 14: Top Selling Products Widget on Admin Dashboard

**User Story:** As an admin, I want a top-selling products widget on the dashboard, so that I can quickly identify the best-performing products by units sold and revenue.

#### Acceptance Criteria

1. THE AdminDashboard SHALL render a "Top Products" widget that lists the top 5 Products ordered by `sold` count descending.
2. THE "Top Products" widget SHALL display each product's name, total units sold (`sold` field), and revenue generated (computed as `price × sold`).
3. WHEN the AdminDashboard mounts, THE AdminDashboard SHALL fetch the top products list from `GET /api/admin/products/top-selling?limit=5`.
4. THE backend `GET /api/admin/products/top-selling` endpoint SHALL accept a `limit` query parameter (integer, default `5`, maximum `20`) and return Products sorted by `sold` descending.
5. IF no products have a `sold` count greater than `0`, THE "Top Products" widget SHALL display a message indicating that no sales data is available.

---

### Requirement 15: Server-Side Active Banner Filtering

**User Story:** As a developer, I want the banner API to support server-side filtering by active date range, so that the frontend receives only currently active banners and does not need to perform client-side date filtering.

#### Acceptance Criteria

1. WHEN `GET /api/admin/banners` is called with query parameter `activeOnly=true`, THE AdminController `getSeasonalBanners` handler SHALL return only SeasonalBanner documents where `activeFrom` is less than or equal to the current server time and `activeTo` is greater than or equal to the current server time.
2. WHEN `GET /api/admin/banners` is called without the `activeOnly` parameter, THE AdminController `getSeasonalBanners` handler SHALL return all SeasonalBanner documents as it currently does.
3. THE frontend banner consumer SHALL call `GET /api/admin/banners?activeOnly=true` to retrieve currently active banners, replacing any existing client-side date filtering logic.

---

### Requirement 16: robots.txt Admin Path Block Fix

**User Story:** As an SEO operator, I want the `/admin/` path to be correctly blocked in robots.txt so that search engine crawlers do not index admin pages.

#### Acceptance Criteria

1. THE robots.txt file SHALL contain the directive `Disallow: /admin/` with a trailing slash.
2. THE robots.txt file SHALL NOT contain the directive `Disallow: /admin` without a trailing slash, as this would incorrectly block any URL beginning with the string `/admin` such as `/administrator`.
3. THE remaining `Disallow` directives in robots.txt (`/profile`, `/orders`, `/addresses`, `/checkout`, `/cart`) SHALL be preserved without modification.

---

### Requirement 17: Docker Compose MongoDB Password Parameterisation

**User Story:** As a DevOps engineer, I want the MongoDB password in docker-compose.yml to be sourced from an environment variable with a fallback default, so that production deployments can inject a secure password without modifying the file.

#### Acceptance Criteria

1. THE docker-compose.yml `mongodb` service `MONGO_INITDB_ROOT_PASSWORD` environment variable SHALL be set to `${MONGO_PASSWORD:-secure_password}` so that the value is read from the host environment variable `MONGO_PASSWORD` when present, and falls back to `secure_password` when absent.
2. THE docker-compose.yml `backend` service `MONGODB_URI` environment variable SHALL be updated to `mongodb://admin:${MONGO_PASSWORD:-secure_password}@mongodb:27017/matasree?authSource=admin` so that the URI uses the same parameterised password as the MongoDB service.
3. THE docker-compose.yml SHALL NOT contain any hardcoded password string `secure_password` outside of the fallback default syntax `${MONGO_PASSWORD:-secure_password}`.
