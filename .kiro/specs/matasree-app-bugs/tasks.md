# Implementation Plan

## Overview

This task list implements fixes for six confirmed bugs in the Matasree Store application. Tasks follow the exploratory bugfix workflow: explore (write tests against unfixed code), preserve (write preservation tests), implement (apply the fix), then validate. Backend bugs (1, 4) are ordered before their frontend counterparts. Bug 3 and Bug 6 both touch `useApi.ts` and are sequenced so Bug 3's cache-key fix comes before Bug 6's auth-storage cleanup.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2"], "description": "Bug 1 exploration and preservation tests (unfixed code)" },
    { "wave": 2, "tasks": ["3", "4"], "description": "Bug 1 implementation, verification, and checkpoint" },
    { "wave": 3, "tasks": ["5", "6"], "description": "Bug 2 exploration and preservation tests (unfixed code)" },
    { "wave": 4, "tasks": ["7", "8"], "description": "Bug 2 implementation, verification, and checkpoint" },
    { "wave": 5, "tasks": ["9", "10"], "description": "Bug 3 exploration and preservation tests (unfixed code)" },
    { "wave": 6, "tasks": ["11", "12"], "description": "Bug 3 implementation, verification, and checkpoint" },
    { "wave": 7, "tasks": ["13", "14"], "description": "Bug 4 exploration and preservation tests (unfixed code)" },
    { "wave": 8, "tasks": ["15", "16"], "description": "Bug 4 implementation, verification, and checkpoint" },
    { "wave": 9, "tasks": ["17", "18"], "description": "Bug 5 exploration and preservation tests (unfixed code)" },
    { "wave": 10, "tasks": ["19", "20"], "description": "Bug 5 implementation, verification, and checkpoint" },
    { "wave": 11, "tasks": ["21", "22"], "description": "Bug 6 exploration and preservation tests (unfixed code)" },
    { "wave": 12, "tasks": ["23", "24"], "description": "Bug 6 implementation, verification, and checkpoint" },
    { "wave": 13, "tasks": ["25"], "description": "Final full regression checkpoint" }
  ]
}
```

## Tasks

<!-- ============================================================ -->
<!-- BUG 1: Password Reset Flow Broken                           -->
<!-- Files: authController.ts                                    -->
<!-- ============================================================ -->

- [x] 1. Write bug condition exploration test — Password Reset Flow
  - **Property 1: Bug Condition** - Password Reset OTP Deleted At Verification Step
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope to the concrete failing sequence: verifyPasswordResetOtp succeeds → resetPassword called within 5 minutes
  - Seed Redis with `otp:reset:{email}` (e.g. `"123456"`). Call `verifyPasswordResetOtp` with correct OTP. Assert that `redisClient.get("otp:reset:{email}")` returns `null` immediately after (confirms deletion bug). Then call `resetPassword` for same email. Assert response status is 400 "OTP not found or expired".
  - Run test on UNFIXED `matasree-backend/src/controllers/authController.ts`
  - **EXPECTED OUTCOME**: Test FAILS demonstrating the two-step flow is broken
  - Document counterexample: `{ email: "user@test.com", otp: "123456", timeBetweenCalls: 30s }` → 400 after verify
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1_


- [x] 2. Write preservation property tests — Password Reset (BEFORE implementing fix)
  - **Property 2: Preservation** - Unverified OTP Rejection Still Returns 400
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: calling `resetPassword` with no prior `verifyPasswordResetOtp` (no `reset_verified:{email}` key) returns 400 on unfixed code
  - Observe: calling `resetPassword` with an expired OTP (Redis key expired) returns 400 on unfixed code
  - Write property-based tests: for all inputs where `verifyPasswordResetOtp` was NOT called (or the OTP key does not exist), `resetPassword` SHALL return 400
  - Property covers both the current key name (`otp:reset:{email}`) and the future verified-flag key (`reset_verified:{email}`)
  - Verify tests PASS on UNFIXED `matasree-backend/src/controllers/authController.ts`
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline rejection behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 1.3_


- [x] 3. Fix Bug 1 — Password Reset Flow in authController.ts

  - [ ] 3.1 Implement verified-flag approach in `verifyPasswordResetOtp`
    - File: `matasree-backend/src/controllers/authController.ts`
    - Remove `await deleteOTP(key)` call after successful OTP comparison
    - Add `const verifiedFlagKey = \`reset_verified:${email}\`` and `await redisClient.set(verifiedFlagKey, '1', 'EX', 600)`
    - Return the existing 200 success response unchanged
    - _Bug_Condition: isBugCondition_1(X) where X.verifyOtpCalled=true AND X.resetPasswordCalled=true AND X.timeBetweenCalls < 300_
    - _Expected_Behavior: resetPassword returns HTTP 200 and updates user.password in DB_
    - _Preservation: unverified/expired OTP calls to resetPassword continue to return 400_
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 3.2 Implement verified-flag check in `resetPassword`
    - File: `matasree-backend/src/controllers/authController.ts`
    - Replace `getOTP(key)` + OTP comparison block with `redisClient.get(verifiedFlagKey)` check
    - If `isVerified` is falsy return 400 "OTP not verified or session expired"
    - After successful password save: `await deleteOTP(key)` and `await redisClient.del(verifiedFlagKey)` to clean up both keys
    - Call `await revokeAllTokens(user._id.toString())` unchanged
    - _Requirements: 1.1, 1.2_

  - [ ] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Two-Step Password Reset Completes Successfully
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - Run the test: verifyPasswordResetOtp → resetPassword sequence
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed — resetPassword now returns 200)
    - _Requirements: 1.1, 1.2_

  - [ ] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Unverified OTP Rejection Still Returns 400
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in rejection behavior)


  - [ ] 3.5 Write unit tests for Bug 1 fix
    - File: `matasree-backend/src/controllers/authController.test.ts` (new)
    - Test: `verifyPasswordResetOtp` writes `reset_verified:{email}` key with 600s TTL and does NOT delete `otp:reset:{email}`
    - Test: `resetPassword` reads verified flag, NOT raw OTP; returns 200 and updates password when flag present
    - Test: `resetPassword` returns 400 when verified flag is absent
    - Test: `resetPassword` deletes both `otp:reset:{email}` and `reset_verified:{email}` on success
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 3.6 Write integration test for Bug 1 fix
    - End-to-end: `POST /api/auth/forgot-password` → seed OTP in Redis → `POST /api/auth/verify-reset-otp` → `POST /api/auth/reset-password` → `POST /api/auth/login` with new password
    - Assert login with new password succeeds (HTTP 200)
    - Assert login with old password fails (HTTP 401)
    - _Requirements: 1.1, 1.2_

- [x] 4. Checkpoint Bug 1 — all password reset tests pass
  - Ensure tasks 1–3 tests all pass; ask user if questions arise


<!-- ============================================================ -->
<!-- BUG 2: Product Detail Wishlist Not Persisting               -->
<!-- Files: ProductDetailsPage.tsx                               -->
<!-- ============================================================ -->

- [x] 5. Write bug condition exploration test — Wishlist Not Persisting
  - **Property 1: Bug Condition** - ProductDetailsPage Wishlist Makes No API Call
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **GOAL**: Confirm that `apiClient.addToWishlist` is never called from ProductDetailsPage
  - **Scoped PBT Approach**: Scope to the concrete case: authenticated user, any product, click wishlist button once
  - Spy on `apiClient.addToWishlist` and `apiClient.removeFromWishlist`. Render `ProductDetailsPage` with mocked auth (`isAuthenticated=true`) and a mock product. Click the heart/wishlist button. Assert that neither spy was called (zero invocations).
  - Run test on UNFIXED `matasree-superstore-main/src/pages/ProductDetailsPage.tsx`
  - **EXPECTED OUTCOME**: Test FAILS — spy invocation count assertion fails (0 calls instead of 1)
  - Document counterexample: authenticated click on ProductDetailsPage heart → no API call recorded
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1_


- [x] 6. Write preservation property tests — Wishlist (BEFORE implementing fix)
  - **Property 2: Preservation** - ProductCard Wishlist Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: `ProductCard.handleWishlist` with `isAuthenticated=true` calls `apiClient.addToWishlist` / `apiClient.removeFromWishlist` correctly on unfixed code
  - Observe: unauthenticated wishlist click on `ProductCard` shows login toast (no API call)
  - Write property-based tests: for all `ProductCard` wishlist interactions, API call pattern is unchanged
  - Also test: unauthenticated click on `ProductDetailsPage` shows "Please log in" toast and makes no API call (existing behavior)
  - Verify tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms ProductCard baseline to preserve)
  - _Requirements: Unchanged Behavior 2_


- [x] 7. Fix Bug 2 — Wishlist persistence in ProductDetailsPage.tsx

  - [x] 7.1 Update imports and derive wishlist state from store
    - File: `matasree-superstore-main/src/pages/ProductDetailsPage.tsx`
    - Add import: `import { useWishlistStore } from '@/store/wishlistStore';`
    - Remove: `const [isWishlisted, setIsWishlisted] = useState(false);`
    - Add: `const { isWishlisted: isWishlistedFn, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();`
    - Add: `const isWishlisted = product ? isWishlistedFn(product._id) : false;`
    - All JSX references to `isWishlisted` remain valid (variable name unchanged)
    - _Requirements: 2.1, 2.2_

  - [x] 7.2 Replace `handleWishlist` stub with full API-wired implementation
    - File: `matasree-superstore-main/src/pages/ProductDetailsPage.tsx`
    - Replace the current stub: `const handleWishlist = () => { setIsWishlisted(!isWishlisted); toast.success(...); };`
    - Implement async function matching the pattern in `ProductCard.tsx`: auth guard → optimistic store update → `apiClient.addToWishlist/removeFromWishlist` → error rollback
    - Build `wishlistItem` object from `product` fields: `_id, name, price, originalPrice, image, category, rating`
    - _Bug_Condition: isBugCondition_2(X) where X.sourceComponent="ProductDetailsPage" AND X.userIsAuthenticated=true AND X.wishlistButtonClicked=true_
    - _Expected_Behavior: apiClient.addToWishlist or removeFromWishlist called; useWishlistStore updated; state persists on refresh_
    - _Preservation: ProductCard.handleWishlist is not modified_
    - _Requirements: 2.1, 2.2_

  - [x] 7.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Wishlist API Called From ProductDetailsPage
    - **IMPORTANT**: Re-run the SAME test from task 5 — do NOT write a new test
    - **EXPECTED OUTCOME**: Test PASSES (spy records one `apiClient.addToWishlist` call)
    - _Requirements: 2.1, 2.2_

  - [x] 7.4 Verify preservation tests still pass
    - **Property 2: Preservation** - ProductCard Wishlist Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 6 — do NOT write new tests
    - **EXPECTED OUTCOME**: Tests PASS (ProductCard behavior unaffected)


  - [x] 7.5 Write unit tests for Bug 2 fix
    - File: `matasree-superstore-main/src/pages/__tests__/ProductDetailsPage.wishlist.test.tsx` (new)
    - Test: authenticated click → `apiClient.addToWishlist` called with correct `productId`
    - Test: second click → `apiClient.removeFromWishlist` called with correct `productId`
    - Test: `useWishlistStore` reflects `addItem` and `removeItem` calls
    - Test: API error on add → `removeFromWishlist` rollback called, error toast shown
    - Test: API error on remove → `addToWishlist` rollback called, error toast shown
    - Test: unauthenticated click → no API call, "Please log in" toast shown
    - _Requirements: 2.1, 2.2_

  - [x] 7.6 Write integration test for Bug 2 fix
    - Render `ProductDetailsPage`, add product to wishlist → navigate to `WishlistPage` → assert product appears
    - Simulate page refresh (re-mount `ProductDetailsPage`) → assert heart icon is filled
    - _Requirements: 2.1, 2.2_

- [x] 8. Checkpoint Bug 2 — all wishlist tests pass
  - Ensure tasks 5–7 tests all pass; ask user if questions arise


<!-- ============================================================ -->
<!-- BUG 3: Cancel Order Cache Invalidation Wrong Key            -->
<!-- Files: useApi.ts (useCancelOrder + useCreateOrder)          -->
<!-- ============================================================ -->

- [x] 9. Write bug condition exploration test — Cache Invalidation Wrong Key
  - **Property 1: Bug Condition** - useCancelOrder Invalidates Wrong Query Key
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **GOAL**: Confirm that cancellation does NOT invalidate the `['my-orders']` cache entry
  - **Scoped PBT Approach**: Scope to the concrete failing case: cancel any order → inspect cache for `['my-orders']` staleness
  - Create a React Query client with a populated `['my-orders']` cache entry. Fire `useCancelOrder` mutation (mocked API success). After `onSuccess`, inspect `queryClient.getQueryState(['my-orders'])`. Assert `isInvalidated` / `isFetching` is false (the key was NOT invalidated). Also assert `queryClient.getQueryState(['orders'])` was invalidated (the wrong key that IS being called).
  - Run test on UNFIXED `matasree-superstore-main/src/hooks/useApi.ts`
  - **EXPECTED OUTCOME**: Test FAILS — `['my-orders']` is unexpectedly still valid, proving the miss
  - Document counterexample: cancel orderId `"abc123"` → `['my-orders']` cache untouched
  - _Requirements: 3.1, 3.2_


- [x] 10. Write preservation property tests — Cache Keys (BEFORE implementing fix)
  - **Property 2: Preservation** - useOrders Query Key and useOrder Detail Key Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: `useOrders` registers cache under `['my-orders']` on unfixed code
  - Observe: `useOrder(id)` registers cache under `['order', id]` on unfixed code
  - Write tests: `useOrders` query key is `['my-orders']`; `useOrder(id)` query key is `['order', id]`; neither changes after the fix
  - Also verify: `useCreateOrder` invalidates `['cart']` (this is unchanged behavior)
  - Verify tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms query key baselines to preserve)
  - _Requirements: Unchanged Behavior 3_


- [x] 11. Fix Bug 3 — Cache invalidation key in useApi.ts

  - [x] 11.1 Fix `useCancelOrder` onSuccess invalidation key
    - File: `matasree-superstore-main/src/hooks/useApi.ts`
    - In `useCancelOrder` `onSuccess`: change `queryClient.invalidateQueries({ queryKey: ['orders'] })` to `queryClient.invalidateQueries({ queryKey: ['my-orders'] })`
    - Keep `queryClient.invalidateQueries({ queryKey: ['order', id] })` unchanged (detail view)
    - _Bug_Condition: isBugCondition_3(X) where X.cancelSucceeded=true AND X.invalidatedKey="orders" AND X.activeQueryKey="my-orders"_
    - _Expected_Behavior: useCancelOrder.onSuccess invalidates ['my-orders'] causing useOrders to refetch_
    - _Preservation: useOrders query key ['my-orders'] is NOT changed; useOrder(id) key ['order',id] is NOT changed_
    - _Requirements: 3.1, 3.2_

  - [x] 11.2 Fix `useCreateOrder` onSuccess invalidation key (same pattern)
    - File: `matasree-superstore-main/src/hooks/useApi.ts`
    - In `useCreateOrder` `onSuccess`: change `queryClient.invalidateQueries({ queryKey: ['orders'] })` to `queryClient.invalidateQueries({ queryKey: ['my-orders'] })`
    - Keep `queryClient.invalidateQueries({ queryKey: ['cart'] })` unchanged
    - _Requirements: 3.1_

  - [x] 11.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - useCancelOrder Correctly Invalidates ['my-orders']
    - **IMPORTANT**: Re-run the SAME test from task 9 — do NOT write a new test
    - **EXPECTED OUTCOME**: Test PASSES — `['my-orders']` is marked stale/invalidated after cancel
    - _Requirements: 3.1, 3.2_

  - [x] 11.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Query Keys Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 10 — do NOT write new tests
    - **EXPECTED OUTCOME**: Tests PASS

  - [x] 11.5 Write unit tests for Bug 3 fix
    - File: `matasree-superstore-main/src/hooks/__tests__/useApi.cache.test.ts` (new)
    - Test: after `useCancelOrder` succeeds, `queryClient.getQueryState(['my-orders'])` is invalidated
    - Test: after `useCancelOrder` succeeds, `queryClient.getQueryState(['order', id])` is invalidated
    - Test: after `useCreateOrder` succeeds, `queryClient.getQueryState(['my-orders'])` is invalidated
    - Test: after `useCreateOrder` succeeds, `queryClient.getQueryState(['cart'])` is invalidated
    - _Requirements: 3.1, 3.2_

  - [x] 11.6 Write integration test for Bug 3 fix
    - Render `OrdersPage` with a seeded list. Cancel an order from `OrderDetailPage`. Assert that `OrdersPage` automatically shows "cancelled" status without navigating away and back.
    - _Requirements: 3.1, 3.2_

- [x] 12. Checkpoint Bug 3 — all cache invalidation tests pass
  - Ensure tasks 9–11 tests all pass; ask user if questions arise


<!-- ============================================================ -->
<!-- BUG 4: COD Stock Race Condition                             -->
<!-- Files: orderController.ts (createOrder COD branch)          -->
<!-- ============================================================ -->

- [x] 13. Write bug condition exploration test — COD Stock Race Condition
  - **Property 1: Bug Condition** - Concurrent COD Orders Drive Stock Negative
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **GOAL**: Surface the race condition where two simultaneous COD orders for stock=1 both succeed
  - **Scoped PBT Approach**: Use property-based testing with generated `(stock, concurrentRequests, qtyPerOrder)` triples where `concurrentRequests * qtyPerOrder >= stock`. For the deterministic baseline: stock=1, 2 concurrent COD requests, qty=1 each.
  - Seed DB with product `{ stock: 1 }`. Fire two concurrent `createOrder` COD requests (both for qty=1) using `Promise.all`. After both settle, query `Product.findById`.stock. Assert `stock < 0` (confirms race condition on unfixed code).
  - Run test on UNFIXED `matasree-backend/src/controllers/orderController.ts`
  - **EXPECTED OUTCOME**: Test FAILS (stock becomes -1, proving no atomic guard)
  - Document counterexample: `{ stock: 1, concurrentRequests: 2, qty: 1 }` → finalStock = -1
  - _Requirements: 4.1, 4.2_


- [x] 14. Write preservation property tests — COD Stock (BEFORE implementing fix)
  - **Property 2: Preservation** - Single COD Order With Sufficient Stock Succeeds; Razorpay Branch Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: single COD order with `qty < stock` succeeds and decrements stock correctly on unfixed code
  - Observe: Razorpay branch atomic conditional decrement behavior is unchanged on unfixed code
  - Write property-based tests: for all single COD orders where `requestedQty <= availableStock`, order succeeds and `finalStock = initialStock - requestedQty`
  - Write tests: Razorpay branch result is identical before and after the fix (Razorpay code is not touched)
  - Verify tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms non-race baselines to preserve)
  - _Requirements: Unchanged Behavior 4_


- [-] 15. Fix Bug 4 — COD atomic stock decrement in orderController.ts

  - [-] 15.1 Replace unconditional `$inc` with atomic `$gte` conditional decrement in COD branch
    - File: `matasree-backend/src/controllers/orderController.ts`
    - In `createOrder`, locate the `else` (COD) branch after `Payment.create`
    - Replace the simple `Product.findByIdAndUpdate(item.productId, { $inc: { sold: item.quantity, stock: -item.quantity } })` loop
    - Introduce `decrementedItemsCOD` array, `rollbackNeededCOD` flag, and `failedItemNameCOD` string
    - Use `Product.findOneAndUpdate({ _id: item.productId, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity, sold: item.quantity } }, { new: true })`
    - If `updatedProduct` is null: set `rollbackNeededCOD = true`, capture `failedItemNameCOD`, break
    - _Bug_Condition: isBugCondition_4(X) where X.paymentMethod="cod" AND X.concurrentRequests>=2 AND X.totalRequestedQty>=X.availableStock_
    - _Expected_Behavior: Product.stock never goes below 0; excess COD orders receive HTTP 400_
    - _Preservation: Razorpay branch is not modified; single non-racing COD orders continue to succeed_
    - _Requirements: 4.1, 4.2_

  - [x] 15.2 Implement rollback and cleanup on COD stock guard failure
    - After the loop, if `rollbackNeededCOD` is true: iterate `decrementedItemsCOD` and call `Product.findByIdAndUpdate(decItem.productId, { $inc: { stock: decItem.quantity, sold: -decItem.quantity } })` for each
    - Call `Order.findByIdAndDelete(order._id)` and `Payment.deleteOne({ orderId: order._id })`
    - Return `res.status(400).json(new ApiResponse(false, \`Product "${failedItemNameCOD}" is out of stock\`, null, 400))`
    - _Requirements: 4.1, 4.2_

  - [x] 15.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Concurrent COD Orders Cannot Drive Stock Negative
    - **IMPORTANT**: Re-run the SAME test from task 13 — do NOT write a new test
    - **EXPECTED OUTCOME**: Test PASSES — exactly one order succeeds, one returns 400, finalStock >= 0
    - _Requirements: 4.1, 4.2_

  - [x] 15.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Single COD and Razorpay Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 14 — do NOT write new tests
    - **EXPECTED OUTCOME**: Tests PASS

  - [x] 15.5 Write unit tests for Bug 4 fix
    - File: `matasree-backend/src/controllers/__tests__/orderController.cod.test.ts` (new)
    - Test: mock `Product.findOneAndUpdate` returns null on second call → rollback runs, order deleted, payment deleted, 400 returned
    - Test: mock `Product.findOneAndUpdate` returns updated product both calls → order succeeds, final stock correct
    - Test: rollback correctly reverses all previously decremented items when a later item fails
    - _Requirements: 4.1, 4.2_

  - [x] 15.6 Write property-based test for Bug 4 fix
    - Generate random `(stock, concurrentOrders, qtyPerOrder)` triples where `concurrentOrders * qtyPerOrder >= stock`
    - Fire all COD orders concurrently against the fixed controller
    - Assert `Product.stock >= 0` for ALL generated inputs
    - Assert total successful orders * qtyPerOrder <= initialStock
    - _Requirements: 4.1, 4.2_

  - [x] 15.7 Write integration test for Bug 4 fix
    - Seed DB with product `{ stock: 1 }`. Fire two concurrent COD orders (qty=1 each) via `Promise.all`
    - Assert exactly one response is 200 and one is 400
    - Assert `Product.stock === 0` after both settle
    - _Requirements: 4.1, 4.2_

- [x] 16. Checkpoint Bug 4 — all COD stock tests pass
  - Ensure tasks 13–15 tests all pass; ask user if questions arise


<!-- ============================================================ -->
<!-- BUG 5: Referral API Path Inconsistency                      -->
<!-- Files: api.ts (ApiClient class)                             -->
<!-- ============================================================ -->

- [x] 17. Write bug condition exploration test — Referral API 404
  - **Property 1: Bug Condition** - Plural Path Returns 404
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **GOAL**: Confirm that `/referrals/my-code` (plural) returns 404
  - **Scoped PBT Approach**: Scope to the concrete failing paths: `/referrals/my-code`, `/referrals/history`, `/referrals/apply`
  - Call `apiClient.get('/referrals/my-code')` against the running backend (or mock the router). Assert HTTP 404 is returned. Repeat for `/referrals/history` and `/referrals/apply`.
  - Also verify: `ApiClient` has no typed `getReferralCode`, `getReferralHistory`, `applyReferralCode` methods (they don't exist yet).
  - Run test on UNFIXED `matasree-superstore-main/src/services/api.ts`
  - **EXPECTED OUTCOME**: Test FAILS showing 404 for plural path — confirms the missing typed methods risk
  - Document counterexample: `apiClient.get('/referrals/my-code')` → 404
  - _Requirements: 5.1, 5.2_

- [x] 18. Write preservation property tests — Referral API (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing ApiClient Methods Unchanged; Non-Referral Routes Unaffected
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: all existing `ApiClient` methods (`login`, `register`, `getProducts`, etc.) return expected results on unfixed code
  - Observe: non-referral routes respond correctly (no collateral damage)
  - Write tests: a representative sample of existing `ApiClient` methods work correctly; no method signatures change
  - Verify tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS
  - _Requirements: Unchanged Behavior 5_


- [x] 19. Fix Bug 5 — Typed referral methods in api.ts

  - [x] 19.1 Add typed referral methods to `ApiClient` class
    - File: `matasree-superstore-main/src/services/api.ts`
    - Add after `setDefaultAddress` method, before the generic `get`/`post`/`put`/`delete` methods:
    - `getReferralCode()` → `return this.client.get('/referral/my-code');`
    - `applyReferralCode(code: string)` → `return this.client.post('/referral/apply', { code });`
    - `getReferralHistory()` → `return this.client.get('/referral/history');`
    - All three paths use singular `/referral/` to match `referralRoutes.ts` mounts
    - No existing methods are modified
    - _Bug_Condition: isBugCondition_5(X) where X.typedMethodExists=false OR X.calledPath NOT IN canonical_referral_paths_
    - _Expected_Behavior: typed methods always hit /referral/my-code, /referral/history, /referral/apply — never 404_
    - _Preservation: no existing ApiClient methods are modified; backend referral routes are not changed_
    - _Requirements: 5.1, 5.2_

  - [x] 19.2 Update frontend callsites to use typed referral methods
    - Search: `grep -r "referral" matasree-superstore-main/src --include="*.ts" --include="*.tsx" -n`
    - Replace `apiClient.get('/referral/my-code')` → `apiClient.getReferralCode()`
    - Replace `apiClient.get('/referral/history')` → `apiClient.getReferralHistory()`
    - Replace `apiClient.post('/referral/apply', { code })` → `apiClient.applyReferralCode(code)`
    - Replace any `apiClient.get('/referrals/...')` or `apiClient.post('/referrals/...')` variants with the typed methods
    - _Requirements: 5.2_

  - [x] 19.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Typed Referral Methods Hit Canonical Paths
    - **IMPORTANT**: Re-run the SAME test from task 17 — do NOT write a new test
    - Call `apiClient.getReferralCode()` — assert HTTP path is `/referral/my-code`, no 404
    - **EXPECTED OUTCOME**: Test PASSES
    - _Requirements: 5.1, 5.2_

  - [x] 19.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing ApiClient Methods Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 18 — do NOT write new tests
    - **EXPECTED OUTCOME**: Tests PASS

  - [x] 19.5 Write unit tests for Bug 5 fix
    - File: `matasree-superstore-main/src/services/__tests__/api.referral.test.ts` (new)
    - Test: `getReferralCode()` makes GET request to `/referral/my-code`
    - Test: `applyReferralCode('ABC')` makes POST request to `/referral/apply` with `{ code: 'ABC' }`
    - Test: `getReferralHistory()` makes GET request to `/referral/history`
    - Test: all three methods exist on the `ApiClient` instance (type-level guard)
    - _Requirements: 5.1, 5.2_

  - [x] 19.6 Write integration test for Bug 5 fix
    - Authenticate, then call `apiClient.getReferralCode()` against the running backend
    - Assert HTTP 200 (not 404); assert response contains referral code data
    - _Requirements: 5.1_

- [x] 20. Checkpoint Bug 5 — all referral API tests pass
  - Ensure tasks 17–19 tests all pass; ask user if questions arise


<!-- ============================================================ -->
<!-- BUG 6: useLogin Double localStorage Write                   -->
<!-- Files: useApi.ts + authStore.ts                             -->
<!-- ============================================================ -->

- [x] 21. Write bug condition exploration test — Double localStorage Write
  - **Property 1: Bug Condition** - useLogin.onSuccess Writes authToken Independently of authStore
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **GOAL**: Confirm that two separate `localStorage.setItem('authToken', ...)` calls occur on login
  - **Scoped PBT Approach**: Scope to the concrete failing case: fire `useLogin` mutation with valid credentials, spy on `localStorage.setItem`
  - Spy on `localStorage.setItem`. Mock `apiClient.login` to return `{ data: { accessToken: 'tokenA', user: {...} } }`. Fire `useLogin` mutation. Collect all `setItem` calls. Assert that `setItem('authToken', 'tokenA')` is called from `useLogin.onSuccess` directly (confirming the duplicate write on unfixed code).
  - Run test on UNFIXED `matasree-superstore-main/src/hooks/useApi.ts`
  - **EXPECTED OUTCOME**: Test FAILS — spy records `setItem('authToken')` from `useLogin.onSuccess` (the redundant call that should be removed)
  - Document counterexample: login → `localStorage.authToken = "tokenA"` written twice (once from useLogin, once from authStore path)
  - _Requirements: 6.1, 6.2_


- [x] 22. Write preservation property tests — Auth Storage (BEFORE implementing fix)
  - **Property 2: Preservation** - Login Persistence Across Refresh; Logout Clears State
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: after login, `authStore.getState().isAuthenticated` is true and `authStore.getState().token` contains the access token on unfixed code
  - Observe: after page refresh (Zustand persist hydration), `isAuthenticated` is still true on unfixed code
  - Observe: `useLogout.onSuccess` calls `localStorage.removeItem('authToken')` on unfixed code
  - Write property-based tests: for any login → N operations → logout sequence, after logout `localStorage.getItem('authToken')` is null and `authStore.getState().isAuthenticated` is false
  - Write tests: Zustand persist hydrates auth state correctly after remount
  - Verify tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS
  - _Requirements: Unchanged Behavior 6_


- [x] 23. Fix Bug 6 — Remove double localStorage write from useApi.ts and authStore.ts

  - [x] 23.1 Remove manual localStorage writes from `useLogin.onSuccess`
    - File: `matasree-superstore-main/src/hooks/useApi.ts`
    - Delete `localStorage.setItem('authToken', response.data.accessToken)` from `useLogin` `onSuccess`
    - Delete `localStorage.setItem('user', JSON.stringify(response.data.user))` from `useLogin` `onSuccess`
    - Add comment: `// onSuccess intentionally empty — authStore.login() handles all storage via Zustand persist`
    - _Bug_Condition: isBugCondition_6(X) where X.useLoginMutationFired=true AND X.manualLocalStorageWritePresent=true AND X.zustandPersistActive=true_
    - _Expected_Behavior: after login, localStorage.getItem("authToken") equals authStore.getState().token (single source)_
    - _Preservation: login persistence via Zustand persist continues; logout localStorage.removeItem('authToken') is unchanged_
    - _Requirements: 6.1, 6.2_

  - [x] 23.2 Remove manual localStorage write from `useRegister.onSuccess` (same pattern)
    - File: `matasree-superstore-main/src/hooks/useApi.ts`
    - Delete `localStorage.setItem('authToken', response.data.accessToken)` from `useRegister` `onSuccess`
    - Add comment: `// onSuccess intentionally empty — authStore.register() handles storage`
    - _Requirements: 6.1_

  - [x] 23.3 Add canonical `localStorage.setItem('authToken', accessToken)` to `authStore.login()` action
    - File: `matasree-superstore-main/src/store/authStore.ts`
    - In the `login` action, after `set({ user: normalizedUser, token: accessToken, isAuthenticated: true, isLoading: false })`:
    - Add `localStorage.setItem('authToken', accessToken);`
    - This keeps the flat key in sync with Zustand for the axios request interceptor in `api.ts`
    - _Requirements: 6.2_

  - [x] 23.4 Add `localStorage.setItem('authToken', accessToken)` to `authStore.register()` action
    - File: `matasree-superstore-main/src/store/authStore.ts`
    - Same pattern as 23.3 — after the `set({...})` call in `register` action
    - _Requirements: 6.1_

  - [x] 23.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Single Auth Storage Source After Login
    - **IMPORTANT**: Re-run the SAME test from task 21 — do NOT write a new test
    - Assert `setItem('authToken')` is called exactly once (from `authStore.login()` only)
    - Assert `useLogin.onSuccess` no longer calls `setItem('authToken')` directly
    - **EXPECTED OUTCOME**: Test PASSES
    - _Requirements: 6.1, 6.2_

  - [x] 23.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Login Persistence and Logout Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 22 — do NOT write new tests
    - **EXPECTED OUTCOME**: Tests PASS

  - [x] 23.7 Write unit tests for Bug 6 fix
    - File: `matasree-superstore-main/src/hooks/__tests__/useApi.auth.test.ts` (new)
    - Test: `useLogin` `onSuccess` does NOT call `localStorage.setItem('authToken', ...)`
    - Test: `useLogin` `onSuccess` does NOT call `localStorage.setItem('user', ...)`
    - Test: `useRegister` `onSuccess` does NOT call `localStorage.setItem('authToken', ...)`
    - Test: `useLogout` `onSuccess` STILL calls `localStorage.removeItem('authToken')` (unchanged)
    - File: `matasree-superstore-main/src/store/__tests__/authStore.test.ts` (new or extend)
    - Test: `authStore.login()` calls `localStorage.setItem('authToken', accessToken)` exactly once
    - Test: `authStore.register()` calls `localStorage.setItem('authToken', accessToken)` exactly once
    - _Requirements: 6.1, 6.2_

  - [x] 23.8 Write property-based test for Bug 6 fix
    - Generate random sequences of (login, tokenRefresh, setToken, logout) operations
    - After each step assert: `localStorage.getItem('authToken') === authStore.getState().token` (or both null if logged out)
    - _Requirements: 6.1, 6.2_

  - [x] 23.9 Write integration test for Bug 6 fix
    - Log in → inspect Network tab (or axios interceptor mock) → assert all subsequent API requests carry the correct `Authorization: Bearer <token>` header matching `authStore.getState().token`
    - Simulate token rotation (mock refresh response) → assert `Authorization` header updates accordingly
    - _Requirements: 6.2_

- [-] 24. Checkpoint Bug 6 — all auth storage tests pass
  - Ensure tasks 21–23 tests all pass; ask user if questions arise


<!-- ============================================================ -->
<!-- FINAL CHECKPOINT                                            -->
<!-- ============================================================ -->

- [ ] 25. Final checkpoint — full regression suite
  - Run all unit and integration tests across both backend and frontend
  - Confirm: password reset end-to-end flow works (Bug 1)
  - Confirm: wishlist persists from product detail page (Bug 2)
  - Confirm: orders list auto-refreshes after cancel and after create (Bug 3)
  - Confirm: concurrent COD orders never drive stock negative (Bug 4)
  - Confirm: all referral API calls route correctly via typed methods (Bug 5)
  - Confirm: single auth storage source, no stale token headers (Bug 6)
  - Confirm: no regressions in Razorpay flow, ProductCard wishlist, useOrders/useOrder keys, non-referral routes, or login persistence
  - Ask user to confirm before closing the spec

## Notes

- All exploration tests (odd-numbered standalone tasks 1, 5, 9, 13, 17, 21) are written BEFORE the corresponding fix is applied. They are expected to FAIL on unfixed code — that failure is the proof the bug exists.
- All preservation tests (even-numbered standalone tasks 2, 6, 10, 14, 18, 22) are written BEFORE the fix and must PASS on unfixed code to establish a behavioral baseline.
- Implementation tasks (3, 7, 11, 15, 19, 23) each contain sub-tasks that re-run the same exploration and preservation tests after the fix — no new tests are written at that stage.
- Property-based testing is specifically recommended for Bug 4 (arbitrary concurrent requests / stock levels) and Bug 6 (arbitrary login/refresh/logout sequences).
- Backend fixes (Bugs 1, 4) should be applied and tested before the frontend fixes that depend on them.
- Test file naming: backend tests in `src/controllers/__tests__/` and `src/services/__tests__/`; frontend tests in `src/pages/__tests__/`, `src/hooks/__tests__/`, and `src/services/__tests__/`.
