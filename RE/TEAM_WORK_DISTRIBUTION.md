# 👥 Team Work Distribution - Matasree Super
> **Focus**: Major development workload assigned to Priyanshu and Shreya for Core System and Backend Logic.

## 🚀 Core Development Team (Major Workload)

### 1. 👨‍💻 Priyanshu Bansal (Full Stack Lead)
**Responsibility**: Critical System Architecture, Security, & Payments.
**Complexity**: High ⭐⭐⭐⭐⭐

*   **Authentication & Security (Priority: Critical)**
    *   [ ] **Fix Mobile OTP**: Finalize the OTP bypass or fix Twilio integration for user registration.
    *   [ ] **Forgot Password Flow**: Ensure the entire secure reset flow helps users recover accounts.
    *   [ ] **Route Protection**: Implement strictly protected routes for Admin/User roles in middleware.
*   **Commerce Engine**
    *   [ ] **Checkout Logic**: Handle complex cart validations (stock checks, price changes).
    *   [ ] **Payment Gateway**: Implement Razorpay/Stripe integration (or robust mock payment) handling success/failure webhooks.
    *   [ ] **Order Generation**: Ensure atomic transactions when converting Cart -> Order to prevent data inconsistency.

### 2. 👩‍💻 Shreya Jain (Backend & Admin Lead)
**Responsibility**: Data Management, Admin Dashboards, & API Logic.
**Complexity**: High ⭐⭐⭐⭐⭐

*   **Admin Dashboard Implementation**
    *   [ ] **Order Management**: Build `AdminOrders.tsx` with ability to Filter, Sort, and Update Status (Pending → Shipped).
    *   [ ] **User Management**: Build `AdminUsers.tsx` to view customer details and history.
    *   [ ] **Analytics**: Create dashboard widgets for "Total Sales", "Recent Orders", and "Top Customer".
*   **Backend API Development**
    *   [ ] **API Endpoints**: Write secure endpoints for Admin actions (`PATCH /orders/:id/status`, `GET /users`).
    *   [ ] **Database Queries**: Optimize MongoDB queries (Aggregation pipelines) for analytics and reporting.
    *   [ ] **Inventory Logic**: specific logic for stock deduction upon order completion.

---

## 🎨 Design & Operations Team (Support & Polish)

### 3. 👩‍🎨 Pakhi Morya (Frontend & UX)
**Responsibility**: Visual Identity, Responsive Design, & User Experience.
**Complexity**: Medium ⭐⭐⭐

*   **Visual Polish**
    *   [ ] **Traditional Theme**: Enforce the "Matasree" brand (Red/Gold aesthetic) across all pages.
    *   [ ] **Micro-Interactions**: Add hover states, loading skeletons, and smooth transitions.
*   **Responsiveness**
    *   [ ] **Mobile Optimization**: Fix Navbar/Sidebar menus and Product Grids for phone screens.
    *   [ ] **Asset Management**: Ensure all Category and Product images load correctly (fix broken links).

### 4. 👨‍🔧 Sanjay Singh (QA & DevOps)
**Responsibility**: Testing, Deployment, & Production Readiness.
**Complexity**: Medium ⭐⭐⭐

*   **Quality Assurance**
    *   [ ] **E2E Testing**: Execute the full "User Journey" (Register → Browse → Buy) to stress-test Priyanshu's and Shreya's code.
    *   [ ] **Bug Reporting**: Document UI glitches or API failures in `IMPROVEMENTS_REPORT.md`.
*   **DevOps & Deployment**
    *   [ ] **Production Env**: Set up MongoDB Atlas cluster and `.env.production` variables.
    *   [ ] **Hosting**: Deploy Frontend (Vercel) and Backend (Render/Railway).
