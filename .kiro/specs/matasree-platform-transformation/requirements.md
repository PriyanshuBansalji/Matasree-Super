# Requirements Document

## Introduction

Matasree Super Masale is a premium Indian spices e-commerce platform built on React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Framer Motion (frontend) and Node.js + Express + TypeScript + MongoDB (backend). The platform currently has 25 pages, 11 data models, JWT + OAuth authentication, cart, checkout with Razorpay, coupon system, wishlist store, order management, admin dashboard, a Review model, partnership form, and email notifications.

This document defines the requirements for the **Matasree Platform Transformation** — a comprehensive upgrade across eight areas: customer experience, conversion optimization, brand building, UI/UX, performance, SEO, security, and codebase quality. All requirements are scoped to the existing tech stack. New backend models or fields are introduced only where the existing schema is insufficient.

---

## Glossary

- **Platform**: The full-stack Matasree Super Masale application (frontend + backend).
- **Search_Service**: The backend endpoint and frontend component responsible for full-text product search with autocomplete suggestions.
- **Filter_Panel**: The frontend component that applies multi-dimensional product filters (price, category, weight, rating, stock).
- **Wishlist_API**: The new backend REST API that persists user wishlists to MongoDB (supplements the existing Zustand client-side store).
- **Recently_Viewed_Service**: The service that tracks and returns the last N products a user has viewed.
- **Comparison_Tool**: The frontend component enabling side-by-side comparison of up to four products.
- **Quick_View**: The modal component that displays a product summary without navigating away from the listing page.
- **Review_System**: The wired-up combination of the existing Review model and Product model to display and accept product-specific reviews.
- **Loyalty_Engine**: The backend service managing loyalty points accrual, redemption, and balance for each customer.
- **Referral_Engine**: The backend service managing refer-and-earn codes, reward payouts, and referred-user tracking.
- **Coupon_Engine**: The enhanced coupon validation and application service, including multi-use and stacking rules.
- **Cart_Sync**: The pre-checkout operation that reconciles the client-side cart state with the backend Cart document.
- **Abandonment_Flow**: The scheduled email sequence sent to users who have items in their cart but have not completed checkout within a configurable period.
- **SEO_Layer**: The combination of react-helmet-async meta tags, Open Graph tags, JSON-LD structured data, sitemap.xml, and robots.txt.
- **Order_Timeline**: The visual frontend component showing the status progression of an order (pending → confirmed → shipped → delivered).
- **Admin**: A user with `role: 'admin'` in the User model.
- **Customer**: A user with `role: 'customer'` in the User model.
- **JWT_Secret**: The value of the `JWT_SECRET` environment variable used to sign access tokens.
- **OAuth_Callback**: The server-side handler (`oauthCallback` in authController.ts) that redirects to the frontend after OAuth login.
- **Cancel_Order_Route**: The missing `DELETE /api/orders/:id` or `PUT /api/orders/:id/cancel` backend route that allows a customer to cancel a pending order.
- **Validation_Library**: The single server-side input-validation library chosen to replace the current mixture of Joi, Zod, and express-validator.
- **Spice_Guide**: An interactive frontend page teaching users about spice origins, uses, and pairings.
- **Skeleton_Loader**: A placeholder UI element that mimics the layout of content while it is loading.
- **ARIA**: Accessible Rich Internet Applications attributes used to improve screen-reader and keyboard accessibility.

---

## Requirements

---

### Requirement 1: Smart Product Search with Suggestions

**User Story:** As a customer, I want to search for products by name, tag, or keyword and see instant suggestions, so that I can find what I want without browsing every category.

#### Acceptance Criteria

1. WHEN a customer types at least 2 characters into the search input, THE Search_Service SHALL return at most 10 matching product suggestions within 300 ms.
2. THE Search_Service SHALL match against product name, description, and tags such that a query matching exactly one product returns that product as the top suggestion.
3. WHEN the customer selects a suggestion that matches exactly one product, THE Platform SHALL navigate to that product's detail page; WHEN the suggestion matches multiple products, THE Platform SHALL navigate to the filtered results page — both within 200 ms of selection.
4. IF the search query returns zero results, THEN THE Search_Service SHALL return an empty array and THE Platform SHALL display a "No products found" empty state with a suggestion to browse categories.
5. WHEN a customer submits a full search query, THE Platform SHALL display a paginated results page (10 products per page) with a total count displayed above the results.
6. THE Search_Service SHALL accept a `q` query parameter of maximum 200 characters; IF the parameter exceeds 200 characters, THEN THE Search_Service SHALL return HTTP 400.
7. IF the Search_Service is unavailable (e.g., database error), THEN THE Platform SHALL display an error message "Search is temporarily unavailable" and not crash the page.

---

### Requirement 2: Advanced Product Filtering

**User Story:** As a customer, I want to filter products by price range, category, weight, rating, and stock availability, so that I can narrow results to products that match my needs.

#### Acceptance Criteria

1. THE Filter_Panel SHALL support simultaneous filtering by: price range (0–99,999 INR), category (up to 20 categories, multi-select), weight (100g, 250g, 500g, 1kg, 2kg), minimum rating (integer 1–5 where the filter returns products with rating ≥ the selected value), and in-stock only toggle (returns only products where `stock > 0`).
2. WHEN a customer applies one or more filters, THE Platform SHALL update the product list without a full page reload within 500 ms.
3. WHEN the customer clears all filters, THE Platform SHALL restore the default unfiltered product list sorted by `createdAt` descending.
4. IF no products match the applied filters, THEN THE Filter_Panel SHALL display a "No products match your filters" empty state with a "Clear filters" action.
5. THE Platform SHALL reflect active filters in the URL query string using parameters `minPrice`, `maxPrice`, `category`, `weight`, `minRating`, and `inStock` so that filtered results can be bookmarked and shared.
6. WHILE a filtered request is in flight (from the moment the request is dispatched to when the response is received), THE Platform SHALL display skeleton loaders in place of product cards.
7. THE backend `GET /api/products` endpoint SHALL accept and apply all filter parameters: `minPrice`, `maxPrice`, `category`, `weight`, `minRating`, and `inStock`; WHERE a parameter is absent, THE endpoint SHALL not apply that filter.

---

### Requirement 3: Wishlist Backend API

**User Story:** As a logged-in customer, I want my wishlist to be saved to the server, so that I can access it from any device and it persists across sessions.

#### Acceptance Criteria

1. THE Wishlist_API SHALL expose the following endpoints, each protected by `verifyToken`: `GET /api/wishlist`, `POST /api/wishlist/:productId`, `DELETE /api/wishlist/:productId`.
2. WHEN a logged-in customer sends `POST /api/wishlist/:productId` with a valid MongoDB ObjectId, THE Wishlist_API SHALL store the product reference in the user's server-side wishlist and return HTTP 201; IF the `:productId` is not a valid ObjectId format, THEN THE Wishlist_API SHALL return HTTP 400.
3. IF the customer attempts to add a product that is already in their wishlist, THEN THE Wishlist_API SHALL return HTTP 409 with the message "Product is already in your wishlist."
4. WHEN a customer sends `DELETE /api/wishlist/:productId`, THE Wishlist_API SHALL remove the product reference and return HTTP 200; IF the product is not in the wishlist, THE Wishlist_API SHALL return HTTP 404.
5. WHEN a customer retrieves `GET /api/wishlist`, THE Wishlist_API SHALL return the full list of wishlist items with populated `name`, `price`, `image`, and `stock` fields, capped at a maximum of 100 items.
6. IF a product referenced in the wishlist has been deleted from the catalog, THEN THE Wishlist_API SHALL omit that product from the response body and remove the stale reference from the wishlist document in the same request.
7. IF an unauthenticated request is made to any Wishlist_API endpoint, THEN THE Wishlist_API SHALL return HTTP 401.

---

### Requirement 4: Recently Viewed Products

**User Story:** As a customer, I want to see the last several products I viewed, so that I can easily return to items I was considering.

#### Acceptance Criteria

1. WHEN a customer views a product detail page, THE Recently_Viewed_Service SHALL record the product ID with the current timestamp, maintaining a sliding window of the 10 most recently viewed unique products (removing the oldest entry when the limit is exceeded and the new product is not already present).
2. THE Platform SHALL display the recently viewed products section on the homepage and the product detail page, showing up to 10 product cards ordered by most-recently-viewed first.
3. WHEN a customer is not logged in, THE Platform SHALL persist recently viewed products in `localStorage` under the key `matasree-recently-viewed` and display up to 10 entries.
4. WHEN a logged-in customer views a product, THE Platform SHALL merge the localStorage list with their server-side recently viewed list, deduplicating by product ID and keeping the most recent timestamp per product, with the merged list capped at 10 entries ordered by timestamp descending.
5. IF a product in the recently viewed list has been deleted from the catalog, THEN THE Recently_Viewed_Service SHALL omit that product from the display without surfacing an error.

---

### Requirement 5: Product Comparison Tool

**User Story:** As a customer, I want to compare up to four products side-by-side, so that I can make an informed purchase decision.

#### Acceptance Criteria

1. THE Comparison_Tool SHALL allow a customer to add up to 4 products to a comparison tray from any product card or product detail page.
2. IF a customer attempts to add a fifth product to the comparison tray, THEN THE Comparison_Tool SHALL display a message stating "You can compare up to 4 products at a time."
3. WHEN the customer opens the comparison view, THE Comparison_Tool SHALL display product attributes side-by-side including: name, price, rating, weight, category, stock status, and description.
4. WHEN a customer removes a product from the comparison tray, THE Comparison_Tool SHALL update the comparison view immediately without page reload.
5. THE Comparison_Tool SHALL persist the comparison tray contents in component state for the duration of the browser session.

---

### Requirement 6: Quick View Modal

**User Story:** As a customer, I want to preview a product's key details in a modal without leaving the listing page, so that I can decide whether to view the full details or add it to my cart quickly.

#### Acceptance Criteria

1. WHEN a customer activates the "Quick View" action on a product card, THE Quick_View SHALL open a modal displaying: product images, name, price, rating, weight options, short description, stock status, and Add-to-Cart button.
2. WHEN the customer clicks Add-to-Cart inside the Quick_View, THE Platform SHALL add the product to the cart and close the modal upon success.
3. WHEN the customer dismisses the Quick_View modal, THE Platform SHALL restore focus to the triggering product card (ARIA focus management).
4. THE Quick_View SHALL be keyboard accessible and include a visible close button with `aria-label="Close quick view"`.
5. WHILE the Quick_View data is loading, THE Quick_View SHALL display a skeleton loader.

---

### Requirement 7: Related Products and Frequently Bought Together

**User Story:** As a customer, I want to see related products and common product pairings on the product detail page, so that I discover complementary items and increase the value of my order.

#### Acceptance Criteria

1. THE Platform SHALL display a "Related Products" section on each product detail page containing up to 8 products from the same category, excluding the current product.
2. THE Platform SHALL display a "Frequently Bought Together" section on each product detail page containing up to 3 products that are commonly ordered alongside the current product.
3. WHEN the backend does not have sufficient co-purchase data for "Frequently Bought Together", THE Platform SHALL fall back to displaying top-selling products from the same category.
4. WHEN a customer adds a related or frequently bought together product to the cart from the product detail page, THE Platform SHALL update the cart count in the header.
5. THE Platform SHALL lazy-load the Related Products and Frequently Bought Together sections after the main product content has rendered.

---

### Requirement 8: Ratings and Reviews (Wired to Product)

**User Story:** As a customer, I want to read and submit reviews for a specific product, so that I can make informed purchases and share my experience with other buyers.

#### Acceptance Criteria

1. THE Review_System SHALL associate each Review document with a specific Product via the existing `productId` field on the Review model.
2. WHEN a customer submits a review for a product, THE Review_System SHALL require: a rating (integer 1–5), a review comment (10–1000 characters), and the customer's name; the `userId` SHALL be set from the authenticated session.
3. IF a customer who has not purchased the product attempts to submit a review, THEN THE Review_System SHALL return HTTP 403 with the message "You must purchase this product before reviewing it."
4. WHEN a review is submitted, THE Review_System SHALL set `isApproved: false` by default and notify the Admin via email.
5. WHEN an Admin approves a review, THE Review_System SHALL set `isApproved: true` and THE Platform SHALL recompute the product's `rating` field as the arithmetic mean of all approved ratings for that product, rounded to one decimal place.
6. THE Platform SHALL display approved reviews on the product detail page, sorted by `createdAt` descending, with pagination of 10 reviews per page.
7. THE Review_System SHALL prevent a customer from submitting more than one review per product; IF a duplicate review submission is detected, THEN THE Review_System SHALL return HTTP 409.
8. WHERE a product has no approved reviews, THE Platform SHALL display a "Be the first to review this product" prompt.

---

### Requirement 9: Testimonials and Recipe Section

**User Story:** As a visitor, I want to read customer testimonials and recipes that use Matasree spices, so that I feel confident in the brand and discover new ways to use the products.

#### Acceptance Criteria

1. THE Platform SHALL display a Testimonials section on the homepage that shows reviews where `isFeatured: true` from the Review model.
2. THE Platform SHALL include a dedicated Recipes page listing recipes that reference Matasree products, with each recipe containing: title, ingredients list, step-by-step instructions, and associated product tags.
3. WHEN a visitor filters recipes by a product tag, THE Platform SHALL display only recipes that include that tag.
4. THE Platform SHALL display seasonal banners on the homepage that are configurable by an Admin; each banner SHALL include: image, title, subtitle, call-to-action link, and an active date range.
5. WHEN the current date is outside a banner's active date range, THE Platform SHALL not display that banner.

---

### Requirement 10: Loyalty Rewards Points

**User Story:** As a customer, I want to earn loyalty points on purchases and redeem them for discounts, so that I am incentivised to return and buy more.

#### Acceptance Criteria

1. THE Loyalty_Engine SHALL award 1 loyalty point for every ₹10 spent (rounded down) when an order's `paymentStatus` transitions to `paid` or when a COD order's `orderstatus` transitions to `delivered`.
2. WHEN a customer redeems loyalty points at checkout, THE Loyalty_Engine SHALL apply a discount of ₹0.50 per point redeemed, subject to a maximum redemption of 50% of the order's subtotal.
3. IF a customer attempts to redeem more points than their current balance, THEN THE Loyalty_Engine SHALL return HTTP 400 with the message "Insufficient loyalty points."
4. THE Platform SHALL display the customer's current loyalty point balance on their profile page and during checkout.
5. WHEN an order is cancelled, THE Loyalty_Engine SHALL reverse the points awarded for that order.
6. THE Loyalty_Engine SHALL record each points transaction (earn or redeem) with: userId, orderId, points delta, reason, and timestamp.

---

### Requirement 11: Refer and Earn

**User Story:** As a customer, I want to refer friends to Matasree and earn a reward when they make their first purchase, so that I benefit from introducing the brand to others.

#### Acceptance Criteria

1. THE Referral_Engine SHALL generate a unique referral code for each registered customer upon account creation.
2. WHEN a new customer registers using a referral code, THE Referral_Engine SHALL record the referral relationship linking the new customer to the referrer.
3. WHEN the referred customer completes their first paid order, THE Referral_Engine SHALL credit the referrer with 50 loyalty points and send an email notification to the referrer.
4. IF a referral code used during registration does not match any existing customer, THEN THE Referral_Engine SHALL return HTTP 400 with the message "Invalid referral code."
5. THE Platform SHALL display the customer's referral code and referral history (referee name, status, reward earned) on their profile page.
6. THE Referral_Engine SHALL reject self-referral; IF a customer attempts to use their own referral code, THEN THE Referral_Engine SHALL return HTTP 400.

---

### Requirement 12: Coupon Engine Improvements

**User Story:** As an Admin, I want to create and manage coupons with multi-use limits, category restrictions, and expiry rules, so that I can run targeted promotions without manual intervention.

#### Acceptance Criteria

1. THE Coupon_Engine SHALL validate a coupon code by checking: existence, expiry (`expiresAt`), usage count against `maxUses`, and whether the order meets `minOrderAmount`.
2. WHEN `maxUses` is greater than 0, THE Coupon_Engine SHALL track the number of times a coupon has been redeemed and reject redemption when the count reaches `maxUses`, returning HTTP 400.
3. THE Coupon_Engine SHALL support category-level restrictions: WHERE a coupon specifies a category restriction, THE Coupon_Engine SHALL apply the discount only to items in those categories.
4. THE Platform SHALL persist the applied coupon code and the resulting `discountAmount` on the Order document at the time of order creation.
5. WHEN a coupon is applied at checkout, THE Platform SHALL display the discount amount and the resulting total before the customer confirms the order.
6. IF a coupon code is invalid for any reason, THEN THE Coupon_Engine SHALL return a descriptive HTTP 400 error message specifying the reason (expired, max uses reached, minimum order not met, invalid code).

---

### Requirement 13: Sticky Add-to-Cart and Conversion UI Elements

**User Story:** As a customer browsing a product detail page, I want persistent access to the Add-to-Cart button and clear urgency indicators, so that I can act quickly without scrolling.

#### Acceptance Criteria

1. THE Platform SHALL render a sticky bottom bar on the product detail page that becomes visible WHEN the primary Add-to-Cart button scrolls out of the viewport, containing: product name (truncated to 30 characters with ellipsis if longer), the current price (synced to the same price displayed in the main section), and an Add-to-Cart button.
2. WHEN a product's `stock` field is between 1 and 9 inclusive, THE Platform SHALL display a low-stock indicator reading "Only [N] left in stock!" adjacent to the Add-to-Cart button on both the product card and product detail page.
3. THE Platform SHALL display four trust badges — "Secure Payment", "Free Delivery on orders ₹499+", "100% Natural Quality", "Easy 7-Day Returns" — in a dedicated row below the Add-to-Cart button on the product detail page, and in the order summary section of the checkout page.
4. WHEN a product's `sold` field is available and greater than 0, THE Platform SHALL display a social proof notification on the product detail page in the format "[N] people bought this in the last 30 days", where N is the `sold` field value.
5. WHEN a customer's pointer moves toward the top edge of the browser window while on the checkout page with a non-empty cart and the order has not been placed, THE Platform SHALL display an exit-intent offer modal exactly once per browser session; the modal SHALL contain a discount code valid for 30 minutes.

---

### Requirement 14: Cart Abandonment Email Flow

**User Story:** As the store owner, I want to automatically email customers who abandon their cart, so that I can recover lost revenue.

#### Acceptance Criteria

1. THE Abandonment_Flow SHALL identify a logged-in customer's cart as abandoned WHEN it contains at least one item and the `updatedAt` timestamp on the Cart document has not changed within the configured abandonment window (default 2 hours, configurable by Admin between 1 and 24 hours inclusive).
2. WHEN a cart is identified as abandoned, THE Abandonment_Flow SHALL send one reminder email to the customer's registered email address containing: a list of abandoned cart items (name, image URL, price, quantity), a deep link directly to the checkout page, and the optional discount code if configured by Admin.
3. THE Abandonment_Flow SHALL set an `abandonmentEmailSentAt` timestamp on the Cart document after sending the email, and SHALL NOT send a second email for the same abandonment event (same cart items unchanged since first email).
4. IF the customer completes a purchase (order created and cart cleared) or manually empties their cart before the abandonment job triggers, THEN THE Abandonment_Flow SHALL cancel the pending email job without sending.
5. THE Admin dashboard SHALL include a configuration panel allowing Admins to set the abandonment window (1–24 hours) and an optional discount coupon code to include in the email.

---

### Requirement 15: WhatsApp Ordering

**User Story:** As a customer, I want to place or enquire about an order via WhatsApp, so that I can communicate in a familiar channel without using the checkout flow.

#### Acceptance Criteria

1. THE Platform SHALL display an "Order via WhatsApp" button on the product detail page and in the cart drawer/page.
2. WHEN a customer clicks "Order via WhatsApp" on a product detail page, THE Platform SHALL open `https://wa.me/{WHATSAPP_NUMBER}?text={encodedMessage}` in a new tab, where `{encodedMessage}` is a URL-encoded string in the format: "Hi, I'd like to order: [Product Name] x[Qty] — ₹[Price]. Please confirm availability."
3. WHEN a customer clicks "Order via WhatsApp" from the cart page, THE Platform SHALL construct the message to include all cart items in the format: "Hi, I'd like to order:\n- [Product 1] x[Qty] — ₹[Price]\n- [Product 2]...\nTotal: ₹[Total]".
4. THE Platform SHALL display the WhatsApp button only WHEN `VITE_WHATSAPP_NUMBER` is set in the frontend environment; IF the variable is absent, THE Platform SHALL hide the button without error.
5. THE Platform SHALL display a WhatsApp floating action button (fixed position, bottom-right) on all pages for mobile viewports (< 768 px), linking to `https://wa.me/{WHATSAPP_NUMBER}` with the message "Hi, I need help with my order."

---

### Requirement 16: Enhanced About Page and Brand Content

**User Story:** As a visitor, I want to learn about Matasree's brand story, manufacturing process, and quality standards, so that I trust the brand before purchasing.

#### Acceptance Criteria

1. THE Platform SHALL render an About page that includes: brand story section, manufacturing process section, quality assurance section, "Why Choose Us" section, and customer success stories section.
2. THE Platform SHALL render an interactive Spice_Guide page where visitors can browse spices by region, flavor profile, and culinary use, with each spice linking to associated products.
3. THE Platform SHALL display a regional recipes section on the Recipes page grouping recipes by Indian regional cuisine (e.g., North Indian, South Indian, Bengali, Rajasthani).
4. THE "Why Choose Us" section SHALL include at least four value propositions with icons and supporting copy.
5. THE Platform SHALL include ARIA landmark roles (`main`, `nav`, `aside`, `footer`) on all content pages for screen-reader navigation.

---

### Requirement 17: Homepage Redesign

**User Story:** As a visitor, I want a visually compelling and fast homepage that highlights featured products, seasonal offers, and brand values, so that I immediately understand what Matasree offers.

#### Acceptance Criteria

1. THE Platform SHALL redesign the homepage to include the following sections in order: hero banner with call-to-action, featured categories section, bestseller products section, one seasonal banner slot (visible only when an active banner exists), testimonials section, and newsletter signup.
2. THE Platform SHALL implement page transition animations using Framer Motion on route changes with a total animation duration not exceeding 400 ms.
3. THE Platform SHALL implement scroll-triggered animations for homepage sections using Framer Motion's `whileInView` prop, triggering WHEN a section has entered 20% of the viewport.
4. WHEN the homepage API data is loading, THE Platform SHALL display skeleton loaders for the featured products section (8 product card skeletons) and the testimonials section (3 testimonial skeletons).
5. THE Platform SHALL render the homepage such that the Largest Contentful Paint (LCP) element loads within 2.5 seconds on a Lighthouse simulated 4G throttled network audit.

---

### Requirement 18: Improved Product Cards and Product Detail Page

**User Story:** As a customer, I want product cards and detail pages that clearly present key information and allow smooth interactions, so that I can evaluate and purchase products with confidence.

#### Acceptance Criteria

1. THE Platform SHALL display on each product card: product image, name, price (with `originalPrice` struck through when `originalPrice > price`), star rating (filled/empty stars), weight, stock status badge ("In Stock" / "Low Stock" when `stock ≤ 10` / "Out of Stock" when `stock = 0`), wishlist toggle icon, and a "Quick View" trigger button.
2. THE Platform SHALL implement micro-interactions on product cards: image zoom to `scale(1.1)` on hover (CSS transform, 200ms transition), animated heart fill on wishlist toggle, and Add-to-Cart button showing a loading spinner then a checkmark for a minimum of 1,500 ms before reverting to default state.
3. THE Platform SHALL display a product image gallery on the product detail page with 1–8 images, supporting thumbnail navigation; the primary `image` field is displayed by default and clicking a thumbnail updates the main image display.
4. THE Platform SHALL display on the product detail page: name, price, discount badge (showing percentage off when `originalPrice > price`), star rating with review count, weight selector (one button per value in the `weight` enum), stock indicator, description, Add-to-Cart button, Add-to-Wishlist button, and a native Share button using the Web Share API with clipboard fallback.
5. THE Platform SHALL render an order tracking timeline on the order detail page listing the statuses: pending → confirmed → shipped → delivered → cancelled; the customer's current status SHALL be visually distinguished from inactive statuses using a distinct colour and icon fill.

---

### Requirement 19: Mobile Navigation

**User Story:** As a customer using a mobile device, I want a navigation menu that is easy to open, navigate, and close, so that I can access all sections of the site comfortably on a small screen.

#### Acceptance Criteria

1. WHILE the viewport width is less than 768 px, THE Platform SHALL display a hamburger menu button in the header that opens a slide-in drawer navigation containing: logo, main navigation links, category links, wishlist link, cart link, and account link.
2. WHEN the mobile navigation drawer is open, THE Platform SHALL trap keyboard focus within the drawer (no Tab key escape) and apply `overflow: hidden` to the `<body>` to prevent background scrolling.
3. WHEN the customer taps outside the drawer overlay or presses the Escape key, THE Platform SHALL close the drawer; the close animation SHALL complete within 300 ms.
4. THE Platform SHALL render a close button inside the drawer with `aria-label="Close navigation menu"`.
5. WHILE the viewport width is less than 768 px, THE Platform SHALL display a bottom navigation bar with icons and labels for: Home, Products, Cart (with item count badge visible only when item count > 0), and Account.

---

### Requirement 20: Accessibility (ARIA and Keyboard Navigation)

**User Story:** As a user who relies on keyboard navigation or a screen reader, I want all interactive elements to be operable and properly labelled, so that I can use the platform independently.

#### Acceptance Criteria

1. THE Platform SHALL ensure all interactive elements (buttons, links, form inputs) have a discernible accessible name via `aria-label`, `aria-labelledby`, or visible text content.
2. THE Platform SHALL ensure all images that convey information have non-empty `alt` attributes; decorative images SHALL have `alt=""`.
3. THE Platform SHALL maintain a visible focus indicator on all focusable elements; the indicator SHALL have a minimum contrast ratio of 3:1 against adjacent colours and a minimum outline width of 2 px with at least 2 px offset.
4. THE Platform SHALL ensure all form error messages are associated with their input field via `aria-describedby`.
5. THE Platform SHALL ensure modal dialogs have `role="dialog"` and `aria-modal="true"`, trap Tab focus within the modal while open, and return focus to the element that triggered the modal on close.
6. THE Platform SHALL target a WCAG 2.1 Level AA conformance baseline across all pages (note: full validation requires manual testing with assistive technologies and expert accessibility review).

---

### Requirement 21: Empty States

**User Story:** As a customer, I want clear feedback when a list or section has no content, so that I understand the situation and know what action to take.

#### Acceptance Criteria

1. THE Platform SHALL display a meaningful empty state for each of the following scenarios: empty cart, empty wishlist, no search results, no orders, and no reviews.
2. THE Platform SHALL ensure each empty state includes: an illustrative icon or image (minimum 64×64 px), a descriptive message specific to that scenario, and a call-to-action button — empty cart: "Browse Products"; empty wishlist: "Start Shopping"; no search results: "Browse All Products"; no orders: "Shop Now"; no reviews: "Be the First to Review".
3. THE Platform SHALL apply a consistent visual layout to all empty states: icon centred above message, message in `text-muted-foreground` style, CTA button using the primary button style.

---

### Requirement 22: Image Lazy Loading

**User Story:** As a customer on a slow connection, I want product images to load only as I scroll to them, so that the page becomes interactive faster.

#### Acceptance Criteria

1. THE Platform SHALL apply `loading="lazy"` to all `<img>` elements rendering product images that are not within the initial viewport on page load.
2. THE Platform SHALL apply `loading="eager"` to hero banner images and the first product image on the homepage that falls within the initial viewport.
3. WHILE a lazy-loaded image has not yet been fetched, THE Platform SHALL display a placeholder (skeleton or low-res data URI) that matches the declared aspect ratio of the image container.
4. THE Platform SHALL set explicit `width` and `height` attributes (or a CSS `aspect-ratio` property) on all product `<img>` elements such that the Cumulative Layout Shift (CLS) score contribution from product images is less than 0.1.

---

### Requirement 23: Missing Database Indexes

**User Story:** As the backend operator, I want critical query fields to be indexed in MongoDB, so that common queries execute efficiently as data volume grows.

#### Acceptance Criteria

1. THE Platform SHALL add a compound index `{ userId: 1, createdAt: -1 }` to the Order collection to support the "my orders" query sorted by date.
2. THE Platform SHALL add a single-field index `{ orderstatus: 1 }` to the Order collection to support admin order filtering by status.
3. THE Platform SHALL add a single-field index `{ userId: 1 }` to the Address collection to support address lookup by user.
4. THE Platform SHALL add a single-field index `{ orderId: 1 }` to the Payment collection to support payment lookup by order.
5. THE Platform SHALL add a compound index `{ userId: 1, status: 1 }` to the Payment collection to support user payment history queries.
6. WHEN the server starts and connects to MongoDB, THE Platform SHALL create the indexes in criteria 1–5 using `createIndex` with `background: true` (or the Mongoose equivalent `{ background: true }`); THE Platform SHALL NOT drop or replace any pre-existing indexes on those collections.
7. IF a `createIndex` call fails (e.g., conflicting index definition), THEN THE Platform SHALL log the error with the index name and collection and continue server startup rather than crashing.

---

### Requirement 24: Batch Cart Sync Before Checkout

**User Story:** As a customer proceeding to checkout, I want the cart to be synced with the server before payment begins, so that I am not charged for out-of-stock or price-changed items.

#### Acceptance Criteria

1. WHEN a customer initiates the checkout flow, THE Cart_Sync SHALL send the complete client-side cart (all item IDs and quantities) to a `POST /api/cart/sync` endpoint and receive a validated response before rendering the checkout address step.
2. WHEN THE Cart_Sync response indicates a price change for any cart item (backend price differs from the client-stored price), THE Platform SHALL update the displayed prices in the cart and display a blocking notification listing the changed items before allowing the customer to proceed to address selection.
3. WHEN THE Cart_Sync response indicates a cart item is out of stock, THE Platform SHALL remove that item from the client cart, display a notification listing the removed items, and prevent checkout progression until the customer acknowledges the removal.
4. IF Cart_Sync fails due to a network error or non-2xx response, THEN THE Platform SHALL display the error message "Unable to verify cart. Please try again." and retain all cart items locally; THE Platform SHALL NOT navigate to the payment step.
5. WHILE Cart_Sync is in progress, THE Platform SHALL display a loading indicator on the "Proceed to Checkout" button; IF the sync takes longer than 3 seconds, THE Platform SHALL display a "Verifying your cart…" overlay message.

---

### Requirement 25: Bundle Analysis

**User Story:** As a developer, I want to measure and reduce the JavaScript bundle size, so that the application loads faster for end users.

#### Acceptance Criteria

1. THE Platform SHALL add `rollup-plugin-visualizer` to `vite.config.ts` as a build plugin that generates `dist/bundle-analysis.html` on every production build.
2. THE Platform SHALL configure Vite's `build.rollupOptions.output.manualChunks` so that no single initial JS chunk delivered to the browser exceeds 250 KB gzipped.
3. THE Platform SHALL import all shadcn/ui components and Framer Motion exports individually (e.g., `import { motion } from 'framer-motion'` rather than `import * as FM from 'framer-motion'`) to enable tree-shaking.
4. WHEN the `npm run build` script completes, THE Platform SHALL output `dist/bundle-analysis.html`; IF the file is absent after a successful build, the CI check SHALL fail with exit code 1.

---

### Requirement 26: SEO — Per-Page Meta Tags

**User Story:** As the store owner, I want each page to have accurate meta tags, so that search engines index the right content and social shares display correctly.

#### Acceptance Criteria

1. THE SEO_Layer SHALL use `react-helmet-async` to set a page-instance-specific `<title>` (e.g., "Chilli Powder 500g | Matasree Super Masale" for a product page) and `<meta name="description">` for: homepage, product listing, product detail, category, about, recipes, contact, cart, and account pages.
2. THE SEO_Layer SHALL include Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`) on all public-facing pages.
3. WHEN the product detail page renders, THE SEO_Layer SHALL set `og:image` to the absolute URL of the product's primary `image` field.
4. THE SEO_Layer SHALL set a `<link rel="canonical" href="{absolute_url}">` tag on every page to prevent duplicate-content indexing.
5. THE SEO_Layer SHALL set `<meta name="robots" content="noindex, nofollow">` on login, register, forgot-password, checkout, cart, and all `/profile`, `/orders`, `/addresses`, `/admin/*` pages.

---

### Requirement 27: JSON-LD Structured Data

**User Story:** As the store owner, I want structured data embedded in product and company pages, so that search engines can generate rich snippets.

#### Acceptance Criteria

1. THE SEO_Layer SHALL inject a `Product` JSON-LD schema on every product detail page containing: `name`, `image`, `description`, `sku` (the `_id` string), `offers.price`, `offers.priceCurrency: "INR"`, `offers.availability` (`"https://schema.org/InStock"` when `stock > 0`, `"https://schema.org/OutOfStock"` otherwise); WHEN `reviews > 0`, THE SEO_Layer SHALL additionally include `aggregateRating` with `ratingValue` and `reviewCount`.
2. THE SEO_Layer SHALL inject an `Organization` JSON-LD schema on the homepage and About page containing: `name: "Matasree Super Masale"`, `url`, `logo`, `contactPoint` (phone/email from config), and `sameAs` (array of social media URLs from config).
3. THE SEO_Layer SHALL inject a `BreadcrumbList` JSON-LD schema on product detail and category pages reflecting: `Home (/)` → `Category (/categories?id={id})` → `Product (/product/{id})`.
4. THE SEO_Layer SHALL inject a `LocalBusiness` JSON-LD schema on the About and Contact pages containing: business name, address, telephone, and `openingHours` from a configurable data source.
5. THE JSON-LD schema objects SHALL be rendered inside `<script type="application/ld+json">` tags injected via `react-helmet-async`.

---

### Requirement 28: Sitemap and robots.txt

**User Story:** As the store owner, I want a sitemap.xml and robots.txt file, so that search engine crawlers can discover and index pages efficiently.

#### Acceptance Criteria

1. THE Platform SHALL include a script at `matasree-backend/src/scripts/generateSitemap.ts` that connects to MongoDB and queries all products and categories where `active` (or equivalent) is not `false`, then writes a valid `sitemap.xml` to `matasree-superstore-main/public/sitemap.xml`.
2. THE sitemap.xml SHALL include entries for: homepage (`/`), product listing (`/products`), each product detail page (`/product/{_id}`, `<lastmod>` from `updatedAt`), each category page, About (`/about`), Recipes (`/recipes`), and Contact (`/contact`); each entry SHALL include `<loc>` (absolute URL), `<lastmod>` (ISO 8601 date from `updatedAt`), `<changefreq>` (`weekly` for products, `monthly` for static pages), and `<priority>` (1.0 for homepage, 0.8 for products, 0.6 for static pages).
3. THE Platform SHALL include a `robots.txt` in `matasree-superstore-main/public/robots.txt` that allows all crawlers (`User-agent: *`), disallows `/admin`, `/profile`, `/orders`, `/addresses`, `/checkout`, `/cart`, and includes `Sitemap: {FRONTEND_URL}/sitemap.xml` as an absolute URL.
4. THE sitemap generation script SHALL be invocable via `npm run generate:sitemap` in `matasree-backend/package.json`.
5. IF the script encounters a MongoDB connection error, THEN THE script SHALL print a descriptive error message to `stderr` and exit with code 1.

---

### Requirement 29: Security — OAuth Token Delivery

**User Story:** As a security-conscious developer, I want the OAuth access token to be delivered without appearing in the browser URL, so that the token is not leaked via browser history, server logs, or referrer headers.

#### Acceptance Criteria

1. THE OAuth_Callback SHALL NOT include the access token as a query parameter in the redirect URL sent to the browser.
2. THE OAuth_Callback SHALL redirect to a dedicated frontend callback page (`/auth/callback`) and store the access token and user payload in `sessionStorage` on that page; the callback page SHALL then transfer the token to the Zustand auth store and clear `sessionStorage`, and redirect the user to the post-login destination.
3. WHEN the frontend auth store receives the token from `sessionStorage` on the callback page, THE Platform SHALL validate that the calling page's origin matches `VITE_API_BASE_URL` before consuming the token.
4. WHEN the OAuth flow completes, THE Platform SHALL store the access token only in the Zustand in-memory store; the token SHALL NOT be written to `localStorage`.
5. IF the `sessionStorage` entry is absent or malformed on the callback page (e.g., due to a popup-blocker or direct navigation), THEN THE Platform SHALL redirect the user to `/login?error=auth_failed`.

---

### Requirement 30: Security — JWT Secret Default Fallback Warning

**User Story:** As an operator deploying the backend, I want to be warned if the JWT secret is using a weak or default value, so that I do not accidentally run a production instance with a guessable secret.

#### Acceptance Criteria

1. WHEN the backend server starts, THE Platform SHALL compare `JWT_SECRET` against a known-weak-defaults list including: `"secret"`, `"your-secret-key"`, `"changeme"`, `"jwt_secret"`, `"default_secret"`, `"your_super_secret_jwt_key_here_change_in_production"`.
2. IF `JWT_SECRET` matches a known weak default and `NODE_ENV === 'production'`, THEN THE Platform SHALL log `[FATAL] JWT_SECRET is a known weak default. Server startup aborted.` and exit with code 1.
3. IF `JWT_SECRET` matches a known weak default and `NODE_ENV` is not `production`, THEN THE Platform SHALL log `[WARN] JWT_SECRET is using a weak default value. Change it before deploying to production.` as a clearly visible warning (e.g., `logger.warn`).
4. THE same checks defined in criteria 1–3 SHALL be applied to `JWT_REFRESH_SECRET`, with corresponding log messages referencing `JWT_REFRESH_SECRET`.
5. THE Platform SHALL add these checks to `src/config/env.ts` as part of the existing startup validation; IF `JWT_SECRET` is absent or empty, THE Platform SHALL treat it as a weak default and apply criterion 2 or 3 accordingly.

---

### Requirement 31: Security — Cancel Order Backend Route

**User Story:** As a customer, I want to cancel a pending order from my orders page, so that I am not charged for an order I no longer want.

#### Acceptance Criteria

1. THE Platform SHALL implement a `PUT /api/orders/:id/cancel` route in `orderRoutes.ts` protected by `verifyToken`.
2. WHEN a customer calls `PUT /api/orders/:id/cancel` for an order that does not belong to them, THE Cancel_Order_Route SHALL return HTTP 403 with the message "You do not have permission to cancel this order."
3. IF the order ID in the URL does not correspond to an existing order, THEN THE Cancel_Order_Route SHALL return HTTP 404 with the message "Order not found."
4. THE Cancel_Order_Route SHALL allow cancellation only WHEN `orderstatus` is `pending` or `confirmed`; IF `orderstatus` is `shipped`, `delivered`, or `cancelled`, THEN THE Cancel_Order_Route SHALL return HTTP 400 with the message "This order cannot be cancelled."
5. WHEN a cancellation is successful, THE Cancel_Order_Route SHALL (a) set `orderstatus` to `cancelled`, (b) increment `stock` for each order item by its ordered quantity, (c) reverse loyalty points awarded for the order IF the Loyalty_Engine is active, and (d) return HTTP 200 with the updated order document.
6. WHEN a cancellation is successful and `paymentMethod === 'razorpay'` and `paymentStatus === 'paid'`, THE Cancel_Order_Route SHALL initiate a Razorpay refund via the existing Razorpay utility and update the Payment document's `status` to `'refund_initiated'`.
7. THE frontend SHALL display a "Cancel Order" button on the order detail page WHEN `orderstatus` is `pending` or `confirmed`, and SHALL NOT render the button for any other status.

---

### Requirement 32: Security — Persist Coupon Discount on Order

**User Story:** As a developer and auditor, I want the coupon code and discount amount to be stored on each order document, so that financial reporting is accurate and discounts cannot be repudiated.

#### Acceptance Criteria

1. THE Order model SHALL be extended with two optional fields: `couponCode: { type: String, default: undefined }` and `discountAmount: { type: Number, default: 0, min: 0 }`.
2. WHEN a coupon is applied during order creation, THE `createOrder` handler SHALL set `couponCode` to the applied code string and `discountAmount` to the calculated discount amount on the Order document.
3. WHEN `discountAmount > 0`, THE `createOrder` handler SHALL compute `totalAmount` as `(sum of item prices × quantities) + shippingFee - discountAmount`, ensuring `totalAmount >= 0`.
4. WHEN `discountAmount` is 0 or absent, THE Platform SHALL not display a coupon row on the order detail page; WHEN `discountAmount > 0`, THE Platform SHALL display the `couponCode` and formatted savings (e.g., "Coupon SAVE10 applied: -₹50") on the order detail page and in the order confirmation email.
5. THE Admin order list page SHALL display a coupon column showing `couponCode` and `discountAmount` (or "—" when no coupon was applied) alongside each order's total.

---

### Requirement 33: Security — Input Validation Audit

**User Story:** As a security engineer, I want all backend API endpoints to validate and sanitize input using a single consistent library, so that injection and data-integrity vulnerabilities are eliminated.

#### Acceptance Criteria

1. THE Platform SHALL use Joi as the single Validation_Library for all request-body validation across all route handlers; any routes that currently use `express-validator` or `zod` for request-body validation SHALL be refactored to use Joi schemas instead.
2. THE Platform SHALL apply Joi validation schemas to request bodies on: all authentication endpoints (`/api/auth/*`), all product endpoints, all order endpoints, all coupon endpoints, all review endpoints, and all address endpoints; WHERE a handler already has a Joi schema, THE Platform SHALL ensure it covers all expected body fields.
3. IF a request body fails Joi validation, THEN the handler SHALL return HTTP 400 with a response body of the form `{ success: false, message: "<field>: <validation message>" }`.
4. THE `sanitizer.ts` middleware (express-mongo-sanitize + HPP) SHALL remain applied globally in `server.ts` to prevent MongoDB operator injection and HTTP Parameter Pollution; no individual route handler SHALL remove this protection.
5. THE backend `README.md` SHALL include a "Validation Strategy" section stating: "All request-body validation uses Joi. The express-mongo-sanitize and HPP middleware are applied globally. Zod and express-validator are not used for request validation."

---

### Requirement 34: Codebase Cleanup — Remove Redundant isAdmin Field

**User Story:** As a developer, I want a single source of truth for admin status, so that authorization checks are consistent and cannot be bypassed via field divergence.

#### Acceptance Criteria

1. THE Platform SHALL remove all runtime reads of the `isAdmin` field from User documents in controller authorization checks and replace them with checks against `role === 'admin'`.
2. THE Platform SHALL remove the `isAdmin` field from all API response payloads where `role` is already present.
3. THE Platform SHALL retain the `isAdmin` field in the User schema (for backward-compatibility with existing data) but mark it as deprecated in a schema comment.
4. THE `verifyAdmin` middleware SHALL use only `role === 'admin'` for the authorization check.

---

### Requirement 35: Codebase Cleanup — Unused Static Data and Components

**User Story:** As a developer, I want unused files and components removed from the codebase, so that the project is easier to maintain and the bundle is smaller.

#### Acceptance Criteria

1. THE Platform SHALL audit `src/data/products.ts` and `src/data/companyData.ts` in the frontend; WHERE these files are not imported by any active component, THE Platform SHALL delete them.
2. THE Platform SHALL audit `TeamSection` and `TraditionalElements` components; WHERE these components are not used in any active page or component tree, THE Platform SHALL delete them.
3. WHEN any file or component is removed, THE Platform SHALL verify (via TypeScript compilation with `noUnusedLocals: true` or equivalent) that no remaining code references the deleted file.
4. THE Platform SHALL document removed files and the rationale in the `CHANGELOG.md` or a dedicated cleanup commit message.

---

### Requirement 36: Codebase Cleanup — Document Twilio SMS Stub

**User Story:** As a developer onboarding to the project, I want to know that SMS functionality is not live, so that I don't assume Twilio is fully configured.

#### Acceptance Criteria

1. THE `sendOTPSMS` function in `src/utils/email.ts` (or equivalent SMS utility) SHALL include a JSDoc comment stating: "Twilio SMS integration is a stub. Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env to enable live SMS delivery."
2. WHEN the Twilio environment variables are not configured, THE Platform SHALL log a warning at startup: "SMS (Twilio) is not configured. Mobile OTP will not be delivered."
3. THE backend `README.md` SHALL include a section titled "SMS Configuration" that documents the Twilio stub status and the steps required to enable live SMS.
4. THE Platform SHALL not throw an unhandled exception when `sendOTPSMS` is called without Twilio credentials; IF credentials are absent, THEN THE function SHALL return `false` and log the warning described in criterion 2.
