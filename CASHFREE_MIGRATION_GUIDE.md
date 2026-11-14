# Cashfree Payments Production Migration & Setup Guide

This guide details the steps required to configure, test, and deploy **Cashfree Payments** integration for the Matasree Store application.

---

## 1. Environment Configuration

### Backend (`matasree-backend/.env`)
Add the following keys (obtained from [Cashfree Merchant Dashboard](https://merchant.cashfree.com/)):

```env
# Cashfree Payments Configuration
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_ENVIRONMENT=SANDBOX  # Set to PRODUCTION when deploying live
CASHFREE_WEBHOOK_SECRET=your_cashfree_webhook_secret
```

### Frontend (`matasree-superstore-main/.env.local`)

```env
# Cashfree Mode
VITE_CASHFREE_MODE=sandbox  # Set to production when deploying live
```

---

## 2. Cashfree Merchant Dashboard Configuration

1. Log in to [Cashfree Merchant Dashboard](https://merchant.cashfree.com/).
2. Navigate to **Payment Gateway** > **Developers** > **API Keys**.
3. Copy your `App ID` and `Secret Key` for Sandbox / Production.
4. Navigate to **Webhooks** > **Add Webhook Endpoint**:
   - **Webhook URL**: `https://your-domain.com/api/webhooks/cashfree`
   - **Events**:
     - `PAYMENT_SUCCESS_WEBHOOK`
     - `PAYMENT_FAILED_WEBHOOK`
     - `PAYMENT_USER_DROPPED`
     - `REFUND_STATUS_WEBHOOK`
   - Copy the generated Webhook Secret Key to `CASHFREE_WEBHOOK_SECRET`.

---

## 3. Architecture & API Workflows

### Checkout Flow
1. **Order Initiation**: User clicks "Review & Pay" on Checkout page (`/checkout`).
2. **Payment Session Creation**: Backend endpoint `POST /api/orders` creates order and invokes `createCashfreeOrder()`, generating a unique `payment_session_id`.
3. **Cashfree JS Modal**: Frontend opens modal via `@cashfreepayments/cashfree-js` SDK (`cashfree.checkout({ paymentSessionId, redirectTarget: '_modal' })`).
4. **Verification & Completion**: After payment interaction, frontend calls `POST /api/orders/verify-payment`. Backend verifies status via `Cashfree.PGFetchOrder` and updates DB status to `paid` and `confirmed`.
5. **Webhook Fallback**: Webhook `POST /api/webhooks/cashfree` asynchronously handles background status updates with HMAC SHA256 signature verification and idempotency check.

### Refund Flow
1. Admin opens order details on Admin Panel (`/admin`).
2. Initiates full or partial refund (`POST /api/orders/:id/refund`).
3. Backend executes `createCashfreeRefund()` via Cashfree API (`Cashfree.PGOrderCreateRefund`).
4. Automated email notification (`sendRefundCompletedEmail`) sent to customer with refund reference ID.

---

## 4. Testing Checklist

- [x] **UPI Payment**: Test Google Pay / PhonePe / Paytm UPI flow in Sandbox mode.
- [x] **Card Payment**: Test Credit/Debit Card checkout flow in Sandbox mode.
- [x] **Net Banking / Wallets**: Verify modal tab navigation and response.
- [x] **Cancelled Payment**: Dismiss modal and verify session clean up without order corruption.
- [x] **Webhook Verification**: Test webhook HMAC signature verification & duplicate payload idempotency.
- [x] **Refund System**: Perform Admin full and partial refund testing.
- [x] **Email & Invoice**: Confirm GST Tax Invoice generation and payment success receipt delivery.

---

## 5. Production Deployment Steps

1. Update `.env` variables to `CASHFREE_ENVIRONMENT=PRODUCTION` and provide production `CASHFREE_APP_ID` & `CASHFREE_SECRET_KEY`.
2. Update frontend `.env.production` to `VITE_CASHFREE_MODE=production`.
3. Build backend (`npm run build` in `matasree-backend`) and restart Node service.
4. Build frontend (`npm run build` in `matasree-superstore-main`) and deploy Vite bundle.
