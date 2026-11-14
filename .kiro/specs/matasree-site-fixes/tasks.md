# Implementation Plan

## Tasks

## Overview

10 bugs are fixed across five task groups. The exploratory and preservation tests come first so that bug conditions are verified before any code is changed, and regressions are baselined before the fix is applied.

---

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Unmounted Components, Response Unwraps, and Missing Admin UI
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate each bug condition
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to each concrete failing case
  - Bug 1 — add one product to `comparisonStore`, assert `document.querySelector('[data-testid="comparison-tray"]')` returns `null` (confirms `ComparisonTray` is not mounted)
  - Bug 2 — add one item to `cartStore`, navigate to `/products`, dispatch a `mouseleave` event toward the top viewport, assert no modal appears (confirms `ExitIntentModal` is not globally mounted)
  - Bug 3 — call `fetchForLoggedIn` with a mocked API response of `{ data: [{ product: { _id: 'p1', name: 'Cumin', price: 120 }, viewedAt: '' }] }`, assert that the `products` state array is empty or contains items where `name` is `undefined` (confirms incorrect `.filter(p => p._id)` on wrapped shape)
  - Bug 4 — mock `useQuery('featured-reviews')` returning `{ data: [{ _id: 'r1', name: 'Priya', rating: 5, comment: 'Great!' }] }`, assert `dynamicReviews` is `[]` due to `reviewsData?.data?.data` being `undefined` (confirms triple-nesting bug)
  - Bug 8 — mock `useOrder` returning `{ data: { order: { _id: 'o1', orderstatus: 'shipped', items: [{ name: 'Turmeric', price: 100, quantity: 2 }] } } }`, assert `order.items` is `undefined` on the page (confirms insufficient unwrap chain)
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct — it proves the bugs exist)
  - Document counterexamples found to understand root cause
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2 (Bug 1), 1.1, 1.2 (Bug 2), 1.1, 1.2 (Bug 3), 1.1, 1.2 (Bug 4), 1.1, 1.2 (Bug 8)_

---

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing behaviors that must not regress after any fix
  - **IMPORTANT**: Follow observation-first methodology — run UNFIXED code with non-buggy inputs, observe outputs, then encode assertions
  - Observe: `comparisonStore.items.length === 0` → `ComparisonTray` renders `null` on unfixed code — write property: for all empty-store states, `ComparisonTray` produces no DOM output
  - Observe: `active={false}` passed to `ExitIntentModal` → no `mouseleave` listener attached on unfixed code — write property: when `cartStore.items` is empty, no modal fires on any route
  - Observe: guest path in `RecentlyViewedSection` reads `localStorage` and calls `apiClient.getProductById` per item — this code path is entirely unchanged; write property: for any unauthenticated user the `fetchForGuest` function runs unmodified
  - Observe: `TestimonialsSection` falls back to `fallbackTestimonials` when the API returns 0 items — write property: an empty `data` array from the query still renders static fallback testimonials
  - Observe: `AdminProducts` primary `image` field uploads to `/uploads/products/` and is stored as `formData.image` string — write property: single-image submit payload always includes `image` field with the uploaded path
  - Observe: `SeasonalBannerSlot` fetches `GET /api/admin/banners` and filters by date client-side — write property: the fetch URL and filter logic are unchanged after adding `AdminBanners` page
  - Observe: all four existing admin quick-link cards (`/admin/users`, `/admin/products`, `/admin/categories`, `/admin/orders`) navigate to their respective routes — write property: clicking each card routes to the correct path after adding the fifth card
  - Observe: `OrderDetailPage` shows "Order not found" card when `isError` is true or `order` is falsy — write property: error state renders correctly regardless of unwrap chain changes
  - Verify all these property tests PASS on UNFIXED code (baseline captured)
  - _Requirements: 3.1, 3.2 (Bug 1), 3.1, 3.2 (Bug 2), 3.1, 3.2 (Bug 3), 3.1, 3.2 (Bug 4), 3.1, 3.2 (Bug 5), 3.1, 3.2 (Bug 6), 3.1, 3.2 (Bug 8), 3.1, 3.2 (Bug 10)_

---

## Task Group 1: Unmounted Components (App.tsx)

- [x] 3. Fix Bug 1 and Bug 2 — Mount ComparisonTray and ExitIntentModal globally in App.tsx

  - [x] 3.1 Mount ComparisonTray globally
    - File: `matasree-superstore-main/src/App.tsx`
    - Add lazy import: `const ComparisonTray = lazy(() => import('./components/ComparisonTray'));`
    - Inside `<BrowserRouter>`, render `<ComparisonTray />` as a sibling immediately after `<WhatsAppFAB />` and before `<Suspense fallback={<PageLoader />}>`
    - `ComparisonTray` returns `null` when `items.length === 0` so it is safe to mount unconditionally — no conditional wrapper needed
    - _Bug_Condition: isBugCondition_ComparisonTray(context) where context.comparisonItemCount >= 1 AND <ComparisonTray /> NOT in React tree_
    - _Expected_Behavior: comparisonStore.items.length > 0 → fixed collapsed tray bar visible at bottom of every route_
    - _Preservation: comparisonStore.items.length === 0 → ComparisonTray returns null, no visible change_
    - _Requirements: 2.1, 2.2, 3.1, 3.2 (Bug 1)_

  - [x] 3.2 Mount ExitIntentModal globally via a GlobalModals inner component
    - File: `matasree-superstore-main/src/App.tsx`
    - Add import: `import { useCartStore } from './store/cartStore';`
    - Add lazy import: `const ExitIntentModal = lazy(() => import('./components/ExitIntentModal'));`
    - Define a `GlobalModals` inner component (must live inside `<BrowserRouter>` so `useLocation` works):
      ```tsx
      const GlobalModals = () => {
        const cartItems = useCartStore((s) => s.items);
        const { pathname } = useLocation();
        return <ExitIntentModal active={cartItems.length > 0 && pathname !== '/checkout'} />;
      };
      ```
    - Render `<GlobalModals />` inside `<BrowserRouter>` after `<ComparisonTray />`
    - _Bug_Condition: isBugCondition_ExitIntentModal(context) where cartItemCount >= 1 AND currentPage NOT '/checkout' AND ExitIntentModal NOT in App.tsx_
    - _Expected_Behavior: any non-checkout page with cart items fires modal on mouseleave toward top viewport_
    - _Preservation: active=false (empty cart) → no mouseleave listener attached; session flag suppresses re-trigger_
    - _Requirements: 2.1, 2.2, 3.1, 3.2 (Bug 2)_

  - [x] 3.3 Verify Bug Condition exploration test now passes
    - **Property 1: Expected Behavior** - Globally Mounted Components Render
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run exploration tests for Bug 1 and Bug 2 from step 1
    - **EXPECTED OUTCOME**: Tests PASS (confirms ComparisonTray and ExitIntentModal are globally mounted)
    - _Requirements: 2.1, 2.2 (Bug 1), 2.1, 2.2 (Bug 2)_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Unmounted Component Side Effects
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run all preservation tests related to Bug 1 and Bug 2 from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in empty-store and WhatsAppFAB behavior)

---

## Task Group 2: API Response Shape Fixes

- [x] 4. Fix Bug 3 — Fix RecentlyViewedSection authenticated response unwrap

  - [x] 4.1 Unwrap `{ product, viewedAt }` wrapper in fetchForLoggedIn
    - File: `matasree-superstore-main/src/components/RecentlyViewedSection.tsx`
    - In `fetchForLoggedIn`, change the lines after getting `rawArr`:
      - **BEFORE**: `const arr: any[] = raw?.data?.data ?? raw?.data ?? [];`
      - **AFTER**: add `const rawArr: any[] = raw?.data?.data ?? raw?.data ?? [];` then `const arr = rawArr.map((item: any) => item.product ?? item).filter(Boolean)`
    - The `getRecentlyViewed` backend endpoint returns `[{ product: ProductData, viewedAt }]` — the `.map(item => item.product ?? item)` extracts the `ProductData` object and the `.filter(Boolean)` drops any nulls (deleted products)
    - The existing `.filter((p: any) => p._id !== currentProductId).slice(0, 10)` filter on `arr` continues to work correctly on the now-flat `ProductData[]`
    - Only `fetchForLoggedIn` is changed — the guest path (`fetchForGuest`) is entirely untouched
    - _Bug_Condition: isBugCondition_RecentlyViewed: isAuthenticated AND response shape is [{product, viewedAt}] AND component does NOT map(item => item.product)_
    - _Expected_Behavior: unwrapped ProductData[] stored in state; non-empty product cards rendered_
    - _Preservation: guest localStorage path entirely unchanged; currentProductId filtering works for both paths_
    - _Requirements: 2.1, 2.2, 3.1, 3.2 (Bug 3)_

  - [x] 4.2 Verify Bug Condition exploration test now passes (recently viewed)
    - **Property 1: Expected Behavior** - Recently Viewed Unwrap for Authenticated Users
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - Run Bug 3 exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms `products` state contains valid `ProductData` objects)
    - _Requirements: 2.1, 2.2 (Bug 3)_

  - [x] 4.3 Verify preservation tests still pass (recently viewed)
    - **Property 2: Preservation** - Recently Viewed Guest Path
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation tests for Bug 3 from step 2
    - **EXPECTED OUTCOME**: Tests PASS (guest path unchanged)

- [x] 5. Fix Bug 4 — Fix TestimonialsSection response unwrap (remove extra .data)

  - [x] 5.1 Fix triple-nested access to reviewsData
    - File: `matasree-superstore-main/src/components/TestimonialsSection.tsx`
    - Locate line: `const reviews = reviewsData?.data?.data || [];`
    - Change to: `const reviews = reviewsData?.data || [];`
    - After the Axios interceptor strips the `AxiosResponse` wrapper, `reviewsData` is `{ success, data: [ReviewData...], statusCode }`. Therefore `reviewsData?.data` is the reviews array directly — the extra `.data` was causing `undefined`
    - Also verify the `useQuery` `queryFn` calls `apiClient.getFeaturedReviews()` which maps to `GET /api/reviews/featured` — no change needed if already correct
    - _Bug_Condition: isBugCondition_Testimonials: reviewsData?.data is an array AND component reads reviewsData?.data?.data (extra nesting → undefined)_
    - _Expected_Behavior: reviewsData?.data returns the reviews array; dynamic reviews rendered when DB has approved featured reviews_
    - _Preservation: empty API response still shows fallbackTestimonials; API error still shows fallback without crash_
    - _Requirements: 2.1, 2.2, 3.1, 3.2 (Bug 4)_

  - [x] 5.2 Verify Bug Condition exploration test now passes (testimonials)
    - **Property 1: Expected Behavior** - Testimonials API Read at Correct Nesting Level
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - Run Bug 4 exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms `dynamicReviews` is populated and dynamic data is rendered)
    - _Requirements: 2.1, 2.2 (Bug 4)_

  - [x] 5.3 Verify preservation tests still pass (testimonials)
    - **Property 2: Preservation** - Testimonials Static Fallback
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation tests for Bug 4 from step 2
    - **EXPECTED OUTCOME**: Tests PASS (fallbackTestimonials still shown when data array is empty)

- [x] 6. Fix Bug 8 — Harden OrderDetailPage response unwrap

  - [x] 6.1 Add third-level fallback to order unwrap chain
    - File: `matasree-superstore-main/src/pages/OrderDetailPage.tsx`
    - Locate line ~85: `const order = (orderResponse as any)?.data ?? (orderResponse as any);`
    - Change to: `const order = (orderResponse as any)?.data?.order ?? (orderResponse as any)?.data ?? (orderResponse as any);`
    - This handles the current shape `{ success, data: IOrder }` (second term), any future shape `{ success, data: { order: IOrder } }` (first term), and the bare response fallback (third term)
    - The `orderstatus` field (snake_case) matches the `IOrder` Mongoose schema — no change needed there
    - _Bug_Condition: isBugCondition_OrderDetail: orderResponse?.data is defined AND orderResponse?.data?._id is undefined (doubly-nested order)_
    - _Expected_Behavior: hardened unwrap chain correctly extracts IOrder document; all fields (orderstatus, items, totalAmount, shippingAddress, paymentStatus) display correctly_
    - _Preservation: isError=true or missing order → "Order not found" error card unchanged; OrderTimeline status progression unchanged_
    - _Requirements: 2.1, 2.2, 3.1, 3.2 (Bug 8)_

  - [x] 6.2 Verify Bug Condition exploration test now passes (order detail)
    - **Property 1: Expected Behavior** - OrderDetailPage Robust Unwrap
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - Run Bug 8 exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms `order.items` is populated and page renders correctly)
    - _Requirements: 2.1, 2.2 (Bug 8)_

  - [x] 6.3 Verify preservation tests still pass (order detail)
    - **Property 2: Preservation** - OrderDetailPage Error State Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation tests for Bug 8 from step 2
    - **EXPECTED OUTCOME**: Tests PASS (error state and cancel flow unchanged)

- [x] 7. Fix Bug 9 — Verify ProfilePage referral route mounting in backend server.ts

  - [x] 7.1 Confirm referralRoutes is mounted in server.ts
    - File: `matasree-backend/src/server.ts`
    - Verify `import referralRoutes from './routes/referralRoutes';` is present (line ~36 in current file — already confirmed present)
    - Verify `app.use('/api/referral', referralRoutes);` is present (already confirmed on current line ~196)
    - If either line is missing, add: `import referralRoutes from './routes/referralRoutes';` at the imports block and `app.use('/api/referral', referralRoutes);` in the API routes section
    - Confirm `referralRoutes.ts` registers `GET /my-code` (→ `getMyCode`) and `GET /history` (→ `getReferralHistory`) — both already verified correct
    - Confirm response shapes: `{ data: { referralCode } }` and `{ data: { referrals: [] } }` match what `ProfilePage.tsx` reads at `codeRes?.data?.referralCode` and `historyRes?.data?.referrals`
    - No frontend code changes are required — `ProfilePage.tsx` already has a graceful `catch(() => setReferralError(...))` fallback
    - _Bug_Condition: isBugCondition_Referral: isAuthenticated AND /api/referral/* routes return 404 (not registered)_
    - _Expected_Behavior: GET /api/referral/my-code and GET /api/referral/history respond successfully; referral code and history rendered in ProfilePage_
    - _Preservation: user.name/email from authStore displayed without API calls; empty referral history shows "No referrals yet" state_
    - _Requirements: 2.1, 2.2, 3.1, 3.2 (Bug 9)_

---

## Task Group 3: Admin Multi-Image Upload

- [x] 8. Fix Bug 5 — Add `images` field to Joi validation schema in productController

  - [x] 8.1 Add images array to Joi productSchema
    - File: `matasree-backend/src/controllers/productController.ts`
    - Locate `const productSchema = Joi.object({` (currently ends at `isBestseller`)
    - Add after the last field: `images: Joi.array().items(Joi.string()).optional().default([]),`
    - Without this change, `stripUnknown: true` in `productSchema.validate(req.body, { stripUnknown: true })` silently drops any `images` array sent from the frontend
    - _Bug_Condition: isBugCondition_MultiImage: productSchema.images is NOT defined AND stripUnknown silently drops images from payload_
    - _Expected_Behavior: images field accepted by Joi; persisted to Product.images[] in MongoDB_
    - _Preservation: primary image field unchanged; products without images[] continue to work; `images` defaults to [] if omitted_
    - _Requirements: 2.3, 3.1, 3.2 (Bug 5)_

- [x] 9. Fix Bug 5 — Add multi-image upload UI to AdminProducts form

  - [x] 9.1 Add images state, upload handler, and "Additional Images" UI section
    - File: `matasree-superstore-main/src/pages/AdminProducts.tsx`
    - Add `images: [] as string[]` to the `formData` state initializer object (alongside `name`, `description`, `price`, etc.)
    - Add `multiImageFileInputRef = useRef<HTMLInputElement>(null)` alongside the existing `fileInputRef`
    - Add handler `handleAdditionalImageSelect`:
      - Same file-type and size validation as `handleImageSelect`
      - Calls `apiClient.uploadImage(formDataToSend)`, reads `response?.data?.imageUrl`
      - Pushes the returned URL into `formData.images` via `setFormData(prev => ({ ...prev, images: [...prev.images, imagePath] }))`
    - Add an "Additional Images" section in the form JSX below the primary image field (inside `md:col-span-2` wrapper):
      - Section label: "Additional Product Images (Gallery)"
      - Upload zone (same dashed-border pattern as primary): click triggers `multiImageFileInputRef.current?.click()`; hidden `<input ref={multiImageFileInputRef} type="file" ...>` calls `handleAdditionalImageSelect`
      - Thumbnail grid: render each URL in `formData.images` as a `<img>` (40×40, rounded) with an `×` remove button that filters the URL out of `formData.images`
    - In `handleSubmit`: spread `images: formData.images` into the `payload` object (alongside existing fields)
    - In `handleEdit`: set `images: (product as any).images ?? []` when populating `formData` from an existing product; populate existing thumbnails for display
    - In `handleCancel`: reset `images: []` in `setFormData`; also reset `images` in the `setFormData` call inside `handleSubmit` success path
    - _Bug_Condition: isBugCondition_MultiImage: formData has no images[] AND payload omits images array_
    - _Expected_Behavior: admin can upload multiple images; images[] included in create/update payload; gallery thumbnails shown with remove buttons_
    - _Preservation: primary image upload flow (image field) entirely unchanged; existing products without images[] display and save correctly_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2 (Bug 5)_

  - [x] 9.2 Verify Bug Condition exploration test now passes (multi-image)
    - **Property 1: Expected Behavior** - Multi-Image Upload Accepted by Backend
    - Write and run: submit the product form with `images: ['url1', 'url2']` → assert payload sent to `apiClient.createProduct` includes `images: ['url1', 'url2']` AND Joi validation accepts it
    - **EXPECTED OUTCOME**: Test PASSES (confirms images array flows through frontend payload and backend validation)
    - _Requirements: 2.1, 2.2, 2.3 (Bug 5)_

  - [x] 9.3 Verify preservation tests still pass (multi-image)
    - **Property 2: Preservation** - Primary Image Upload Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation tests for Bug 5 from step 2
    - **EXPECTED OUTCOME**: Tests PASS (primary image field save behavior unchanged; products without images[] unaffected)

---

## Task Group 4: Admin Banners UI

- [x] 10. Fix Bug 6 — Create AdminBanners.tsx page

  - [x] 10.1 Create full CRUD AdminBanners page
    - Create new file: `matasree-superstore-main/src/pages/AdminBanners.tsx`
    - State: `banners: SeasonalBanner[]`, `loading: boolean`, `showForm: boolean`, `editingId: string | null`, `formData` with fields: `image: ''`, `title: ''`, `subtitle: ''`, `ctaLink: ''`, `ctaText: ''`, `activeFrom: ''`, `activeTo: ''`
    - On mount: call `apiClient.getSeasonalBanners()` to fetch and display the banner list; unwrap `response?.data ?? []`
    - Banner list table: columns for Title, Active From, Active To, Status (active/expired badge based on current date vs. activeFrom/activeTo), Edit action button, Delete action button
    - Create/Edit form (shown via `showForm` state toggle, same pattern as AdminProducts): fields for Image URL (text input), Title (text input), Subtitle (text input, optional), CTA Link (text input), CTA Text (text input), Active From (`<input type="datetime-local" />`), Active To (`<input type="datetime-local" />`)
    - On save (create): call `apiClient.post('/admin/banners', formData)` — show success toast, refetch list, reset form
    - On save (edit): call `apiClient.put('/admin/banners/' + editingId, formData)` — show success toast, refetch list, reset form
    - On delete: `window.confirm('Delete this banner?')` → call `apiClient.delete('/admin/banners/' + id)` → show success toast, refetch list
    - Use existing UI components: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`, `Badge` from `@/components/ui/*`; `toast` from `sonner`; `Navbar` and `Footer` from existing components
    - Add `PageHelmet` with `noIndex={true}`
    - Include Back button navigating to `/admin/dashboard` (same pattern as AdminProducts)
    - Guard: redirect non-admins to `/` via `useAuthStore` check (same pattern as AdminProducts)
    - _Bug_Condition: isBugCondition_BannerAdmin: adminNav.targetPath === '/admin/banners' AND no Route exists AND no AdminBanners.tsx file_
    - _Expected_Behavior: admin navigates to /admin/banners → full CRUD UI with list, create/edit form, and delete confirmation_
    - _Preservation: GET /api/admin/banners public read path unchanged; SeasonalBannerSlot date filtering unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2 (Bug 6)_

- [x] 11. Fix Bug 6 — Register /admin/banners route in App.tsx

  - [x] 11.1 Add AdminBanners lazy import and route
    - File: `matasree-superstore-main/src/App.tsx`
    - Add lazy import after the existing admin page imports: `const AdminBanners = lazy(() => import('./pages/AdminBanners'));`
    - Add route inside the Admin Routes block, before the catch-all `<Route path="*" ...>`:
      ```tsx
      <Route path="/admin/banners" element={<AdminRoute><PageTransition><AdminBanners /></PageTransition></AdminRoute>} />
      ```
    - Match the exact structure of existing admin routes (AdminRoute + PageTransition wrapper)
    - _Bug_Condition: isBugCondition_BannerAdmin: no Route for '/admin/banners' in App.tsx_
    - _Expected_Behavior: /admin/banners renders AdminBanners page; non-admins redirected by AdminRoute guard_
    - _Preservation: all existing routes unchanged; AdminRoute guard behavior unchanged_
    - _Requirements: 2.1, 2.2, 3.2 (Bug 6), 3.2 (Bug 10)_

- [x] 12. Fix Bug 10 — Add "Manage Banners" quick-link card to AdminDashboard

  - [x] 12.1 Add fifth quick-link card to AdminDashboard
    - File: `matasree-superstore-main/src/pages/AdminDashboard.tsx`
    - Locate the Quick Links grid section (currently 4 cards: Manage Users, Manage Products, Manage Categories, Manage Orders)
    - Add a 5th card after the Orders card, matching the exact style (`className="cursor-pointer hover:shadow-lg transition-shadow"` + `onClick={() => navigate('/admin/banners')}`):
      ```tsx
      <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/banners')}>
        <CardHeader>
          <CardTitle>Manage Banners</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Create and schedule seasonal promotional banners</p>
        </CardContent>
      </Card>
      ```
    - _Bug_Condition: isBugCondition_BannerLink: '/admin/banners' NOT in dashboardQuickLinks_
    - _Expected_Behavior: admin dashboard quick links section includes "Manage Banners" card navigating to /admin/banners_
    - _Preservation: existing 4 quick-link cards (Users, Products, Categories, Orders) unchanged and routing correctly_
    - _Requirements: 2.1, 2.2, 3.1, 3.2 (Bug 10)_

  - [x] 12.2 Verify Bug Condition exploration test now passes (admin banners)
    - **Property 1: Expected Behavior** - AdminBanners Page Accessible
    - Write and run: navigate to `/admin/banners` as an admin → assert `AdminBanners` page renders; assert "Manage Banners" card is present in `AdminDashboard` quick links
    - **EXPECTED OUTCOME**: Tests PASS (confirms route registered, page renders, dashboard card links correctly)
    - _Requirements: 2.1, 2.2 (Bug 6), 2.1, 2.2 (Bug 10)_

  - [x] 12.3 Verify preservation tests still pass (admin banners + dashboard)
    - **Property 2: Preservation** - Existing Admin Routes and Banner Slot Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation tests for Bug 6 and Bug 10 from step 2
    - **EXPECTED OUTCOME**: Tests PASS (existing 4 quick-link cards route correctly; SeasonalBannerSlot behavior unchanged)

---

## Task Group 5: UX / Empty State Polish

- [x] 13. Fix Bug 7 — Improve RecipesPage empty state with admin guidance

  - [x] 13.1 Differentiate empty state between "no recipes in DB" and "filter matches nothing"
    - File: `matasree-superstore-main/src/pages/RecipesPage.tsx`
    - Locate the `filteredRecipes.length === 0` conditional block (currently shows a single message: "No recipes found for the selected filters. / Try selecting a different region or clearing the tag filter.")
    - Replace with a conditional that checks `allRecipes.length`:
      ```tsx
      ) : filteredRecipes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 text-[#3E2314]/60"
          role="status"
          aria-live="polite"
        >
          <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No recipes found.</p>
          {allRecipes.length === 0 ? (
            <p className="text-sm mt-1 text-[#3E2314]/40">
              No recipes have been added yet. Admins can add recipes from the{' '}
              <a href="/admin/dashboard" className="underline hover:text-[#3E2314]/70 transition-colors">
                admin panel
              </a>.
            </p>
          ) : (
            <p className="text-sm mt-1 text-[#3E2314]/40">
              Try a different region or clear the tag filter.
            </p>
          )}
        </motion.div>
      ```
    - When `allRecipes.length === 0`: show "No recipes have been added yet. Admins can add recipes from the admin panel." with a link to `/admin/dashboard`
    - When `allRecipes.length > 0` but `filteredRecipes.length === 0`: show "Try a different region or clear the tag filter."
    - _Bug_Condition: isBugCondition_RecipesEmpty: recipeCount === 0 AND empty state does NOT guide admin to add recipes_
    - _Expected_Behavior: zero-recipe empty state includes admin guidance link; filter-miss empty state gives filter hint_
    - _Preservation: when API returns recipes, recipe cards continue to render with region grouping and tag search unchanged_
    - _Requirements: 2.1, 2.2, 3.1 (Bug 7)_

  - [x] 13.2 Verify preservation tests still pass (recipes page)
    - **Property 2: Preservation** - RecipesPage With Data Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Verify: when the API returns recipes, recipe cards render correctly with region grouping and tag search
    - **EXPECTED OUTCOME**: Tests PASS (recipe card rendering and filtering logic unchanged)

---

- [x] 14. Checkpoint — Ensure all tests pass
  - Re-run the complete test suite (bug condition exploration tests from task 1 + preservation tests from task 2 + all verification sub-tasks)
  - All Property 1 (Bug Condition) tests must PASS — confirms all 10 bugs are fixed
  - All Property 2 (Preservation) tests must PASS — confirms no regressions introduced
  - If any test fails, investigate before marking complete
  - Ask the user if questions arise during this checkpoint

---

## Task Dependency Graph

```
Task 1  (Exploration tests)  ─────────────────────────────────────── no dependencies
Task 2  (Preservation tests) ─────────────────────────────────────── no dependencies

Group 1 (App.tsx):
  Task 3  (Bug 1 + Bug 2) ──────────── independent of all other groups

Group 2 (API Response Fixes):
  Task 4  (Bug 3 — RecentlyViewed)  ── independent of all other groups
  Task 5  (Bug 4 — Testimonials)    ── independent of all other groups
  Task 6  (Bug 8 — OrderDetail)     ── independent of all other groups
  Task 7  (Bug 9 — Referral verify) ── independent of all other groups

Group 3 (Multi-Image Upload):
  Task 8  (Bug 5 — Joi schema)      ── must complete BEFORE Task 9
  Task 9  (Bug 5 — Admin UI)        ── depends on Task 8

Group 4 (Admin Banners):
  Task 10 (Bug 6 — AdminBanners.tsx) ─ must complete BEFORE Tasks 11 and 12
  Task 11 (Bug 6 — Route in App.tsx) ─ depends on Task 10; can run in parallel with Task 12
  Task 12 (Bug 10 — Dashboard card)  ─ depends on Task 10; can run in parallel with Task 11

Group 5 (UX):
  Task 13 (Bug 7 — RecipesPage) ───── independent of all other groups

Task 14 (Checkpoint) ─────────────────── depends on all prior tasks
```

**Parallelization summary:**
- Groups 1, 2, 3, 4, and 5 are independent of each other and can be worked in parallel at the group level
- Within Group 3: Task 8 → Task 9 (sequential)
- Within Group 4: Task 10 → Tasks 11 + 12 (Tasks 11 and 12 can run in parallel after Task 10)
- Tasks 1 and 2 have no dependencies and should be completed before any implementation task

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1", "2"],
      "description": "Write all exploration and preservation property-based tests before touching any code"
    },
    {
      "wave": 2,
      "tasks": ["3", "4", "5", "6", "7", "8", "10", "13"],
      "description": "Group 1 (App.tsx mounts), Group 2 API fixes, Joi schema (Bug 5 backend), AdminBanners page creation, and RecipesPage UX — all independent; run in parallel"
    },
    {
      "wave": 3,
      "tasks": ["9", "11", "12"],
      "description": "AdminProducts multi-image UI (depends on Task 8 Joi fix), App.tsx banner route (depends on Task 10), AdminDashboard banner card (depends on Task 10) — Tasks 11 and 12 run in parallel"
    },
    {
      "wave": 4,
      "tasks": ["14"],
      "description": "Final checkpoint — run all tests and confirm no regressions"
    }
  ]
}
```

## Notes

- Task 7 (Bug 9 — Referral route verification) is a confirm-only task: `referralRoutes` is already imported and mounted in `server.ts`. No code changes are expected unless a discrepancy is found.
- Task 8 (Joi schema) must land in the backend before Task 9 (AdminProducts UI) is tested end-to-end, because `stripUnknown: true` would silently drop the `images` array otherwise.
- Tasks 11 and 12 both depend on Task 10 (the `AdminBanners.tsx` file existing) but are otherwise independent of each other and can be worked simultaneously.
- The `GlobalModals` inner component in Task 3.2 must be defined inside the `<BrowserRouter>` subtree so that `useLocation()` has a Router ancestor — do not hoist it above `<BrowserRouter>`.
- All new admin pages should follow the existing guard pattern: check `!user?.isAdmin && user?.role !== 'admin'` and `navigate('/')` on mount.

