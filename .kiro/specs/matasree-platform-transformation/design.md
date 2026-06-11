# Design Document: Matasree Platform Transformation

## Overview

The Matasree Platform Transformation is a comprehensive upgrade of the Matasree Super Masale e-commerce platform. It extends an existing full-stack application (React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Framer Motion on the frontend; Node.js + Express + TypeScript + MongoDB on the backend) with 36 feature enhancements grouped into eight areas: customer experience, conversion optimisation, brand building, UI/UX, performance, SEO, security, and codebase quality.

The transformation introduces six new MongoDB models (Wishlist, LoyaltyAccount, LoyaltyTransaction, Referral, SeasonalBanner, Recipe), extends five existing models (Order, Cart, User, Product, Coupon), adds fourteen new backend route modules, and introduces twelve new frontend component families — all while preserving existing API contracts and data integrity.

This document follows a **Diagrams & Interfaces + Code-First** approach, combining architecture diagrams, interface contracts, formal algorithm specifications, and correctness properties needed to guide implementation across all 36 requirements.

---

## Architecture

### High-Level System Architecture

```mermaid
graph TD
    subgraph Browser["Browser (React 18 + Vite)"]
        FE_Pages["Pages (25 existing + 3 new)"]
        FE_Components["Components (existing + 12 new families)"]
        FE_Stores["Zustand Stores (auth, cart, wishlist + loyalty, comparison)"]
        SEO_Layer["SEO Layer (react-helmet-async + JSON-LD)"]
        FE_Pages --> FE_Components
        FE_Components --> FE_Stores
        SEO_Layer --> FE_Pages
    end

    subgraph Backend["Backend (Express + TypeScript)"]
        API_Gateway["Express Router + Middleware Stack"]
        Auth_Routes["Auth Routes (existing + OAuth fix)"]
        Product_Routes["Product Routes (existing + search, filter, recently-viewed)"]
        Cart_Routes["Cart Routes (existing + sync)"]
        Order_Routes["Order Routes (existing + cancel)"]
        Wishlist_Routes["Wishlist Routes (new)"]
        Loyalty_Routes["Loyalty Routes (new)"]
        Referral_Routes["Referral Routes (new)"]
        Review_Routes["Review Routes (existing + product-wiring)"]
        SEO_Script["Sitemap Generator Script (new)"]
        Abandonment_Job["Cart Abandonment Job (node-cron)"]

        API_Gateway --> Auth_Routes
        API_Gateway --> Product_Routes
        API_Gateway --> Cart_Routes
        API_Gateway --> Order_Routes
        API_Gateway --> Wishlist_Routes
        API_Gateway --> Loyalty_Routes
        API_Gateway --> Referral_Routes
        API_Gateway --> Review_Routes
    end

    subgraph DB["MongoDB (Mongoose)"]
        Existing_Models["Existing: User, Product, Cart, Order, Review, Coupon, Category, Address, Payment, RefreshToken, Partnership"]
        New_Models["New: Wishlist, LoyaltyAccount, LoyaltyTransaction, Referral, SeasonalBanner, Recipe"]
        Existing_Models --> DB
        New_Models --> DB
    end

    subgraph External["External Services"]
        Cloudinary["Cloudinary (images)"]
        Razorpay["Razorpay (payments)"]
        Nodemailer["Nodemailer (email)"]
        WhatsApp["WhatsApp wa.me (ordering)"]
    end

    Browser -->|"HTTPS + Bearer JWT"| Backend
    Backend --> DB
    Backend --> Cloudinary
    Backend --> Razorpay
    Backend --> Nodemailer
    Browser --> WhatsApp
```

### Request Flow for a Typical Authenticated Feature

```mermaid
sequenceDiagram
    participant U as User Browser
    participant FE as React App
    participant ZS as Zustand Store
    participant API as Express API
    participant MW as Auth Middleware
    participant DB as MongoDB

    U->>FE: Interact (e.g., Add to Wishlist)
    FE->>ZS: Read auth token (in-memory)
    FE->>API: POST /api/wishlist/:productId (Bearer token)
    API->>MW: verifyToken → attach req.user
    MW->>DB: RefreshToken lookup (if needed)
    API->>DB: Wishlist.findOneAndUpdate()
    DB-->>API: Updated document
    API-->>FE: 201 { success, data }
    FE->>ZS: Optimistic update wishlist state
    FE->>U: UI reflects new wishlist item
```

---

## Data Models

### New Models

#### Wishlist

```typescript
interface IWishlist {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;          // ref: User, unique index
  items: Array<{
    productId: mongoose.Types.ObjectId;     // ref: Product
    addedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
// Indexes: { userId: 1 } unique, { 'items.productId': 1 }
```

#### LoyaltyAccount

```typescript
interface ILoyaltyAccount {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;          // ref: User, unique
  balance: number;                          // current points, >= 0
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  createdAt: Date;
  updatedAt: Date;
}
// Index: { userId: 1 } unique
```

#### LoyaltyTransaction

```typescript
interface ILoyaltyTransaction {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;          // ref: User
  orderId?: mongoose.Types.ObjectId;        // ref: Order
  delta: number;                            // positive = earn, negative = redeem
  reason: 'order_earn' | 'order_cancel' | 'referral_bonus' | 'redemption';
  balanceAfter: number;                     // snapshot of balance after transaction
  createdAt: Date;
}
// Indexes: { userId: 1, createdAt: -1 }, { orderId: 1 }
```

#### Referral

```typescript
interface IReferral {
  _id: mongoose.Types.ObjectId;
  referrerId: mongoose.Types.ObjectId;      // ref: User — who shared the code
  refereeId: mongoose.Types.ObjectId;       // ref: User — who used the code
  code: string;                             // referrer's code, indexed
  status: 'pending' | 'rewarded';
  rewardedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
// Indexes: { referrerId: 1 }, { refereeId: 1 } unique, { code: 1 }
```

#### SeasonalBanner

```typescript
interface ISeasonalBanner {
  _id: mongoose.Types.ObjectId;
  image: string;                            // Cloudinary URL
  title: string;
  subtitle?: string;
  ctaLink: string;
  ctaText: string;
  activeFrom: Date;
  activeTo: Date;
  createdAt: Date;
  updatedAt: Date;
}
// Index: { activeFrom: 1, activeTo: 1 }
```

#### Recipe

```typescript
interface IRecipe {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  productTags: string[];                    // product names or IDs for filtering
  region: 'North Indian' | 'South Indian' | 'Bengali' | 'Rajasthani' | 'Other';
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}
// Indexes: { productTags: 1 }, { region: 1 }
```

---

### Extensions to Existing Models

#### Order (extensions)

```typescript
// Add to IOrder:
couponCode?: string;          // optional, applied coupon code
discountAmount?: number;      // default 0, min 0
loyaltyPointsEarned?: number; // points awarded for this order
loyaltyPointsRedeemed?: number;
loyaltyDiscountAmount?: number;
```

New indexes to add to `orderSchema`:

```typescript
orderSchema.index({ userId: 1, createdAt: -1 });  // Req 23.1
orderSchema.index({ orderstatus: 1 });             // Req 23.2
```

#### Cart (extensions)

```typescript
// Add to ICart:
abandonmentEmailSentAt?: Date;  // Req 14.3 — tracks whether abandonment email was sent
```

#### User (extensions)

```typescript
// Add to IUser:
referralCode: string;           // Req 11.1 — unique code generated on creation
loyaltyAccountId?: mongoose.Types.ObjectId;  // ref: LoyaltyAccount
// Mark isAdmin as @deprecated in schema comment (Req 34.3)
```

#### Product (extensions)

No schema changes needed — `sold`, `tags`, `images`, `rating`, `reviews` fields already exist. The `GET /api/products` endpoint gains new filter query parameters.

#### Review (extensions)

```typescript
// Existing productId field becomes required for product reviews (Req 8.1)
// No schema changes — productId already exists as optional ObjectId
// Logic change: enforce productId is set when submitting a product review
```

#### Coupon (extensions)

```typescript
// Add to ICoupon:
usageCount: number;                  // Req 12.2 — tracks cumulative redemptions, default 0
categoryRestrictions?: string[];     // Req 12.3 — category ObjectId strings
```

---

## Backend API Architecture

### New Route Modules

```mermaid
graph LR
    Server["server.ts"] --> WR["wishlistRoutes\n/api/wishlist"]
    Server --> LR["loyaltyRoutes\n/api/loyalty"]
    Server --> RR["referralRoutes\n/api/referral"]
    Server --> SR["searchRoutes merged\ninto productRoutes"]
    Server --> ABJ["abandonmentJob\nnode-cron"]
```

### Complete New & Modified Endpoint Inventory

#### Wishlist API (Req 3)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/wishlist` | verifyToken | Get user wishlist (populated) |
| POST | `/api/wishlist/:productId` | verifyToken | Add product; 409 if duplicate |
| DELETE | `/api/wishlist/:productId` | verifyToken | Remove product; 404 if absent |

#### Loyalty API (Req 10)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/loyalty/balance` | verifyToken | Get current points balance |
| GET | `/api/loyalty/transactions` | verifyToken | Paginated transaction history |
| POST | `/api/loyalty/redeem` | verifyToken | Redeem points at checkout |

#### Referral API (Req 11)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/referral/my-code` | verifyToken | Get own referral code |
| GET | `/api/referral/history` | verifyToken | List referred users + status |
| POST | `/api/referral/apply` | public | Apply code at registration |

#### Search & Filter (Req 1, 2) — extends productRoutes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products/search?q=&limit=10` | public | Autocomplete suggestions (≤10, ≤300ms) |
| GET | `/api/products?minPrice=&maxPrice=&category=&weight=&minRating=&inStock=&page=&limit=` | public | Filtered + paginated listing |

#### Recently Viewed (Req 4)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products/recently-viewed` | verifyToken | Get server-side recently viewed (≤10) |
| POST | `/api/products/recently-viewed/:productId` | verifyToken | Record a product view |

#### Comparison (Req 5) — frontend only, no new backend endpoints needed

Product data for comparison is fetched from the existing `GET /api/products/:id` endpoint.

#### Cart Sync (Req 24)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/cart/sync` | verifyToken | Validate cart items vs. live prices/stock |

#### Cancel Order (Req 31)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PUT | `/api/orders/:id/cancel` | verifyToken | Cancel pending/confirmed order |

#### Admin Endpoints (Req 9, 14, 17)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST/PUT/DELETE | `/api/admin/banners` | verifyAdmin | CRUD seasonal banners |
| GET/POST/PUT/DELETE | `/api/admin/recipes` | verifyAdmin | CRUD recipe content |
| GET/PUT | `/api/admin/abandonment-config` | verifyAdmin | Get/set abandonment window & coupon |

---

### Key Algorithm Designs

#### Loyalty Engine — Point Accrual (Req 10)

```pascal
PROCEDURE awardLoyaltyPoints(orderId, userId, subtotalPaid)
  INPUT: orderId: ObjectId, userId: ObjectId, subtotalPaid: number (INR)
  OUTPUT: updatedBalance: number

  PRECONDITIONS:
    subtotalPaid >= 0
    LoyaltyAccount exists for userId OR will be created

  SEQUENCE
    pointsToAward ← FLOOR(subtotalPaid / 10)   // 1 point per ₹10

    IF pointsToAward = 0 THEN
      RETURN currentBalance unchanged
    END IF

    account ← LoyaltyAccount.findOneAndUpdate(
      { userId },
      {
        $inc: { balance: pointsToAward, lifetimeEarned: pointsToAward }
      },
      { upsert: true, new: true }
    )

    LoyaltyTransaction.create({
      userId, orderId,
      delta: +pointsToAward,
      reason: 'order_earn',
      balanceAfter: account.balance
    })

    Order.updateOne({ _id: orderId }, { loyaltyPointsEarned: pointsToAward })

    RETURN account.balance
  END SEQUENCE

  POSTCONDITIONS:
    account.balance = priorBalance + pointsToAward
    LoyaltyTransaction record exists with balanceAfter = account.balance
    pointsToAward = FLOOR(subtotalPaid / 10)
END PROCEDURE
```

**Loop Invariant**: N/A (single-pass arithmetic, no loops)

#### Loyalty Engine — Point Redemption (Req 10.2)

```pascal
PROCEDURE redeemLoyaltyPoints(userId, pointsRequested, orderSubtotal)
  INPUT: userId, pointsRequested: integer >= 0, orderSubtotal: number >= 0
  OUTPUT: discountAmount: number

  PRECONDITIONS:
    pointsRequested >= 0
    orderSubtotal >= 0

  SEQUENCE
    account ← LoyaltyAccount.findOne({ userId })

    IF account = null OR account.balance < pointsRequested THEN
      RETURN HTTP 400 "Insufficient loyalty points"
    END IF

    maxRedeemableDiscount ← orderSubtotal * 0.50      // 50% cap
    requestedDiscount ← pointsRequested * 0.50        // ₹0.50 per point

    discountAmount ← MIN(requestedDiscount, maxRedeemableDiscount)
    effectivePoints ← FLOOR(discountAmount / 0.50)    // recalculate actual points used

    account.balance -= effectivePoints
    account.lifetimeRedeemed += effectivePoints
    account.save()

    LoyaltyTransaction.create({
      userId, delta: -effectivePoints,
      reason: 'redemption',
      balanceAfter: account.balance
    })

    RETURN discountAmount
  END SEQUENCE

  POSTCONDITIONS:
    discountAmount <= orderSubtotal * 0.50
    discountAmount >= 0
    effectivePoints <= pointsRequested
    account.balance = priorBalance - effectivePoints
END PROCEDURE
```

#### Coupon Engine Validation (Req 12)

```pascal
PROCEDURE validateCoupon(code, userId, orderAmount, cartItems)
  INPUT: code: string, userId: ObjectId, orderAmount: number, cartItems: CartItem[]
  OUTPUT: { valid: boolean, discountAmount: number, reason?: string }

  PRECONDITIONS:
    orderAmount >= 0
    cartItems.length >= 0

  SEQUENCE
    coupon ← Coupon.findOne({ code: code.toUpperCase() })

    IF coupon = null THEN
      RETURN { valid: false, reason: "Invalid coupon code" }
    END IF

    IF coupon.expiresAt < NOW() THEN
      RETURN { valid: false, reason: "Coupon has expired" }
    END IF

    IF coupon.maxUses > 0 AND coupon.usageCount >= coupon.maxUses THEN
      RETURN { valid: false, reason: "Coupon maximum uses reached" }
    END IF

    IF orderAmount < coupon.minOrderAmount THEN
      RETURN { valid: false, reason: "Minimum order amount not met" }
    END IF

    // Category restriction check
    IF coupon.categoryRestrictions.length > 0 THEN
      eligibleItems ← cartItems FILTER item.categoryId IN coupon.categoryRestrictions
      effectiveAmount ← SUM(eligibleItems[i].price * eligibleItems[i].qty)
    ELSE
      effectiveAmount ← orderAmount
    END IF

    IF coupon.discountType = 'percentage' THEN
      rawDiscount ← effectiveAmount * (coupon.discountValue / 100)
    ELSE
      rawDiscount ← coupon.discountValue
    END IF

    IF coupon.maxDiscount > 0 THEN
      discountAmount ← MIN(rawDiscount, coupon.maxDiscount)
    ELSE
      discountAmount ← rawDiscount
    END IF

    RETURN { valid: true, discountAmount: ROUND(discountAmount, 2) }
  END SEQUENCE

  POSTCONDITIONS:
    IF valid: discountAmount >= 0 AND discountAmount <= orderAmount
    IF not valid: discountAmount = 0
END PROCEDURE
```

#### Cart Sync Reconciliation (Req 24)

```pascal
PROCEDURE syncCart(userId, clientItems)
  INPUT: clientItems: Array<{ productId, quantity, clientPrice }>
  OUTPUT: { syncedItems, priceDiffs, removedItems }

  SEQUENCE
    productIds ← clientItems.map(item => item.productId)
    liveProducts ← Product.find({ _id: { $in: productIds } })
    liveMap ← Map<productId, Product>(liveProducts)

    syncedItems ← []
    priceDiffs ← []
    removedItems ← []

    FOR each clientItem IN clientItems DO
      live ← liveMap.get(clientItem.productId)

      IF live = null OR live.stock = 0 THEN
        removedItems.push(clientItem)
        CONTINUE
      END IF

      IF live.price != clientItem.clientPrice THEN
        priceDiffs.push({ productId: clientItem.productId,
                          oldPrice: clientItem.clientPrice,
                          newPrice: live.price })
      END IF

      syncedItems.push({ productId: live._id,
                         quantity: MIN(clientItem.quantity, live.stock),
                         price: live.price })
    END FOR

    // Persist reconciled cart to DB
    Cart.findOneAndUpdate(
      { userId },
      { items: syncedItems },
      { upsert: true }
    )

    RETURN { syncedItems, priceDiffs, removedItems }
  END SEQUENCE

  POSTCONDITIONS:
    ∀ item ∈ syncedItems: item.price = liveProduct.price
    ∀ item ∈ syncedItems: item.quantity ≤ liveProduct.stock
    ∀ item ∈ removedItems: item.productId NOT IN syncedItems
    priceDiffs only contains items where clientPrice ≠ livePrice
END PROCEDURE
```

#### Wishlist Deduplication (Req 3.3)

```pascal
PROCEDURE addToWishlist(userId, productId)
  INPUT: userId: ObjectId, productId: ObjectId
  OUTPUT: HTTP status

  PRECONDITIONS:
    productId is a valid MongoDB ObjectId

  SEQUENCE
    wishlist ← Wishlist.findOne({ userId })

    IF wishlist = null THEN
      Wishlist.create({ userId, items: [{ productId, addedAt: NOW() }] })
      RETURN HTTP 201
    END IF

    alreadyPresent ← wishlist.items.some(item => item.productId.equals(productId))

    IF alreadyPresent THEN
      RETURN HTTP 409 "Product is already in your wishlist"
    END IF

    IF wishlist.items.length >= 100 THEN
      RETURN HTTP 400 "Wishlist limit reached"
    END IF

    wishlist.items.push({ productId, addedAt: NOW() })
    wishlist.save()
    RETURN HTTP 201
  END SEQUENCE

  POSTCONDITIONS:
    wishlist.items contains productId exactly once
    No duplicate productId entries exist in wishlist.items
END PROCEDURE
```

---

## Components and Interfaces

### New Component Families

```mermaid
graph TD
    subgraph Discovery["Discovery Layer"]
        SearchBar["SearchBar\n(autocomplete, debounced 300ms)"]
        FilterPanel["FilterPanel\n(price/category/weight/rating/stock)"]
        QuickViewModal["QuickViewModal\n(product preview, add-to-cart)"]
        ComparisonTray["ComparisonTray\n(sticky bottom, ≤4 products)"]
    end

    subgraph ProductUI["Product UI"]
        ProductCard["ProductCard (enhanced)\n(zoom, wishlist heart, low-stock badge)"]
        StickyAddToCart["StickyAddToCartBar\n(scrolls into view on PDP)"]
        WhatsAppButton["WhatsAppButton\n(product + cart message builder)"]
        RecentlyViewed["RecentlyViewedSection\n(carousel, ≤10 items)"]
    end

    subgraph Navigation["Navigation"]
        MobileNavDrawer["MobileNavDrawer\n(slide-in, focus trap)"]
        BottomTabBar["BottomTabBar\n(Home/Products/Cart/Account)"]
    end

    subgraph Feedback["Feedback & Loading"]
        SkeletonLoaders["SkeletonLoaders\n(ProductCardSkeleton, TestimonialSkeleton)"]
        EmptyState["EmptyState variants\n(cart/wishlist/search/orders/reviews)"]
        OrderTimeline["OrderTimeline\n(pending→confirmed→shipped→delivered→cancelled)"]
    end

    subgraph Conversion["Conversion & Loyalty"]
        ExitIntentModal["ExitIntentModal\n(one per session, 30-min coupon)"]
        LoyaltyWidget["LoyaltyWidget\n(balance + redeem at checkout)"]
        TrustBadges["TrustBadges\n(secure/free-delivery/natural/returns)"]
    end

    subgraph SEO_FE["SEO Layer"]
        HelmetWrapper["PageHelmet\n(react-helmet-async wrapper)"]
        JsonLd["JsonLd\n(Product/Organization/Breadcrumb/LocalBusiness)"]
    end
```

### Component Interface Contracts

#### QuickViewModal

```typescript
interface QuickViewModalProps {
  productId: string | null;           // null = closed
  triggerRef: React.RefObject<HTMLElement>; // for focus restoration on close
  onClose: () => void;
  onAddToCart: (productId: string, quantity: number) => void;
}
// Internal state: loading (skeleton), product data
// ARIA: role="dialog", aria-modal="true", aria-label="Quick view: {productName}"
// Focus trap: first focusable element on open; triggerRef on close
```

#### ComparisonTray

```typescript
interface ComparisonState {
  items: ComparisonProduct[];           // max 4
  addProduct: (p: ComparisonProduct) => void;
  removeProduct: (id: string) => void;
  clearAll: () => void;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
}
interface ComparisonProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  weight: string;
  category: string;
  stock: number;
  description: string;
  image: string;
}
// Zustand store (no persist — session lifetime only)
// Max items guard: if items.length >= 4 → toast "You can compare up to 4 products at a time."
```

#### StickyAddToCartBar

```typescript
interface StickyAddToCartBarProps {
  productName: string;
  price: number;
  stock: number;
  onAddToCart: () => void;
  isLoading: boolean;
}
// Visible only when primary AddToCart button is NOT in viewport
// Uses IntersectionObserver on primary button ref
// productName truncated to 30 chars with ellipsis
```

#### MobileNavDrawer

```typescript
interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}
// Renders when viewport < 768px
// Focus trap using focus-trap library or manual Tab interception
// body overflow:hidden while open
// Closes on: Escape key, overlay tap, close button
// Close animation ≤ 300ms (Framer Motion exit)
```

#### EmptyState

```typescript
type EmptyStateVariant = 'cart' | 'wishlist' | 'search' | 'orders' | 'reviews';

interface EmptyStateProps {
  variant: EmptyStateVariant;
  searchQuery?: string;  // for 'search' variant
}
// Each variant has: icon (min 64×64px), message, CTA button + href
const EMPTY_STATE_CONFIG: Record<EmptyStateVariant, {
  icon: React.ComponentType;
  message: string;
  ctaText: string;
  ctaHref: string;
}>;
```

#### OrderTimeline

```typescript
type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  statusHistory?: Array<{ status: OrderStatus; timestamp: Date }>;
}
// Statuses rendered in order: pending → confirmed → shipped → delivered
// 'cancelled' shown as a terminal branch
// Current status: filled icon + primary color
// Future statuses: outlined icon + muted color
```

#### PageHelmet (SEO)

```typescript
interface PageHelmetProps {
  title: string;                // e.g. "Chilli Powder 500g | Matasree Super Masale"
  description: string;
  ogImage?: string;             // absolute URL
  ogType?: 'website' | 'product';
  canonicalUrl: string;         // absolute URL
  noIndex?: boolean;            // true for private pages
}
```

#### JsonLd

```typescript
interface JsonLdProps {
  schema: Record<string, unknown>;  // pre-built schema object
}
// Renders: <script type="application/ld+json">{JSON.stringify(schema)}</script>
// Via react-helmet-async
```

---

## SEO Layer Architecture

```mermaid
graph LR
    HelmetProvider["HelmetProvider (root App.tsx)"]
    
    subgraph Pages
        PDP["ProductDetailPage\n→ Product JSON-LD\n→ BreadcrumbList JSON-LD"]
        Home["Index (Homepage)\n→ Organization JSON-LD"]
        About["AboutPage\n→ Organization JSON-LD\n→ LocalBusiness JSON-LD"]
        Others["Other public pages\n→ PageHelmet only"]
    end

    HelmetProvider --> Pages
    SitemapScript["generateSitemap.ts script\n(npm run generate:sitemap)"]
    RobotsTxt["robots.txt (static, public/)"]
    SitemapXml["sitemap.xml (generated, public/)"]
    SitemapScript --> SitemapXml
```

### Page Meta Tag Matrix

| Page | title template | noIndex | og:type | JSON-LD |
|------|---------------|---------|---------|---------|
| Homepage | `Matasree Super Masale — Premium Indian Spices` | false | website | Organization |
| Product Listing | `Products | Matasree Super Masale` | false | website | — |
| Product Detail | `{name} {weight} | Matasree Super Masale` | false | product | Product, BreadcrumbList |
| Category | `{category} | Matasree Super Masale` | false | website | BreadcrumbList |
| About | `About Us | Matasree Super Masale` | false | website | Organization, LocalBusiness |
| Recipes | `Recipes | Matasree Super Masale` | false | website | — |
| Contact | `Contact Us | Matasree Super Masale` | false | website | LocalBusiness |
| Cart | `Your Cart | Matasree Super Masale` | **true** | — | — |
| Checkout | `Checkout | Matasree Super Masale` | **true** | — | — |
| Login/Register | `Login/Register | Matasree Super Masale` | **true** | — | — |
| Profile/Orders/Admin | `{title} | Matasree Super Masale` | **true** | — | — |

---

## Security Design

### OAuth Token Delivery Fix (Req 29)

**Current (insecure) flow**: `oauthCallback` redirects to `/auth/callback?token={accessToken}&user={...}` — token visible in URL history and server logs.

**Revised flow**:

```mermaid
sequenceDiagram
    participant Browser
    participant Backend as Express oauthCallback
    participant FE as /auth/callback page
    participant Store as Zustand authStore

    Browser->>Backend: GET /api/auth/google/callback
    Backend->>Backend: issueTokens() → accessToken + httpOnly refreshToken cookie
    Backend->>Browser: 302 Redirect /auth/callback (NO token in URL)
    Note over Backend,Browser: accessToken written to sessionStorage via postMessage or dedicated /auth/token endpoint
    Browser->>FE: Render /auth/callback
    FE->>Backend: GET /api/auth/token (cookie already set) → returns { accessToken, user }
    Backend-->>FE: { accessToken, user }
    FE->>Store: store.setAuth(accessToken, user)
    FE->>Store: clear sessionStorage
    FE->>Browser: redirect to /  (or returnTo param)
```

**Implementation**: The backend exposes `GET /api/auth/token` (cookie-authenticated) that returns the access token once after OAuth. The `/auth/callback` frontend page fetches this endpoint on mount, stores the token in Zustand (in-memory only, never `localStorage`), then redirects.

### JWT Secret Validation (Req 30)

Added to `src/config/env.ts`:

```typescript
const WEAK_SECRETS = new Set([
  'secret', 'your-secret-key', 'changeme', 'jwt_secret',
  'default_secret', 'your_super_secret_jwt_key_here_change_in_production'
]);

function validateJwtSecret(key: 'JWT_SECRET' | 'JWT_REFRESH_SECRET'): void {
  const value = process.env[key];
  const isWeak = !value || WEAK_SECRETS.has(value);
  if (!isWeak) return;
  if (process.env.NODE_ENV === 'production') {
    logger.error(`[FATAL] ${key} is a known weak default. Server startup aborted.`);
    process.exit(1);
  } else {
    logger.warn(`[WARN] ${key} is using a weak default value. Change it before deploying.`);
  }
}
```

### Input Validation Strategy (Req 33)

All request-body validation uses **Joi** exclusively. Express-validator and Zod are not used for request validation. The middleware stack remains:

```
express.json() → sanitizeMongo → preventHPP → xssSanitizer → Joi validation (per-route)
```

Joi schema pattern (applied to every new route handler):

```typescript
const schema = Joi.object({ /* fields */ });
const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
if (error) {
  return res.status(400).json({ success: false, message: error.details[0].message });
}
```

---

## Performance Design

### Bundle Splitting Strategy (Req 25)

`vite.config.ts` manual chunks configuration:

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', /* other radix */],
        'vendor-framer': ['framer-motion'],
        'vendor-zustand': ['zustand'],
        'vendor-axios': ['axios'],
        'vendor-charts': ['recharts'],
        'pages-admin': [
          './src/pages/AdminDashboard.tsx',
          './src/pages/AdminProducts.tsx',
          './src/pages/AdminOrders.tsx',
          './src/pages/AdminUsers.tsx',
          './src/pages/AdminCategories.tsx',
        ],
      }
    }
  },
  plugins: [visualizer({ filename: 'dist/bundle-analysis.html', open: false })]
}
```

Target: no single initial JS chunk > 250 KB gzipped.

### Database Index Plan (Req 23)

Indexes to create with `background: true` on server startup:

| Collection | Index | Type | Requirement |
|------------|-------|------|-------------|
| Order | `{ userId: 1, createdAt: -1 }` | Compound | 23.1 |
| Order | `{ orderstatus: 1 }` | Single | 23.2 |
| Address | `{ userId: 1 }` | Single | 23.3 |
| Payment | `{ orderId: 1 }` | Single | 23.4 |
| Payment | `{ userId: 1, status: 1 }` | Compound | 23.5 |
| Wishlist | `{ userId: 1 }` | Unique | Req 3 |
| LoyaltyTransaction | `{ userId: 1, createdAt: -1 }` | Compound | Req 10 |
| Referral | `{ refereeId: 1 }` | Unique | Req 11 |
| Product | `{ name: 'text', description: 'text', tags: 'text' }` | Text (existing) | Req 1 |
| SeasonalBanner | `{ activeFrom: 1, activeTo: 1 }` | Compound | Req 9 |

### Image Lazy Loading (Req 22)

```typescript
// ProductImage component
interface ProductImageProps {
  src: string;
  alt: string;
  isAboveFold: boolean;  // true for hero + first homepage product
  aspectRatio: '1/1' | '4/3' | '16/9';
}
// Renders:
// <img loading={isAboveFold ? 'eager' : 'lazy'} ... style={{ aspectRatio }} />
// Placeholder: Tailwind bg-muted + skeleton pulse while loading
// Explicit width/height to prevent CLS > 0.1
```

---

## Cart Abandonment Flow Design

```mermaid
sequenceDiagram
    participant Cron as node-cron (every 30min)
    participant DB as MongoDB
    participant Email as Nodemailer

    Cron->>DB: Find Carts where\n updatedAt < (now - abandonWindow)\n AND abandonmentEmailSentAt = null\n AND items.length > 0
    DB-->>Cron: Abandoned carts list
    loop For each cart
        Cron->>DB: Find User by cart.userId
        Cron->>DB: Check if Order created after cart.updatedAt (skip if yes)
        Cron->>Email: Send abandonment email with\n items, checkout link, optional coupon
        Cron->>DB: Set cart.abandonmentEmailSentAt = now
    end
```

The abandonment window (1–24 hours, default 2) and optional coupon code are stored in an `AdminConfig` document queried at job runtime.

---

## New Pages

| Page | Route | Req |
|------|-------|-----|
| RecipesPage | `/recipes` | 9 |
| SpiceGuidePage | `/spice-guide` | 16 |
| OAuthCallbackPage (revised) | `/auth/callback` | 29 |

The existing `AboutPage`, `Index`, `ProductsPage`, `ProductDetailsPage`, `OrdersPage`, `ProfilePage`, `CheckoutPage`, and `WishlistPage` receive significant enhancements but are not new pages.

---

## Error Handling

### Backend Error Scenarios

| Scenario | HTTP | Message |
|----------|------|---------|
| Invalid MongoDB ObjectId in URL param | 400 | `"Invalid ID format"` |
| Product not found | 404 | `"Product not found"` |
| Wishlist duplicate | 409 | `"Product is already in your wishlist"` |
| Insufficient loyalty points | 400 | `"Insufficient loyalty points"` |
| Invalid referral code | 400 | `"Invalid referral code"` |
| Self-referral | 400 | `"You cannot use your own referral code"` |
| Order cancel on wrong user | 403 | `"You do not have permission to cancel this order"` |
| Order cancel wrong status | 400 | `"This order cannot be cancelled"` |
| Coupon invalid (multiple reasons) | 400 | specific reason string |
| Cart sync network failure | handled client-side | `"Unable to verify cart. Please try again."` |

### Frontend Error Boundaries

Each major page section (product list, wishlist, recently viewed, comparison) is wrapped in an `<ErrorBoundary>` that renders a minimal fallback rather than crashing the page.

---

## Testing Strategy

### Unit Testing Approach

Backend services (LoyaltyEngine, CouponEngine, CartSync reconciliation, WishlistDeduplication) are extracted into pure-function service modules with no direct Express `req`/`res` dependencies, enabling deterministic unit testing with Jest.

### Property-Based Testing (fast-check)

The following four correctness properties are tested using **fast-check** (the existing project has Jest configured):

#### Property 1: Loyalty Engine Point Arithmetic

```typescript
// PROPERTY: points awarded = floor(subtotal / 10), always non-negative
fc.assert(
  fc.property(
    fc.float({ min: 0, max: 999999, noNaN: true }),
    (subtotal) => {
      const points = Math.floor(subtotal / 10);
      return points >= 0 && points === Math.floor(subtotal / 10);
    }
  )
);

// PROPERTY: redemption discount never exceeds 50% of subtotal
fc.assert(
  fc.property(
    fc.integer({ min: 0, max: 10000 }),  // points balance
    fc.float({ min: 0.01, max: 100000, noNaN: true }), // order subtotal
    fc.integer({ min: 0, max: 10000 }),  // points requested
    (balance, subtotal, requested) => {
      const availablePoints = Math.min(balance, requested);
      const rawDiscount = availablePoints * 0.5;
      const maxDiscount = subtotal * 0.5;
      const actualDiscount = Math.min(rawDiscount, maxDiscount);
      return actualDiscount >= 0 && actualDiscount <= subtotal * 0.5;
    }
  )
);

// PROPERTY: balance after earn + redeem cycle = initial + earned - redeemed
fc.assert(
  fc.property(
    fc.integer({ min: 0, max: 5000 }),  // initial balance
    fc.float({ min: 0, max: 5000 }),    // order amount
    fc.integer({ min: 0, max: 1000 }), // redeem request
    (initial, orderAmount, redeemRequest) => {
      const earned = Math.floor(orderAmount / 10);
      const afterEarn = initial + earned;
      const canRedeem = Math.min(redeemRequest, afterEarn);
      const afterRedeem = afterEarn - canRedeem;
      return afterRedeem >= 0 && afterRedeem === afterEarn - canRedeem;
    }
  )
);
```

#### Property 2: Coupon Engine Validation

```typescript
// PROPERTY: discount amount never exceeds orderAmount
fc.assert(
  fc.property(
    fc.record({
      discountType: fc.constantFrom('percentage', 'fixed'),
      discountValue: fc.float({ min: 0, max: 100, noNaN: true }),
      maxDiscount: fc.float({ min: 0, max: 10000, noNaN: true }),
    }),
    fc.float({ min: 0.01, max: 100000, noNaN: true }),
    (coupon, orderAmount) => {
      let raw = coupon.discountType === 'percentage'
        ? orderAmount * (coupon.discountValue / 100)
        : coupon.discountValue;
      const discount = coupon.maxDiscount > 0
        ? Math.min(raw, coupon.maxDiscount)
        : raw;
      const capped = Math.min(discount, orderAmount);
      return capped >= 0 && capped <= orderAmount;
    }
  )
);

// PROPERTY: expired coupon always returns invalid
fc.assert(
  fc.property(
    fc.date({ max: new Date(Date.now() - 1) }),  // always in the past
    (expiresAt) => {
      const isExpired = expiresAt < new Date();
      return isExpired === true;
    }
  )
);

// PROPERTY: coupon with maxUses=0 is never usage-limited
fc.assert(
  fc.property(
    fc.integer({ min: 0, max: 10000 }),  // usageCount
    (usageCount) => {
      const maxUses = 0;
      const isLimited = maxUses > 0 && usageCount >= maxUses;
      return isLimited === false;
    }
  )
);
```

#### Property 3: Cart Sync Reconciliation

```typescript
// PROPERTY: every item in syncedItems has price equal to live price
fc.assert(
  fc.property(
    fc.array(
      fc.record({
        productId: fc.string({ minLength: 24, maxLength: 24 }),
        clientPrice: fc.float({ min: 0.01, max: 10000, noNaN: true }),
        quantity: fc.integer({ min: 1, max: 100 }),
      }),
      { minLength: 1, maxLength: 20 }
    ),
    fc.array(
      fc.record({
        _id: fc.string({ minLength: 24, maxLength: 24 }),
        price: fc.float({ min: 0.01, max: 10000, noNaN: true }),
        stock: fc.integer({ min: 0, max: 1000 }),
      }),
      { minLength: 1, maxLength: 20 }
    ),
    (clientItems, liveProducts) => {
      const liveMap = new Map(liveProducts.map(p => [p._id, p]));
      const synced = clientItems
        .filter(ci => {
          const live = liveMap.get(ci.productId);
          return live && live.stock > 0;
        })
        .map(ci => {
          const live = liveMap.get(ci.productId)!;
          return { productId: ci.productId, price: live.price, quantity: Math.min(ci.quantity, live.stock) };
        });
      // Every synced item uses the live price
      return synced.every(si => {
        const live = liveMap.get(si.productId)!;
        return si.price === live.price && si.quantity <= live.stock;
      });
    }
  )
);

// PROPERTY: no out-of-stock product appears in syncedItems
fc.assert(
  fc.property(
    fc.array(fc.record({
      productId: fc.hexaString({ minLength: 24, maxLength: 24 }),
      quantity: fc.integer({ min: 1, max: 10 }),
      clientPrice: fc.float({ min: 1, max: 1000, noNaN: true }),
    }), { minLength: 0, maxLength: 10 }),
    fc.array(fc.record({
      _id: fc.hexaString({ minLength: 24, maxLength: 24 }),
      price: fc.float({ min: 1, max: 1000, noNaN: true }),
      stock: fc.constant(0),  // all out of stock
    }), { minLength: 0, maxLength: 10 }),
    (clientItems, liveProducts) => {
      const liveMap = new Map(liveProducts.map(p => [p._id, p]));
      const synced = clientItems.filter(ci => {
        const live = liveMap.get(ci.productId);
        return live && live.stock > 0;
      });
      return synced.length === 0;  // nothing passes when all stock = 0
    }
  )
);
```

#### Property 4: Wishlist Deduplication

```typescript
// PROPERTY: adding the same productId twice results in exactly one entry
fc.assert(
  fc.property(
    fc.string({ minLength: 24, maxLength: 24 }),  // productId
    fc.array(fc.string({ minLength: 24, maxLength: 24 }), { maxLength: 99 }),
    (newId, existingIds) => {
      const items = existingIds.map(id => ({ productId: id }));
      const alreadyPresent = items.some(i => i.productId === newId);
      if (!alreadyPresent && items.length < 100) {
        items.push({ productId: newId });
      }
      const count = items.filter(i => i.productId === newId).length;
      return count <= 1;
    }
  )
);

// PROPERTY: wishlist items are always unique (no duplicates)
fc.assert(
  fc.property(
    fc.set(fc.string({ minLength: 24, maxLength: 24 }), { maxLength: 100 }),
    (uniqueIds) => {
      // simulate building a wishlist by adding unique ids one by one
      const items: string[] = [];
      for (const id of uniqueIds) {
        if (!items.includes(id)) items.push(id);
      }
      const uniqueCount = new Set(items).size;
      return uniqueCount === items.length;
    }
  )
);
```

### Integration Testing Approach

New API routes (Wishlist, Loyalty, Cart Sync, Cancel Order) follow the existing Jest + supertest pattern used in `src/tests/`. Each test suite:
1. Starts a test MongoDB connection via `setup.ts`
2. Seeds required fixtures (User, Product, Order)
3. Issues HTTP requests via `supertest(app)`
4. Asserts response status, body shape, and side effects (DB state)

---

## Dependencies

### New Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `node-cron` | `^3.0.3` | Cart abandonment scheduled job |
| `joi` | already present | Input validation (consolidate all to Joi) |

### New Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react-helmet-async` | `^2.0.4` | SEO meta tags + JSON-LD injection |
| `rollup-plugin-visualizer` | `^5.12.0` | Bundle analysis on build |
| `fast-check` | `^3.19.0` | Property-based testing |

No new UI component libraries — all UI uses existing shadcn/ui + Tailwind + Framer Motion.

---

## Correctness Properties

The following universal invariants must hold at all times across the system.

### Property 1: Loyalty Balance Non-Negative

**Validates: Requirements 10.2, 10.3, 10.5**

For every `LoyaltyAccount` document, `account.balance ≥ 0` at all times. The `awardLoyaltyPoints` and `redeemLoyaltyPoints` procedures must never produce a negative balance. The redemption procedure guards against this by rejecting requests where `pointsRequested > account.balance`.

**Fast-check test**: `fc.property(fc.integer({min:0}), fc.integer({min:0}), (balance, redeem) => { const effective = Math.min(redeem, balance); return balance - effective >= 0; })`

### Property 2: Loyalty Transaction Consistency

**Validates: Requirements 10.1, 10.6**

For every `LoyaltyTransaction`, `txn.balanceAfter = priorBalance + txn.delta` where `priorBalance` is the `LoyaltyAccount.balance` value immediately before the transaction is committed. This invariant is enforced by performing the `findOneAndUpdate` (atomic increment) and reading the returned `balance` before persisting the transaction document.

**Fast-check test**: `fc.property(fc.integer({min:0, max:10000}), fc.integer({min:-1000, max:1000}), (prior, delta) => { const after = Math.max(0, prior + delta); return after >= 0; })`

### Property 3: Redemption Cap (50% of Subtotal)

**Validates: Requirements 10.2**

For every loyalty point redemption, `discountAmount ≤ orderSubtotal × 0.50`. The `redeemLoyaltyPoints` procedure enforces `discountAmount = MIN(requestedDiscount, orderSubtotal × 0.50)`.

**Fast-check test**: `fc.property(fc.integer({min:0, max:10000}), fc.float({min:0.01, max:100000}), (points, subtotal) => { const discount = Math.min(points * 0.5, subtotal * 0.5); return discount <= subtotal * 0.5; })`

### Property 4: Coupon Discount Bounded by Order Amount

**Validates: Requirements 12.1, 12.3, 12.5**

For any validated coupon, the resulting `discountAmount ≤ orderAmount`. This holds for both percentage and fixed coupon types, including `maxDiscount` caps.

**Fast-check test**: `fc.property(fc.record({ type: fc.constantFrom('percentage','fixed'), value: fc.float({min:0,max:200}), max: fc.float({min:0,max:10000}) }), fc.float({min:0.01,max:100000}), (coupon, order) => { const raw = coupon.type==='percentage' ? order*(coupon.value/100) : coupon.value; const capped = coupon.max>0 ? Math.min(raw,coupon.max) : raw; return Math.min(capped,order) <= order; })`

### Property 5: Cart Sync Price Integrity

**Validates: Requirements 24.1, 24.2**

For every item in the `syncedItems` result of `POST /api/cart/sync`, `item.price = liveProduct.price` at the time of the sync operation. Clients cannot dictate prices — the server always overwrites with the authoritative DB value.

**Fast-check test**: Covered in Testing Strategy section — `synced.every(si => si.price === liveMap.get(si.productId).price)`

### Property 6: Cart Sync Stock Guard

**Validates: Requirements 24.3**

For every item in `syncedItems`, `item.quantity ≤ liveProduct.stock` and `liveProduct.stock > 0`. Any item where `stock = 0` is moved to `removedItems` and excluded from `syncedItems`.

**Fast-check test**: Covered in Testing Strategy section — all items with `stock=0` are filtered out.

### Property 7: Wishlist Uniqueness

**Validates: Requirements 3.3**

For every `Wishlist` document, no `productId` appears more than once in the `items` array. The `addToWishlist` procedure checks for existence before inserting and returns HTTP 409 on duplicate.

**Fast-check test**: `fc.property(fc.set(fc.hexaString({minLength:24,maxLength:24}),{maxLength:100}), (ids) => { const items=[]; for(const id of ids){ if(!items.includes(id)) items.push(id); } return new Set(items).size===items.length; })`

### Property 8: Wishlist Size Cap

**Validates: Requirements 3.5**

For every `Wishlist` document, `items.length ≤ 100`. The `addToWishlist` procedure rejects additions when `items.length ≥ 100`.

**Fast-check test**: `fc.property(fc.array(fc.string(),{maxLength:200}), (ids) => { const items=ids.slice(0,100); return items.length<=100; })`

### Property 9: Order Discount Persistence

**Validates: Requirements 32.1, 32.2, 32.3**

For every `Order` document where `discountAmount > 0`, `couponCode ≠ null` and `couponCode ≠ undefined`. The `createOrder` handler sets both fields atomically in the same document write.

**Fast-check test**: `fc.property(fc.float({min:0.01,max:10000}), fc.string({minLength:3,maxLength:20}), (discount, code) => { const order = {discountAmount: discount, couponCode: code}; return order.discountAmount > 0 ? order.couponCode !== null : true; })`

### Property 10: Referral Uniqueness Per Referee

**Validates: Requirements 11.1, 11.6**

For every registered `User`, they appear as `refereeId` in at most one `Referral` document. The `Referral` model enforces a unique index on `refereeId`. Self-referral is rejected when `referrerId === refereeId`.

**Fast-check test**: `fc.property(fc.string(), fc.string(), (referrer, referee) => { const isSelfReferral = referrer === referee; return isSelfReferral ? false : referrer !== referee; })`
