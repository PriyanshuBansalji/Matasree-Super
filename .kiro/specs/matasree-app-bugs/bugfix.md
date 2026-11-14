# Bugfix Requirements Document

## Introduction

This document captures requirements for fixing six confirmed bugs found during a comprehensive audit of the Matasree Store application (React/TypeScript frontend + Node.js/Express/MongoDB backend). The bugs span authentication flows, frontend state persistence, cache invalidation, race conditions, API routing, and redundant state writes. Each bug is specified using the bug condition methodology.

---

## Bug Analysis

### Bug 1: Password Reset Flow Broken

The password reset flow is a two-step process: first the user verifies their OTP via `POST /api/auth/verify-reset-otp`, then they submit their new password via `POST /api/auth/reset-password`. The `verifyPasswordResetOtp` handler deletes the OTP from Redis immediately upon successful verification. When `resetPassword` is subsequently called, it attempts to retrieve and re-validate the same OTP — which is now gone — causing it to always return "OTP not found or expired".

**Bug Condition C(X):** `X.verifyOtpCalled = true AND X.resetPasswordCalled = true AND X.timeBetweenCalls < OTP_TTL_SECONDS`

**Root Cause:** `verifyPasswordResetOtp` calls `deleteOTP(email, 'reset')` before `resetPassword` can use it. The two-step design requires OTP presence at both steps, but deletion at step 1 breaks step 2.

**Fix Strategy:** Replace OTP deletion in `verifyPasswordResetOtp` with a short-lived "verified" flag in Redis (e.g., key `reset_verified:{email}`, TTL 10 minutes). The `resetPassword` endpoint checks for this verified flag instead of re-validating the raw OTP, then deletes the flag after a successful reset.

### Bug 2: Product Detail Page Wishlist Button Not Persisting

The `handleWishlist` function in `ProductDetailsPage.tsx` toggles local React state (`isWishlisted`) and shows a toast notification, but makes no API call to the backend. In contrast, `ProductCard.tsx` correctly calls the wishlist API with optimistic UI updates and error rollback.

**Bug Condition C(X):** `X.sourceComponent = "ProductDetailsPage" AND X.userIsAuthenticated = true`

**Root Cause:** `handleWishlist` was implemented as a UI stub without wiring up the API calls that `ProductCard.tsx` already has.

**Fix Strategy:** Refactor `handleWishlist` in `ProductDetailsPage.tsx` to call `apiClient.addToWishlist(productId)` or `apiClient.removeFromWishlist(productId)` with optimistic update and error rollback, matching the pattern in `ProductCard.tsx`.

### Bug 3: Cancel Order — Orders List Does Not Refresh

The `useCancelOrder` mutation in `useApi.ts` invalidates `queryKey: ['orders']` on success, but the `useOrders` hook fetches with `queryKey: ['my-orders']`. These keys don't match, so the orders list is never refetched after cancellation.

**Bug Condition C(X):** `X.cancelSucceeded = true AND X.invalidatedKey = "orders" AND X.activeQueryKey = "my-orders"`

**Root Cause:** Inconsistent query key naming — the cache invalidation targets the wrong key.

**Fix Strategy:** Change `useCancelOrder` `onSuccess` to invalidate `['my-orders']` and also `['order', orderId]` so both the list and the detail view refresh automatically.

### Bug 4: COD Orders Race Condition — Stock Can Go Negative

In `orderController.ts`, the Razorpay branch uses a conditional atomic decrement with `{ stock: { $gte: item.quantity } }` guard. The COD branch uses a plain `$inc: { stock: -qty }` with no availability guard, allowing concurrent COD orders to push stock below zero.

**Bug Condition C(X):** `X.paymentMethod = "cod" AND X.concurrentRequests >= 1 AND X.totalRequestedQuantity >= X.availableStock`

**Root Cause:** COD stock decrement was not given the same atomic conditional guard as the Razorpay branch.

**Fix Strategy:** Apply the same `findOneAndUpdate({ _id: productId, stock: { $gte: qty } }, { $inc: { stock: -qty } })` pattern to the COD branch, with rollback on failure for multi-item orders.

### Bug 5: Referral API — Frontend URL Path Inconsistency

The `ApiClient` class in `api.ts` has no typed referral methods, so frontend components call referral endpoints via raw `apiClient.get/post` with inconsistent paths (some use `/referrals` plural, backend routes at `/api/referral` singular). This risks 404 errors on all referral operations.

**Bug Condition C(X):** `X.calledPath NOT IN canonical_referral_paths AND X.typedMethodExists = false`

**Root Cause:** Referral methods were never added to `ApiClient`, leaving each callsite to define its own URL string.

**Fix Strategy:** Add typed methods `getReferralCode()`, `applyReferralCode(code)`, and `getReferralHistory()` to `ApiClient` targeting the canonical `/referral/*` paths (singular), and update all frontend callsites to use these methods.

### Bug 6: useLogin Hook — Double localStorage Write Causing State Desync

The `useLogin` mutation in `useApi.ts` manually writes `authToken` and `user` to flat localStorage keys in `onSuccess`. Zustand's `persist` middleware also writes auth state to `matasree-auth`. These are two independent storage locations. When the axios interceptor reads `localStorage.getItem('authToken')`, it may get a stale value if the `authStore` has since rotated the token without updating the flat key.

**Bug Condition C(X):** `X.useLoginMutationFired = true AND X.manualLocalStorageWritePresent = true AND X.zustandPersistActive = true`

**Root Cause:** `useLogin` duplicates storage logic that `authStore.login()` already handles via Zustand persist.

**Fix Strategy:** Remove the manual `localStorage.setItem('authToken', ...)` and `localStorage.setItem('user', ...)` calls from `useLogin` `onSuccess`. Ensure the axios interceptor reads from `authStore.getState().token` (or the Zustand-persisted `matasree-auth` key) as the single source of truth.

---

### Current Behavior (Defect)

1. **Password Reset:** `resetPassword` always returns 400 "OTP not found or expired" after successful OTP verification because `verifyPasswordResetOtp` already deleted the OTP from Redis.
2. **Product Detail Wishlist:** Clicking the heart button on a product detail page toggles UI state only — no API call is made, no backend record is created, and the change is lost on refresh.
3. **Cancel Order Refresh:** After cancelling an order, the orders list remains stale showing the old status because `queryClient.invalidateQueries({ queryKey: ['orders'] })` does not match the active cache key `['my-orders']`.
4. **COD Race Condition:** Two simultaneous COD orders for the same low-stock product both succeed and stock becomes negative, because the MongoDB update has no `$gte` conditional guard.
5. **Referral 404:** Frontend components calling referral endpoints may hit 404 because there are no canonical typed referral methods in `ApiClient` and URL strings differ across callsites.
6. **Auth Desync:** After login, `authToken` and `matasree-auth` in localStorage can diverge — `authToken` is never updated when the token rotates, causing stale auth headers in API requests.

---

### Expected Behavior (Correct)

1. **Password Reset:** User verifies OTP → receives a short-lived verified flag → submits new password → password resets successfully → all refresh tokens revoked.
2. **Product Detail Wishlist:** Clicking wishlist on product detail calls the API, persists to backend, and behaves identically to `ProductCard.tsx` with optimistic update + error rollback.
3. **Cancel Order Refresh:** After cancellation, `['my-orders']` and `['order', id]` are invalidated, causing the orders list and detail view to refetch and show "cancelled" status automatically.
4. **COD Race Condition:** COD stock decrement uses atomic conditional MongoDB update; stock never goes negative; concurrent orders beyond available stock receive a 400 error with rollback.
5. **Referral API:** All referral calls go through typed `ApiClient` methods targeting a single canonical path (`/referral/*`), eliminating URL ambiguity across the frontend.
6. **Auth State:** Login stores auth state only through `authStore.login()` → Zustand persist → `matasree-auth`; the flat `authToken` key is removed; axios interceptor reads from a single canonical source.

---

### Unchanged Behavior (Regression Prevention)

1. Unverified or expired OTPs submitted to `resetPassword` directly SHALL continue to be rejected.
2. Wishlist behavior on `ProductCard` components SHALL remain unchanged.
3. `useOrders` fetch behavior (query key, pagination, filters) SHALL remain unchanged.
4. Razorpay order stock decrement (already uses atomic conditional update) SHALL remain unchanged.
5. All non-referral API routes and `ApiClient` methods SHALL remain unaffected.
6. Login persistence across page refreshes SHALL continue to work; logout SHALL continue to clear all auth state.
7. `useRegister` mutation SHALL remain functionally equivalent if the same deduplication fix is applied.

---

## Correctness Properties

### Property 1: Password Reset Completability

```pascal
FUNCTION isBugCondition_1(X)
  RETURN X.verifyOtpCalled = true
    AND X.resetPasswordCalled = true
    AND X.timeBetweenCalls < OTP_TTL_SECONDS

FOR ALL X WHERE isBugCondition_1(X) DO
  result ← resetPassword'(X)
  ASSERT result.status = 200 AND result.passwordUpdated = true
END FOR
```

### Property 2: Wishlist API Persistence

```pascal
FUNCTION isBugCondition_2(X)
  RETURN X.sourceComponent = "ProductDetailsPage"
    AND X.userIsAuthenticated = true

FOR ALL X WHERE isBugCondition_2(X) DO
  result ← handleWishlist'(X)
  ASSERT result.apiCallMade = true AND result.backendPersisted = true
END FOR
```

### Property 3: Cancel Order Cache Invalidation

```pascal
FUNCTION isBugCondition_3(X)
  RETURN X.cancelSucceeded = true
    AND X.invalidatedKey = "orders"
    AND X.activeQueryKey = "my-orders"

FOR ALL X WHERE isBugCondition_3(X) DO
  result ← useCancelOrder_onSuccess'(X)
  ASSERT result.invalidatedKeys CONTAINS "my-orders"
END FOR
```

### Property 4: COD Stock Non-Negativity

```pascal
FUNCTION isBugCondition_4(X)
  RETURN X.paymentMethod = "cod"
    AND X.totalRequestedQuantity >= X.availableStock

FOR ALL X WHERE isBugCondition_4(X) DO
  result ← createOrder_COD'(X)
  finalStock ← getProductStock(X.productId)
  ASSERT finalStock >= 0
END FOR
```

### Property 5: Referral API Canonical Routing

```pascal
FOR ALL X OF TYPE ReferralApiCall DO
  result ← referralApiCall'(X)
  ASSERT result.status != 404
  ASSERT result.calledPath IN canonical_referral_paths
END FOR
```

### Property 6: Single Auth Storage Source

```pascal
FOR ALL X WHERE X.useLoginMutationFired = true DO
  result ← useLogin_onSuccess'(X)
  flatKey ← localStorage.getItem("authToken")
  ASSERT flatKey = null
  // All auth is in matasree-auth via Zustand persist
END FOR
```
