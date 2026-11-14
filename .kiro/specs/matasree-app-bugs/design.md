# Matasree App Bugs — Bugfix Design

## Overview

This document formalizes the fix strategy for six confirmed bugs in the Matasree Store application.
Each bug is addressed with exact file locations, function-level changes, and pseudocode specifications
for property-based testing. The fixes are surgical — each change is limited to the defective code path
and does not alter surrounding logic.

---

## Bug Details

All six bugs are documented in detail in the sections below, each with a formal bug condition specification, root cause analysis, and exact fix implementation. See per-bug subsections for full details.

## Expected Behavior

After all fixes are applied: password reset completes in two steps without error; wishlist changes from the product detail page persist to the backend; order list auto-refreshes after cancellation; COD stock never goes negative under concurrent load; all referral API calls resolve without 404; auth token has a single canonical storage location.

## Hypothesized Root Cause

1. `verifyPasswordResetOtp` deletes the OTP before `resetPassword` can use it.
2. `ProductDetailsPage.handleWishlist` was a UI stub with no API calls wired.
3. `useCancelOrder.onSuccess` uses `['orders']` instead of `['my-orders']` for cache invalidation.
4. COD stock decrement uses an unconditional `$inc` with no `$gte` atomic guard.
5. No typed referral methods in `ApiClient`; callsites use inconsistent URL strings.
6. `useLogin.onSuccess` manually writes `authToken` to localStorage redundantly alongside Zustand persist.

## Fix Implementation

Each fix is surgical and limited to the defective code path. Full code-level details are in the per-bug sections below.

---

## Glossary

- **Bug_Condition (C)**: The condition under which a specific input triggers the defective code path.
- **Property (P)**: The correct observable outcome when the fixed code handles a buggy input.
- **Preservation**: Behavior of non-buggy inputs that must be identical before and after the fix.
- **isBugCondition(X)**: Pseudocode predicate that returns `true` when input `X` triggers a given bug.
- **F**: Original (unfixed) function. **F'**: Fixed function.
- **Redis OTP key**: `otp:reset:{email}` — key used by the password reset flow in Redis.
- **Verified flag key**: `reset_verified:{email}` — short-lived Redis key set after OTP verification.
- **`matasree-auth`**: Zustand persist key written to `localStorage` by the auth store.
- **`authToken`**: Flat `localStorage` key written manually by `useLogin` (the duplicate — to be removed).
- **`['my-orders']`**: The canonical React Query cache key used by `useOrders` hook.
- **`$gte` guard**: MongoDB atomic conditional update `{ stock: { $gte: qty } }` preventing negative stock.

---

## Bug 1: Password Reset Flow Broken

### Bug Details

#### Bug Condition

The two-step reset flow (`POST /api/auth/verify-reset-otp` → `POST /api/auth/reset-password`) fails
because `verifyPasswordResetOtp` deletes the OTP key from Redis at step 1, leaving nothing for
`resetPassword` to validate at step 2.

**Formal Specification:**
```
FUNCTION isBugCondition_1(X)
  INPUT: X = { email, otp, timeBetweenCalls, verifyOtpCalled, resetPasswordCalled }
  OUTPUT: boolean

  RETURN X.verifyOtpCalled = true
    AND X.resetPasswordCalled = true
    AND X.timeBetweenCalls < OTP_TTL_SECONDS (300)
    AND redisClient.get("otp:reset:" + X.email) = null   // OTP was deleted at step 1
END FUNCTION
```

**Concrete Examples:**
- User requests OTP → receives it → calls verify-reset-otp (succeeds, OTP deleted) → calls
  reset-password within 2 minutes → **400 "OTP not found or expired"** ❌
- User calls reset-password with an OTP that was never verified → **400 "OTP not found or expired"** ✅ (correct rejection)

#### Expected Behavior (Preservation Requirements)

**Unchanged Behaviors:**
- Submitting an unverified or expired OTP directly to `resetPassword` SHALL still return 400.
- `sendPasswordResetOtp` behavior and the `otp:reset:{email}` key structure are unchanged.
- All other OTP flows (email OTP, mobile OTP) are unaffected.

### Hypothesized Root Cause

`verifyPasswordResetOtp` (line `await deleteOTP(key)` before the success response) destroys the OTP
immediately. `resetPassword` then reads the same key and finds nothing. The two-step design requires
OTP presence to span both calls, but deletion at step 1 makes step 2 impossible.

### Fix Implementation

**File:** `matasree-backend/src/controllers/authController.ts`

**Function:** `verifyPasswordResetOtp` and `resetPassword`

**Specific Changes:**

1. **`verifyPasswordResetOtp` — replace `deleteOTP(key)` with a verified flag write:**

   Current code (the bug):
   ```typescript
   await deleteOTP(key);
   res.status(200).json(new ApiResponse(true, 'OTP verified successfully'));
   ```

   Fixed code:
   ```typescript
   // Do NOT delete the OTP key yet — resetPassword still needs it.
   // Instead, set a short-lived "verified" flag (10 min TTL).
   const verifiedFlagKey = `reset_verified:${email}`;
   await redisClient.set(verifiedFlagKey, '1', 'EX', 600); // 10 minutes
   res.status(200).json(new ApiResponse(true, 'OTP verified successfully'));
   ```

2. **`resetPassword` — check the verified flag instead of re-reading the raw OTP:**

   Current code (the bug):
   ```typescript
   const stored = await getOTP(key);
   if (!stored) return res.status(400).json(new ApiResponse(false, 'OTP not found or expired', null, 400));
   if (stored.otp !== otp) return res.status(400).json(new ApiResponse(false, 'Invalid OTP', null, 400));

   const user = await User.findOne({ email });
   // ...
   await deleteOTP(key);
   ```

   Fixed code:
   ```typescript
   const verifiedFlagKey = `reset_verified:${email}`;
   const isVerified = await redisClient.get(verifiedFlagKey);
   if (!isVerified) {
     return res.status(400).json(new ApiResponse(false, 'OTP not verified or session expired', null, 400));
   }

   const user = await User.findOne({ email });
   if (!user) return res.status(404).json(new ApiResponse(false, 'User not found', null, 404));

   user.password = await hashPassword(newPassword);
   await user.save();
   // Clean up both the original OTP key and the verified flag
   await deleteOTP(key);
   await redisClient.del(verifiedFlagKey);

   await revokeAllTokens(user._id.toString());
   // ...
   ```

   **Note:** The `otp` and `newPassword` fields remain in the `resetPasswordSchema` for backward
   compatibility, but the OTP is no longer re-validated at this step — the verified flag is sufficient.
   The raw OTP key is cleaned up here to avoid orphaned Redis keys.

---

## Bug 2: Product Detail Wishlist Button Not Persisting

### Bug Details

#### Bug Condition

`handleWishlist` in `ProductDetailsPage.tsx` only toggles local React state and shows a toast.
It makes zero API calls. `ProductCard.tsx` has the correct implementation as reference.

**Formal Specification:**
```
FUNCTION isBugCondition_2(X)
  INPUT: X = { sourceComponent, userIsAuthenticated, wishlistButtonClicked }
  OUTPUT: boolean

  RETURN X.sourceComponent = "ProductDetailsPage"
    AND X.userIsAuthenticated = true
    AND X.wishlistButtonClicked = true
END FUNCTION
```

**Concrete Examples:**
- Authenticated user clicks heart on ProductDetailsPage → state toggles, toast shows, page refreshes →
  **heart is back to original state, no backend record** ❌
- Authenticated user clicks heart on ProductCard → state toggles, API call made, persists on refresh ✅

#### Expected Behavior (Preservation Requirements)

**Unchanged Behaviors:**
- `ProductCard.tsx` `handleWishlist` implementation is not touched.
- `useWishlistStore` addItem/removeItem API is unchanged.
- Unauthenticated users clicking wishlist on ProductDetailsPage: should prompt login (same as ProductCard).

### Hypothesized Root Cause

`handleWishlist` was coded as a UI stub — toggling `isWishlisted` local state and calling `toast.success`
without any `apiClient` call. The wishlist store (`useWishlistStore`) and the API methods
(`apiClient.addToWishlist`, `apiClient.removeFromWishlist`) already exist; they just weren't wired.

### Fix Implementation

**File:** `matasree-superstore-main/src/pages/ProductDetailsPage.tsx`

**Imports to add** (near top, with existing imports):
```typescript
import { useWishlistStore } from '@/store/wishlistStore';
```

**State change** — replace the local `isWishlisted` state with the store-derived value:

Current code:
```typescript
const [isWishlisted, setIsWishlisted] = useState(false);
```

Fixed code (remove the useState line; derive from store instead):
```typescript
const { isWishlisted: isWishlistedFn, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
// Derived — no local state needed
const isWishlisted = product ? isWishlistedFn(product._id) : false;
```

Note: the `isWishlisted` variable name stays the same so all JSX references remain valid.

**`handleWishlist` function** — replace the stub with the full pattern from ProductCard:

Current code (the bug):
```typescript
const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
};
```

Fixed code:
```typescript
const handleWishlist = async () => {
    if (!isAuthenticated) {
        toast.error('Please log in to add to wishlist');
        return;
    }
    if (!product) return;

    const wishlistItem = {
        id: product._id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        category: typeof product.category === 'string' ? product.category : product.category?.name,
        rating: product.rating,
    };

    if (isWishlisted) {
        // Optimistic remove
        removeFromWishlist(product._id);
        toast.success('Removed from wishlist');
        try {
            await apiClient.removeFromWishlist(product._id);
        } catch {
            // Revert on error
            addToWishlist(wishlistItem);
            toast.error('Failed to update wishlist');
        }
    } else {
        // Optimistic add
        addToWishlist(wishlistItem);
        toast.success('Added to wishlist');
        try {
            await apiClient.addToWishlist(product._id);
        } catch {
            // Revert on error
            removeFromWishlist(product._id);
            toast.error('Failed to update wishlist');
        }
    }
};
```

---

## Bug 3: Cancel Order — Orders List Does Not Refresh

### Bug Details

#### Bug Condition

`useCancelOrder` invalidates `['orders']` in `onSuccess`, but `useOrders` registers its cache
entry under `['my-orders']`. These never match, so the list query is never refetched.

**Formal Specification:**
```
FUNCTION isBugCondition_3(X)
  INPUT: X = { cancelSucceeded, invalidatedKey, activeQueryKey }
  OUTPUT: boolean

  RETURN X.cancelSucceeded = true
    AND X.invalidatedKey = "orders"
    AND X.activeQueryKey = "my-orders"
    AND queryCache.find(["my-orders"]).isStale = false  // cache was NOT invalidated
END FUNCTION
```

**Concrete Examples:**
- User cancels order → mutation succeeds → `invalidateQueries(['orders'])` fires → **list still shows
  "confirmed"** because `['my-orders']` cache is untouched ❌
- After navigating away and back, `useOrders` refetches `['my-orders']` → now shows "cancelled" ✅ (but delayed)

#### Expected Behavior (Preservation Requirements)

**Unchanged Behaviors:**
- `useOrders` query key `['my-orders']` is NOT changed.
- `useOrder(id)` query key `['order', id]` is NOT changed.
- `useCreateOrder` invalidation logic is separate and not touched in this fix.

### Hypothesized Root Cause

Inconsistent naming: `useOrders` uses `['my-orders']` (matches the API path `/orders/my-orders`),
but `useCancelOrder.onSuccess` was written with the generic key `['orders']`. A one-line correction
fixes both the list and the detail view.

### Fix Implementation

**File:** `matasree-superstore-main/src/hooks/useApi.ts`

**Function:** `useCancelOrder`

Current code (the bug):
```typescript
export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.cancelOrder(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });   // ← wrong key
    },
  });
};
```

Fixed code:
```typescript
export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.cancelOrder(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });   // detail view
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });   // list view — was ['orders']
    },
  });
};
```

**Also fix `useCreateOrder`** — it has the same wrong key `['orders']`, which means the orders list
is also stale after a new order is placed:

Current code:
```typescript
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });   // ← wrong key
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};
```

Fixed code:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['my-orders'] });   // was ['orders']
  queryClient.invalidateQueries({ queryKey: ['cart'] });
},
```

---

## Bug 4: COD Orders Race Condition — Stock Can Go Negative

### Bug Details

#### Bug Condition

The COD branch in `createOrder` uses an unconditional `$inc: { stock: -item.quantity }` with no
availability guard. Concurrent COD requests for the same low-stock product can both pass the pre-check
(which reads a snapshot) and both decrement, driving stock below zero.

**Formal Specification:**
```
FUNCTION isBugCondition_4(X)
  INPUT: X = { paymentMethod, productId, requestedQuantity, availableStock, concurrentRequests }
  OUTPUT: boolean

  RETURN X.paymentMethod = "cod"
    AND X.concurrentRequests >= 2
    AND X.requestedQuantity * X.concurrentRequests >= X.availableStock
    AND Product.findById(X.productId).stock < 0  // stock went negative
END FUNCTION
```

**Concrete Examples:**
- Stock = 1, two simultaneous COD orders for qty=1: both pass the pre-check, both decrement →
  **stock = -1** ❌
- Razorpay orders with same scenario: first order's atomic `$gte` guard wins; second gets
  `updatedProduct = null` → rollback + 400 ✅

#### Expected Behavior (Preservation Requirements)

**Unchanged Behaviors:**
- Razorpay branch atomic decrement logic is NOT touched.
- Single (non-concurrent) COD orders with sufficient stock continue to succeed.
- The pre-check loop above the payment split is NOT removed (it remains an early fast-fail).
- Stock rollback pattern (already present in Razorpay branch) is replicated to COD.

### Hypothesized Root Cause

The COD branch was left with a simple `findByIdAndUpdate + $inc` without the `$gte` conditional that
was specifically added to the Razorpay branch. The pre-check snapshot is racy — it does not hold
a lock between reading and writing stock.

### Fix Implementation

**File:** `matasree-backend/src/controllers/orderController.ts`

**Function:** `createOrder` — the `else` (COD) branch inside the stock-handling section.

Current code (the bug):
```typescript
} else {
  await Payment.create({
    orderId: order._id,
    userId: req.user?.userId,
    amount: totalAmount,
    status: 'pending',
    method: 'cod',
  });

  // For COD orders, keep existing $inc behaviour unchanged
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { sold: item.quantity, stock: -item.quantity }
    });
  }
}
```

Fixed code:
```typescript
} else {
  await Payment.create({
    orderId: order._id,
    userId: req.user?.userId,
    amount: totalAmount,
    status: 'pending',
    method: 'cod',
  });

  // Atomic conditional stock decrement for COD orders — mirrors Razorpay branch (Bug 4 fix)
  const decrementedItemsCOD: Array<{ productId: any; quantity: number }> = [];
  let rollbackNeededCOD = false;
  let failedItemNameCOD = '';

  for (const item of orderItems) {
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity, sold: item.quantity } },
      { new: true }
    );

    if (!updatedProduct) {
      rollbackNeededCOD = true;
      failedItemNameCOD = item.name;
      break;
    }
    decrementedItemsCOD.push({ productId: item.productId, quantity: item.quantity });
  }

  if (rollbackNeededCOD) {
    // Rollback already decremented items
    for (const decItem of decrementedItemsCOD) {
      await Product.findByIdAndUpdate(decItem.productId, {
        $inc: { stock: decItem.quantity, sold: -decItem.quantity }
      });
    }
    // Delete order and payment
    await Order.findByIdAndDelete(order._id);
    await Payment.deleteOne({ orderId: order._id });

    return res.status(400).json(
      new ApiResponse(false, `Product "${failedItemNameCOD}" is out of stock`, null, 400)
    );
  }
}
```

---

## Bug 5: Referral API — Frontend URL Path Inconsistency

### Bug Details

#### Bug Condition

No typed referral methods exist in `ApiClient`. Every callsite that needs referral data writes its
own URL string. The backend routes are mounted at `/api/referral` (singular), but any callsite that
guesses `/referrals` (plural) gets a 404.

**Formal Specification:**
```
FUNCTION isBugCondition_5(X)
  INPUT: X = { calledPath, typedMethodExists }
  OUTPUT: boolean

  canonical_referral_paths = ["/referral/my-code", "/referral/history", "/referral/apply", "/referral/"]
  RETURN X.typedMethodExists = false
    OR X.calledPath NOT IN canonical_referral_paths
END FUNCTION
```

**Concrete Examples:**
- Frontend calls `apiClient.get('/referrals/my-code')` → **404** because route is `/referral/my-code` ❌
- Frontend calls `apiClient.get('/referral/my-code')` directly → works, but untyped ⚠️
- Frontend calls `apiClient.getReferralCode()` → always hits `/referral/my-code` ✅

#### Expected Behavior (Preservation Requirements)

**Unchanged Behaviors:**
- No existing `ApiClient` methods are modified.
- Backend referral routes are not changed.
- All non-referral API calls are unaffected.

**Canonical Paths (from `referralRoutes.ts`):**
| Method | Path | Controller |
|--------|------|------------|
| GET | `/api/referral/my-code` | `getMyCode` |
| GET | `/api/referral/history` | `getReferralHistory` |
| POST | `/api/referral/apply` | `applyCode` |

### Hypothesized Root Cause

Referral methods were never added to `ApiClient` during initial development. The generic `.get()` /
`.post()` escape hatch was used, leaving URL strings scattered and inconsistent.

### Fix Implementation

**File:** `matasree-superstore-main/src/services/api.ts`

**Location:** Add the three methods to the `ApiClient` class, after the existing `setDefaultAddress`
method and before the generic `get`/`post`/`put`/`delete` methods at the bottom.

**Code to add:**
```typescript
// Referral endpoints (Bug 5 fix — canonical typed methods targeting /referral/* singular)
getReferralCode() {
  return this.client.get('/referral/my-code');
}

applyReferralCode(code: string) {
  return this.client.post('/referral/apply', { code });
}

getReferralHistory() {
  return this.client.get('/referral/history');
}
```

**Callsite updates:** Any frontend component currently calling
`apiClient.get('/referrals/...')` or `apiClient.post('/referrals/...')` must be updated to use the
new typed methods. Search pattern to locate callsites:

```
grep -r "referral" matasree-superstore-main/src --include="*.ts" --include="*.tsx" -n
```

Update each callsite:
- `apiClient.get('/referral/my-code')` → `apiClient.getReferralCode()`
- `apiClient.get('/referral/history')` → `apiClient.getReferralHistory()`
- `apiClient.post('/referral/apply', { code })` → `apiClient.applyReferralCode(code)`

---

## Bug 6: useLogin Hook — Double localStorage Write Causing State Desync

### Bug Details

#### Bug Condition

`useLogin.onSuccess` manually writes `authToken` and `user` to flat localStorage keys. `authStore`
(Zustand persist) writes the same token to `matasree-auth`. When the axios interceptor on a
token-refresh cycle writes the new token to `localStorage.setItem('authToken', newAccessToken)`,
the flat key stays current. But when Zustand rotates state internally (e.g., via `setToken`), the
flat `authToken` key becomes stale — causing the request interceptor to send an outdated `Bearer`
header.

**Formal Specification:**
```
FUNCTION isBugCondition_6(X)
  INPUT: X = { useLoginMutationFired, manualLocalStorageWritePresent, zustandPersistActive }
  OUTPUT: boolean

  RETURN X.useLoginMutationFired = true
    AND X.manualLocalStorageWritePresent = true
    AND X.zustandPersistActive = true
    AND localStorage.getItem("authToken") !== null  // flat key still exists
END FUNCTION
```

**Concrete Examples:**
- Login fires → `useLogin.onSuccess` writes `localStorage.authToken = "tokenA"` and Zustand
  writes `matasree-auth.token = "tokenA"` → token refreshes → Zustand updates to `"tokenB"` but
  flat `authToken` is only updated by the refresh interceptor → **desync if interceptor path is skipped** ❌
- After fix: login fires → only `authStore.login()` runs → Zustand persist writes `matasree-auth.token`
  → request interceptor reads from `authToken` flat key written by the refresh path → single source ✅

#### Expected Behavior (Preservation Requirements)

**Unchanged Behaviors:**
- The axios request interceptor (`localStorage.getItem('authToken')`) continues to work because:
  - On first login the token lands in `authToken` via the refresh interceptor path (already in `api.ts`).
  - Actually: `authStore.login()` in `authStore.ts` calls `apiClient.login()` which goes through the
    response interceptor — but the token comes back in `response.data.accessToken` and the store sets
    it in Zustand. The request interceptor reads `localStorage.getItem('authToken')`.
  - **Important:** After removing the manual writes from `useLogin`, the `authToken` flat key must
    still be populated for the request interceptor. The correct place to write it is in `authStore.login()`
    (which calls `apiClient.login` and then `set({ token: accessToken })`). We must also write
    `localStorage.setItem('authToken', accessToken)` there, OR update the request interceptor to
    read from Zustand instead.
- `useRegister.onSuccess` manual write (`localStorage.setItem('authToken', ...)`) is removed for the
  same reason.
- `useLogout.onSuccess` cleanup (`localStorage.removeItem('authToken')`) MUST remain.
- Login persistence across page refreshes continues to work via Zustand persist + `matasree-auth`.

### Hypothesized Root Cause

`useLogin` was written to manually manage localStorage before `authStore.login()` fully handled
persistence. After Zustand persist was added to `authStore`, the manual writes became redundant and
created a second, independent storage location.

### Fix Implementation

**File:** `matasree-superstore-main/src/hooks/useApi.ts`

**Step 1 — Remove manual writes from `useLogin.onSuccess`:**

Current code (the bug):
```typescript
export const useLogin = () => {
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      apiClient.login(credentials),
    onSuccess: (response) => {
      localStorage.setItem('authToken', response.data.accessToken);   // ← remove
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));  // ← remove
      }
    },
  });
};
```

Fixed code:
```typescript
export const useLogin = () => {
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      apiClient.login(credentials),
    // onSuccess intentionally empty — authStore.login() handles all storage via Zustand persist.
    // The axios request interceptor reads localStorage 'authToken' which is written by authStore.
  });
};
```

**Step 2 — Remove manual write from `useRegister.onSuccess` (same pattern):**

Current code:
```typescript
export const useRegister = () => {
  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string }) =>
      apiClient.register(data),
    onSuccess: (response) => {
      localStorage.setItem('authToken', response.data.accessToken);   // ← remove
    },
  });
};
```

Fixed code:
```typescript
export const useRegister = () => {
  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string }) =>
      apiClient.register(data),
    // onSuccess intentionally empty — authStore.register() handles storage.
  });
};
```

**Step 3 — Ensure `authStore.login()` writes `authToken` flat key for the request interceptor:**

`authStore.login()` already calls `set({ token: accessToken, ... })`. Zustand persist serializes
this to `matasree-auth`. However, the request interceptor in `api.ts` reads
`localStorage.getItem('authToken')` (flat key). To avoid changing the interceptor (which would be a
larger refactor), `authStore.login()` must also write the flat key.

**File:** `matasree-superstore-main/src/store/authStore.ts`

**Function:** `login` action, after `set({...})` call:

```typescript
login: async (email: string, password: string) => {
  set({ isLoading: true, error: null });
  try {
    const response = await apiClient.login({ email, password });
    const { accessToken, user } = response.data;
    const normalizedUser = { ...user, _id: user._id || user.id, id: user._id || user.id };

    set({
      user: normalizedUser,
      token: accessToken,
      isAuthenticated: true,
      isLoading: false,
    });

    // Keep the flat key in sync for the axios request interceptor (Bug 6 fix)
    localStorage.setItem('authToken', accessToken);
  } catch (error: any) {
    // ...unchanged
  }
},
```

Apply the same `localStorage.setItem('authToken', accessToken)` line to the `register` action in
`authStore.ts`.

---

---

## Correctness Properties

Property 1: Bug Condition — Password Reset Completability

_For any_ request where `verifyPasswordResetOtp` has been called successfully for an email and
`resetPassword` is called for the same email within 10 minutes, the fixed `resetPassword` function
SHALL return HTTP 200 and update the user's password in the database.

**Validates: Requirements 1.1, 1.2**

Property 2: Preservation — Unverified OTP Rejection

_For any_ request where `verifyPasswordResetOtp` has NOT been called (no verified flag in Redis),
the fixed `resetPassword` SHALL return HTTP 400 "OTP not verified or session expired", identical to
the original rejection behavior for missing OTPs.

**Validates: Requirements 1.3, 1.4**

Property 3: Bug Condition — Wishlist API Persistence

_For any_ authenticated user clicking the wishlist button on `ProductDetailsPage`, the fixed
`handleWishlist` function SHALL call `apiClient.addToWishlist` or `apiClient.removeFromWishlist`,
update `useWishlistStore`, and reflect the same state after a page refresh.

**Validates: Requirements 2.1, 2.2**

Property 4: Preservation — ProductCard Wishlist Unchanged

_For any_ wishlist interaction on `ProductCard`, the fixed code SHALL produce exactly the same
behavior as before — the `ProductCard.handleWishlist` function is not modified.

**Validates: Requirements 2.3, 2.4**

Property 5: Bug Condition — Cancel Order Cache Invalidation

_For any_ successful order cancellation, the fixed `useCancelOrder.onSuccess` SHALL invalidate
`['my-orders']` (causing `useOrders` to refetch) and `['order', id]` (causing `useOrder(id)` to
refetch), so both the list and detail view show "cancelled" without manual navigation.

**Validates: Requirements 3.1, 3.2**

Property 6: Bug Condition — COD Stock Non-Negativity

_For any_ set of concurrent COD orders whose total requested quantity meets or exceeds available
stock, the fixed `createOrder` COD branch SHALL use an atomic `$gte` conditional update such that
`Product.stock` never goes below 0 and excess orders receive HTTP 400.

**Validates: Requirements 4.1, 4.2**

Property 7: Preservation — Razorpay Stock Decrement Unchanged

_For any_ Razorpay order, the fixed code SHALL produce exactly the same stock decrement behavior as
before — the Razorpay branch in `createOrder` is not modified.

**Validates: Requirements 4.3, 4.4**

Property 8: Bug Condition — Referral API Canonical Routing

_For any_ referral API call made through the typed `ApiClient` methods, the HTTP request path SHALL
be one of `["/referral/my-code", "/referral/history", "/referral/apply"]` and SHALL NOT return 404.

**Validates: Requirements 5.1, 5.2**

Property 9: Bug Condition — Single Auth Storage Source

_For any_ successful login mutation via `useLogin`, `localStorage.getItem("authToken")` after login
SHALL equal the token in `authStore.getState().token` (both written from the same source in
`authStore.login()`), and no second write of `"authToken"` from `useLogin.onSuccess` SHALL occur.

**Validates: Requirements 6.1, 6.2**

Property 10: Preservation — Login Persistence Across Refresh

_For any_ page refresh after login, the Zustand persist middleware SHALL hydrate `isAuthenticated`,
`token`, and `user` from `matasree-auth`, and the user SHALL remain logged in — unchanged behavior.

**Validates: Requirements 6.3, 6.4**

---

## Testing Strategy

### Validation Approach

Each bug follows a two-phase approach:
1. Write tests against **unfixed code** to confirm the counterexample and validate root cause.
2. Apply the fix and run the same tests to confirm they pass, plus preservation tests.

### Exploratory Bug Condition Checking

**Bug 1 (Password Reset):**
- Call `verifyPasswordResetOtp` with valid OTP → assert Redis key `otp:reset:{email}` is DELETED
  (confirms the bug on unfixed code).
- Immediately call `resetPassword` with same OTP → assert 400 returned (confirms consequence).

**Bug 2 (Wishlist):**
- Spy on `apiClient.addToWishlist` and `apiClient.removeFromWishlist`.
- Render `ProductDetailsPage`, click heart button → assert spy was **never called** (confirms bug).

**Bug 3 (Cache Invalidation):**
- Use React Query test utilities to inspect the query cache after `useCancelOrder` fires.
- Assert that the cache entry for `['my-orders']` is NOT marked stale (confirms the miss).

**Bug 4 (COD Race Condition):**
- Set product stock to 1. Fire two concurrent `createOrder` COD requests for qty=1.
- Assert `Product.stock` is -1 after both complete (confirms race condition on unfixed code).

**Bug 5 (Referral 404):**
- Call `apiClient.get('/referrals/my-code')` against the running backend.
- Assert HTTP 404 is returned (confirms the wrong-path bug).

**Bug 6 (Double localStorage):**
- Spy on `localStorage.setItem`. Fire `useLogin` mutation.
- Assert `setItem('authToken', ...)` is called from BOTH `useLogin.onSuccess` AND implicitly
  (confirms duplication on unfixed code).

### Fix Checking

```
FOR ALL X WHERE isBugCondition_N(X) DO
  result := fixedFunction(X)
  ASSERT expectedBehavior_N(result)
END FOR
```

### Preservation Checking

```
FOR ALL X WHERE NOT isBugCondition_N(X) DO
  ASSERT originalFunction(X) = fixedFunction(X)
END FOR
```

**Property-based testing is recommended for Bugs 4 and 6** because:
- Bug 4: Arbitrary concurrent request counts and stock levels should all maintain `stock >= 0`.
- Bug 6: Any sequence of login/refresh/logout operations should keep `authToken == authStore.token`.

### Unit Tests

- **Bug 1:** Unit test `verifyPasswordResetOtp` to assert it writes `reset_verified:{email}` to Redis
  and does NOT delete `otp:reset:{email}`. Unit test `resetPassword` to assert it reads the verified
  flag, not the OTP.
- **Bug 2:** Render `ProductDetailsPage` with mocked auth and product. Click heart. Assert
  `apiClient.addToWishlist` called with correct `productId`. Click again. Assert
  `apiClient.removeFromWishlist` called. Assert `useWishlistStore` reflects both states.
- **Bug 3:** Test `useCancelOrder` mutation hook. After `onSuccess`, assert
  `queryClient.invalidateQueries` was called with `['my-orders']` and `['order', id]`.
- **Bug 4:** Unit test the COD branch with a mock `Product.findOneAndUpdate` that returns `null`
  on the second call. Assert order is deleted, payment is deleted, stock is rolled back, 400 returned.
- **Bug 5:** Instantiate `ApiClient` in a test. Call `getReferralCode()`, `applyReferralCode('X')`,
  `getReferralHistory()`. Assert the axios requests hit the correct paths.
- **Bug 6:** Mock `localStorage`. Fire `useLogin`. Assert `setItem('authToken')` is called exactly
  once (from `authStore.login()`) and NOT from `useLogin.onSuccess`.

### Property-Based Tests

- **Bug 4:** Generate random `(stock, concurrentOrders, qtyPerOrder)` triples where
  `concurrentOrders * qtyPerOrder >= stock`. Fire all orders concurrently against fixed code.
  Assert `finalStock >= 0` for all generated inputs.
- **Bug 6:** Generate random sequences of (login, refresh, setToken, logout). Assert that after
  each step, `localStorage.getItem('authToken') === authStore.getState().token` (or null if logged out).

### Integration Tests

- **Bug 1:** End-to-end: request OTP → verify OTP → reset password → login with new password.
- **Bug 2:** Add product to wishlist from detail page → navigate away → return → assert heart is
  filled; refresh page → assert heart is still filled.
- **Bug 3:** Cancel an order from `OrderDetailPage` → assert `OrdersPage` list shows "cancelled"
  without navigating away and back.
- **Bug 4:** Run two simultaneous COD order requests against a seeded DB with 1 unit of stock.
  Assert exactly one succeeds and one returns 400, and final stock is 0.
- **Bug 5:** Log in → navigate to referral page → assert referral code loads without 404.
- **Bug 6:** Log in → check Network tab → all subsequent API requests carry the correct (latest)
  `Authorization: Bearer` token; no stale token headers observed.
