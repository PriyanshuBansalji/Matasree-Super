# Bugfix Requirements Document

## Introduction

This document covers 10 confirmed bugs and missing features across the Matasree Super Masale full-stack store. The issues span frontend components that are implemented but never mounted, API response shape mismatches causing silent empty states, missing admin UI for existing backend features, and a product image system that is partially wired but not exposed. Each bug is documented with its precise trigger condition so that fixes can be validated systematically.

---

## Bug Analysis

### Bug 1 — ComparisonTray Not Visible

#### Current Behavior (Defect)

1.1 WHEN a user adds products to the comparison tray on any page THEN the system does not render the `ComparisonTray` component because it is never mounted in `App.tsx` or any layout component

1.2 WHEN `comparisonStore` holds one or more products THEN the system shows no visible tray UI anywhere in the site

#### Expected Behavior (Correct)

2.1 WHEN `comparisonStore.items.length > 0` THEN the system SHALL render `ComparisonTray` as a fixed bottom overlay accessible from every page

2.2 WHEN `ComparisonTray` is mounted in `App.tsx` alongside `WhatsAppFAB` THEN the system SHALL display the collapsed tray bar at the bottom of every route

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN `comparisonStore.items.length === 0` THEN the system SHALL CONTINUE TO render nothing (the tray self-hides when empty)

3.2 WHEN products are added or removed from comparison THEN the system SHALL CONTINUE TO update the store state correctly via `addProduct` / `removeProduct`

---

### Bug 2 — ExitIntentModal Not Firing

#### Current Behavior (Defect)

1.1 WHEN a user moves their mouse toward the top of the browser window (exit intent) THEN the system does not show the `ExitIntentModal` because the component is never mounted in `App.tsx` or any page

1.2 WHEN a user has items in their cart and attempts to leave the page THEN the system does not present the discount code offer

#### Expected Behavior (Correct)

2.1 WHEN `ExitIntentModal` is mounted with `active={cartItemCount > 0}` in `App.tsx` or a persistent layout wrapper THEN the system SHALL detect the `mouseleave` event toward the top of the viewport and open the modal

2.2 WHEN the modal fires THEN the system SHALL display the discount code `EXIT10` with a 30-minute countdown timer

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN the modal has already been shown in the current session (`sessionStorage` flag is set) THEN the system SHALL CONTINUE TO suppress re-triggering

3.2 WHEN `active` is `false` (cart is empty) THEN the system SHALL CONTINUE TO attach no `mouseleave` listener

---

### Bug 3 — RecentlyViewedSection: Wrong Response Shape for Authenticated Users

#### Current Behavior (Defect)

1.1 WHEN an authenticated user visits a page with `RecentlyViewedSection` THEN the system calls `GET /api/products/recently-viewed` which returns `{ success, data: [{ product: {...}, viewedAt }] }` but the component reads `res?.data?.data ?? res?.data` as a flat product array and then filters on `p._id`, which is `undefined` for the `{ product, viewedAt }` shape — resulting in an empty list

1.2 WHEN the backend returns recently-viewed entries in the `{ product, viewedAt }` wrapper format THEN the system renders no product cards even when the user has a valid view history

#### Expected Behavior (Correct)

2.1 WHEN `GET /api/products/recently-viewed` returns `[{ product: ProductData, viewedAt: string }]` THEN the system SHALL unwrap the `product` field from each entry before storing in state

2.2 WHEN the unwrapped product array is non-empty after filtering out `currentProductId` THEN the system SHALL render the recently-viewed product cards

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN a guest user has viewed products stored in `localStorage` THEN the system SHALL CONTINUE TO fetch each product individually and display them using the existing guest fallback path

3.2 WHEN `currentProductId` is provided THEN the system SHALL CONTINUE TO filter out the current product from the displayed list for both authenticated and guest users

---

### Bug 4 — TestimonialsSection: API Response Unwrap Error

#### Current Behavior (Defect)

1.1 WHEN `GET /api/reviews/featured` is called, the Axios interceptor strips the outer `AxiosResponse` wrapper so the query data is already `{ success, data: [...], statusCode }` THEN the component reads `reviewsData?.data?.data` (triple-nested) instead of `reviewsData?.data` (double-nested), resulting in `undefined` for `dynamicReviews`

1.2 WHEN `dynamicReviews` evaluates to `[]` (due to the unwrap error) THEN the system falls back to `fallbackTestimonials` and always shows static data even when real approved reviews exist in the database

#### Expected Behavior (Correct)

2.1 WHEN the `featured-reviews` query resolves THEN the system SHALL read `reviewsData?.data` (not `reviewsData?.data?.data`) to obtain the reviews array

2.2 WHEN real approved reviews exist THEN the system SHALL render dynamic review data from the API instead of the static fallback

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN no approved featured reviews exist in the database THEN the system SHALL CONTINUE TO display the `fallbackTestimonials` static data

3.2 WHEN the `GET /api/reviews/featured` request fails THEN the system SHALL CONTINUE TO render the fallback testimonials without crashing

---

### Bug 5 — AdminProducts: No Multi-Image Upload Support

#### Current Behavior (Defect)

1.1 WHEN an admin opens the Add/Edit Product form in `AdminProducts.tsx` THEN the system only shows a single image upload field bound to `formData.image` (a `string`), with no way to upload additional images

1.2 WHEN the admin submits a product THEN the system sends only the `image` field; the `images[]` array field that exists on the `Product` model is never populated

1.3 WHEN the `Product` model schema has `images: [String]` defined THEN the system does not use or expose this field anywhere in the admin UI

#### Expected Behavior (Correct)

2.1 WHEN an admin is creating or editing a product THEN the system SHALL provide a multi-image upload UI that allows uploading and managing multiple images stored in `formData.images[]`

2.2 WHEN the admin submits a product with additional images THEN the system SHALL include the `images[]` array in the API payload sent to `POST /api/products` or `PUT /api/products/:id`

2.3 WHEN the `productSchema` in `productController.ts` validates the request body THEN the system SHALL accept an optional `images` array of strings

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN the admin uploads a primary image using the existing single-image upload THEN the system SHALL CONTINUE TO store it in the `image` field as before

3.2 WHEN an existing product has no `images[]` array THEN the system SHALL CONTINUE TO display and function correctly using only the `image` field

---

### Bug 6 — SeasonalBannerSlot: No Admin UI to Manage Banners

#### Current Behavior (Defect)

1.1 WHEN an admin navigates to the admin dashboard THEN the system shows no link, route, or UI for managing seasonal banners even though the backend fully supports `GET/POST/PUT/DELETE /api/admin/banners`

1.2 WHEN an admin wants to create, update, or delete a seasonal banner THEN the system provides no frontend interface — banners can only be managed directly via the API

1.3 WHEN `App.tsx` defines admin routes THEN there is no `/admin/banners` route registered

#### Expected Behavior (Correct)

2.1 WHEN an admin navigates to `/admin/banners` THEN the system SHALL render an `AdminBanners` page with a list of existing banners and a form to create/edit/delete them

2.2 WHEN the admin dashboard quick links are displayed THEN the system SHALL include a "Manage Banners" card linking to `/admin/banners`

2.3 WHEN a banner is created or updated via the admin UI THEN the system SHALL call `POST /api/admin/banners` or `PUT /api/admin/banners/:id` with `{ image, title, subtitle, ctaLink, ctaText, activeFrom, activeTo }`

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN `GET /api/admin/banners` is called (public endpoint) THEN the system SHALL CONTINUE TO return all banners for client-side date filtering

3.2 WHEN `SeasonalBannerSlot` fetches and filters banners by date range THEN the system SHALL CONTINUE TO display the active banner on the homepage without changes

---

### Bug 7 — RecipesPage: API Response Unwrap Error Causes Empty Recipe List

#### Current Behavior (Defect)

1.1 WHEN `GET /api/admin/recipes` responds, the Axios interceptor strips the outer layer so query data is `{ success, data: { recipes, pagination }, statusCode }` THEN `RecipesPage` reads `(data as any)?.data?.recipes` which correctly accesses `data.recipes` — **this path is actually correct**; however the fallback `(data as any)?.recipes` would be wrong. The issue is that when `isLoading` is true and no data exists, the page shows skeletons but when `isError` is true it shows the error state — the page is structurally sound

1.2 WHEN no recipes have been added via the admin panel THEN the system renders "No recipes found" which appears broken to users who expect content

#### Expected Behavior (Correct)

2.1 WHEN `GET /api/admin/recipes` returns recipes THEN the system SHALL correctly read `data?.data?.recipes` and display the recipe cards

2.2 WHEN the page has never had recipes seeded THEN the system SHALL display a clear empty state with a prompt to add recipes via the admin panel

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN the API call succeeds with recipes THEN the system SHALL CONTINUE TO render recipe cards with region filtering and tag search

---

### Bug 8 — OrderDetailPage: Response Shape Unwrap May Produce Blank Render

#### Current Behavior (Defect)

1.1 WHEN `useOrder(id)` calls `GET /api/orders/:id`, the Axios interceptor returns `{ success, data: order, statusCode }` and `OrderDetailPage` derives `order = (orderResponse as any)?.data` which is correct — however if the backend returns `{ success, data: { order } }` (nested) then `order` would be `{ order: {...} }` and all field accesses like `order._id`, `order.items`, `order.orderstatus` would return `undefined`, causing a blank/broken render

1.2 WHEN `order.orderstatus` is read but the actual field at that path is `undefined` due to a nesting mismatch THEN the system renders `orderstatus` as `'pending'` (default) but `order.items` as `[]` and `order.totalAmount` as `0`, resulting in a page that renders but shows incorrect/empty data

#### Expected Behavior (Correct)

2.1 WHEN `GET /api/orders/:id` responds with `{ success, data: order }` THEN the system SHALL unwrap `orderResponse.data` once to get the order object

2.2 WHEN the order object is correctly unwrapped THEN the system SHALL display the correct `orderstatus`, `items`, `totalAmount`, `shippingAddress`, and `paymentStatus` fields

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN the order ID does not exist or the API returns an error THEN the system SHALL CONTINUE TO display the "Order not found" error card

3.2 WHEN `OrderTimeline` receives the correct `currentStatus` prop THEN the system SHALL CONTINUE TO render the status progression correctly

---

### Bug 9 — ProfilePage: Referral API Endpoints May Not Exist

#### Current Behavior (Defect)

1.1 WHEN `ProfilePage` mounts for an authenticated user THEN the system calls `GET /api/referral/my-code` and `GET /api/referral/history` in parallel; if these routes do not exist in the backend routing, both calls fail with 404 and `referralError` is set, displaying "Unable to load referral information"

1.2 WHEN referral API calls return 404 or an auth error THEN the system shows the error state in the referral section and the page appears broken to the user

#### Expected Behavior (Correct)

2.1 WHEN an authenticated user visits `/profile` THEN the system SHALL successfully call `GET /api/referral/my-code` and `GET /api/referral/history` and display the referral code and history

2.2 WHEN the referral routes exist and respond THEN the system SHALL render the referral code display and the referral history table

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user has no referrals THEN the system SHALL CONTINUE TO display the empty referral history state with the "No referrals yet" message

3.2 WHEN the user's profile info (`user.name`, `user.email`) is loaded from `authStore` THEN the system SHALL CONTINUE TO display the account information card without API calls

---

### Bug 10 — AdminDashboard: No Banner Management Navigation Link

#### Current Behavior (Defect)

1.1 WHEN an admin views the quick links grid on `AdminDashboard` THEN the system shows cards for Users, Products, Categories, and Orders but no card or link for managing Seasonal Banners

1.2 WHEN an admin wants to manage seasonal banners THEN the system provides no navigation path from the admin dashboard to any banner management page

#### Expected Behavior (Correct)

2.1 WHEN the admin dashboard quick links section is rendered THEN the system SHALL include a "Manage Banners" card that navigates to `/admin/banners`

2.2 WHEN `/admin/banners` is visited by an admin THEN the system SHALL render the banner management UI protected by `AdminRoute`

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN the existing four quick-link cards (Users, Products, Categories, Orders) are rendered THEN the system SHALL CONTINUE TO navigate to their respective routes without change

3.2 WHEN a non-admin user attempts to visit `/admin/banners` THEN the system SHALL CONTINUE TO redirect them via the existing `AdminRoute` guard

---

## Bug Condition Derivation

### Bug Condition Functions

```pascal
FUNCTION isBugCondition_ComparisonTray(context)
  INPUT: context.comparisonItemCount >= 1
  OUTPUT: boolean
  RETURN App.tsx does NOT render <ComparisonTray />
END FUNCTION

FUNCTION isBugCondition_ExitIntentModal(context)
  INPUT: context.cartItemCount >= 1 AND user moves mouse to top viewport
  OUTPUT: boolean
  RETURN App.tsx does NOT render <ExitIntentModal active={...} />
END FUNCTION

FUNCTION isBugCondition_RecentlyViewed(request)
  INPUT: request is authenticated GET /products/recently-viewed
  OUTPUT: boolean
  RETURN response items have shape { product, viewedAt } (not flat product objects)
END FUNCTION

FUNCTION isBugCondition_Testimonials(response)
  INPUT: reviewsData from useQuery('featured-reviews')
  OUTPUT: boolean
  RETURN component reads reviewsData?.data?.data instead of reviewsData?.data
END FUNCTION

FUNCTION isBugCondition_MultiImage(adminAction)
  INPUT: admin submits product form
  OUTPUT: boolean
  RETURN formData has no images[] field AND payload omits images array
END FUNCTION

FUNCTION isBugCondition_BannerAdmin(adminNav)
  INPUT: admin is on dashboard or navigates to /admin/banners
  OUTPUT: boolean
  RETURN no AdminBanners page exists AND no route registered in App.tsx
END FUNCTION
```

### Preservation Goals

```pascal
// For all non-buggy inputs: fixed behavior = original behavior
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR
```

Key preserved behaviors:
- Guest recently-viewed localStorage flow unchanged
- Static testimonial fallback unchanged
- Single product image upload unchanged
- SeasonalBannerSlot frontend display unchanged
- All existing admin routes (users/products/categories/orders) unchanged
- OrderDetailPage error state unchanged
- ProfilePage account info display unchanged
