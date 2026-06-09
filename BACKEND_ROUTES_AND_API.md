# Matasree Super - Backend Routes & API Endpoints

## Overview
This document details all 11 route modules and their endpoints for the Matasree Super backend API.

**Base URL:** `http://localhost:5000/api`

---

## 🔐 Authentication & Authorization

### Token Types:
- **Access Token** - JWT token for API requests (short-lived)
- **Refresh Token** - For renewing access token (long-lived)

### Middleware:
- `verifyToken` - Requires valid JWT token
- `verifyAdmin` - Requires admin role
- `verifyCustomer` - Requires customer role (or higher)
- `upload.single('image')` - File upload handling

### Response Format:
```json
{
  "success": true/false,
  "message": "Description",
  "data": { /* response data */ },
  "statusCode": 200
}
```

---

## 📋 Route Modules Summary

| Module | Prefix | Purpose | Routes |
|--------|--------|---------|--------|
| Auth | `/auth` | User login/registration | 11 endpoints |
| Products | `/products` | Product management | 6 endpoints |
| Categories | `/categories` | Spice categories | 5 endpoints |
| Cart | `/cart` | Shopping cart | 5 endpoints |
| Orders | `/orders` | Order management | 6 endpoints |
| Addresses | `/addresses` | Delivery addresses | 6 endpoints |
| Admin | `/admin` | Admin dashboard | 4 endpoints |
| Partnerships | `/partnerships` | Partner applications | 5 endpoints |
| Reviews | `/reviews` | Customer reviews | 4 endpoints |
| Coupons | `/coupons` | Discount codes | 3 endpoints |
| Email | `/email` | Contact & newsletters | 2 endpoints |

---

## 1️⃣ **AUTH ROUTES** (`/api/auth`)

### **Registration & Login**

#### `POST /api/auth/register`
Register a new user account.
```
Status: 201 Created
Auth Required: ❌ No

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+91 9999999999"  // optional
}

Response:
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

#### `POST /api/auth/login`
Authenticate user with email and password.
```
Status: 200 OK
Auth Required: ❌ No

Request Body:
{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

### **Email OTP Verification**

#### `POST /api/auth/send-email-otp`
Send OTP to email address.
```
Request Body: { "email": "user@example.com" }
Response: { "success": true, "message": "OTP sent to email" }
```

#### `POST /api/auth/verify-email-otp`
Verify email OTP.
```
Request Body:
{
  "email": "user@example.com",
  "otp": "123456"
}
```

#### `POST /api/auth/resend-email-otp`
Resend OTP if expired.
```
Request Body: { "email": "user@example.com" }
```

---

### **Mobile OTP Verification**

#### `POST /api/auth/send-mobile-otp`
Send OTP to mobile phone.
```
Request Body: { "phone": "+91 9999999999" }
```

#### `POST /api/auth/verify-mobile-otp`
Verify mobile OTP.
```
Request Body:
{
  "phone": "+91 9999999999",
  "otp": "123456"
}
```

#### `POST /api/auth/resend-mobile-otp`
Resend OTP to mobile.
```
Request Body: { "phone": "+91 9999999999" }
```

---

### **Password Reset**

#### `POST /api/auth/forgot-password`
Request password reset.
```
Request Body: { "email": "user@example.com" }
Response: { "success": true, "message": "OTP sent to email" }
```

#### `POST /api/auth/verify-reset-otp`
Verify OTP for password reset.
```
Request Body:
{
  "email": "user@example.com",
  "otp": "123456"
}
```

#### `POST /api/auth/reset-password`
Reset password with new one.
```
Request Body:
{
  "email": "user@example.com",
  "newPassword": "newpassword123",
  "resetToken": "token_from_verify_otp"
}
```

---

### **Protected Routes**

#### `GET /api/auth/profile`
Get logged-in user profile.
```
Status: 200 OK
Auth Required: ✅ Yes

Headers: { Authorization: "Bearer access_token" }

Response:
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91 9999999999",
    "role": "customer",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### `PUT /api/auth/profile`
Update user profile.
```
Auth Required: ✅ Yes

Request Body:
{
  "name": "Jane Doe",
  "phone": "+91 9999999998"
}
```

#### `POST /api/auth/logout`
Logout user (clears tokens).
```
Auth Required: ✅ Yes
Status: 200 OK
```

---

## 2️⃣ **PRODUCT ROUTES** (`/api/products`)

### **Public Routes**

#### `GET /api/products`
Get all products with filtering.
```
Status: 200 OK
Auth Required: ❌ No

Query Parameters:
- search: "turmeric"          // Search by name/description
- category: "category_id"     // Filter by category
- minPrice: 100               // Minimum price
- maxPrice: 500               // Maximum price
- page: 1                     // Page number
- limit: 12                   // Items per page
- sort: "price|-price|rating|-rating|sold|-sold"

Response:
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "product_id",
        "name": "Premium Turmeric",
        "description": "...",
        "price": 299,
        "originalPrice": 399,
        "category": { "_id": "...", "name": "..." },
        "stock": 50,
        "image": "/uploads/products/image.jpg",
        "weight": "100g",
        "tags": ["organic", "pure"],
        "rating": 4.5,
        "sold": 150,
        "isNew": true,
        "isBestseller": true,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 12,
      "pages": 4
    }
  }
}
```

#### `GET /api/products/featured`
Get featured products.
```
Status: 200 OK
Auth Required: ❌ No

Response: { products: [...] }
```

#### `GET /api/products/:id`
Get single product details.
```
Status: 200 OK
Auth Required: ❌ No

Response:
{
  "success": true,
  "data": {
    "_id": "product_id",
    "name": "Premium Turmeric",
    "description": "...",
    "price": 299,
    // ... other fields
  }
}
```

---

### **Admin Routes**

#### `POST /api/products`
Create new product.
```
Status: 201 Created
Auth Required: ✅ Yes (Admin)

Request Body (FormData):
{
  "name": "Premium Turmeric",
  "description": "Pure, stone-ground turmeric",
  "price": 299,
  "originalPrice": 399,
  "category": "category_id",
  "stock": 100,
  "weight": "100g",
  "tags": ["organic", "pure"],
  "isNew": true,
  "isBestseller": false,
  "image": <file>  // Image file
}

Response: { success: true, data: { product } }
```

#### `PUT /api/products/:id`
Update existing product.
```
Status: 200 OK
Auth Required: ✅ Yes (Admin)

Request Body: Same as POST (FormData)
```

#### `DELETE /api/products/:id`
Delete product.
```
Status: 200 OK
Auth Required: ✅ Yes (Admin)
```

#### `POST /api/products/upload/image`
Upload product image.
```
Status: 200 OK
Auth Required: ✅ Yes (Admin)

Request Body (FormData):
{
  "image": <file>
}

Response:
{
  "success": true,
  "data": {
    "imageUrl": "/uploads/products/image.jpg"
  }
}
```

---

## 3️⃣ **CATEGORY ROUTES** (`/api/categories`)

### **Public Routes**

#### `GET /api/categories`
Get all spice categories.
```
Status: 200 OK
Auth Required: ❌ No

Response:
{
  "success": true,
  "data": [
    {
      "_id": "category_id",
      "name": "Turmeric",
      "slug": "turmeric",
      "description": "...",
      "image": "/uploads/categories/turmeric.jpg",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `GET /api/categories/:id`
Get single category details.
```
Status: 200 OK
Auth Required: ❌ No
```

---

### **Admin Routes**

#### `POST /api/categories`
Create new category.
```
Status: 201 Created
Auth Required: ✅ Yes (Admin)

Request Body:
{
  "name": "Cinnamon",
  "slug": "cinnamon",
  "description": "Premium quality cinnamon",
  "image": "/uploads/categories/cinnamon.jpg"
}
```

#### `PUT /api/categories/:id`
Update category.
```
Status: 200 OK
Auth Required: ✅ Yes (Admin)

Request Body: Same as POST
```

#### `DELETE /api/categories/:id`
Delete category.
```
Status: 200 OK
Auth Required: ✅ Yes (Admin)
```

---

## 4️⃣ **CART ROUTES** (`/api/cart`)

**All cart routes require authentication.**

#### `GET /api/cart`
Get current user's cart.
```
Status: 200 OK
Auth Required: ✅ Yes

Response:
{
  "success": true,
  "data": {
    "_id": "cart_id",
    "userId": "user_id",
    "items": [
      {
        "productId": {
          "_id": "product_id",
          "name": "Premium Turmeric",
          "price": 299,
          "image": "..."
        },
        "quantity": 2,
        "price": 299,
        "addedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 598
  }
}
```

#### `POST /api/cart/add`
Add product to cart.
```
Status: 200 OK
Auth Required: ✅ Yes

Request Body:
{
  "productId": "product_id",
  "quantity": 2
}

Response: { success: true, data: { cart } }
```

#### `PUT /api/cart/update`
Update cart item quantity.
```
Status: 200 OK
Auth Required: ✅ Yes

Request Body:
{
  "productId": "product_id",
  "quantity": 5
}
```

#### `POST /api/cart/remove`
Remove item from cart.
```
Status: 200 OK
Auth Required: ✅ Yes

Request Body:
{
  "productId": "product_id"
}
```

#### `POST /api/cart/clear`
Clear entire cart.
```
Status: 200 OK
Auth Required: ✅ Yes
```

---

## 5️⃣ **ADDRESS ROUTES** (`/api/addresses`)

**All address routes require authentication.**

#### `GET /api/addresses`
Get user's saved addresses.
```
Status: 200 OK
Auth Required: ✅ Yes

Response:
{
  "success": true,
  "data": [
    {
      "_id": "address_id",
      "userId": "user_id",
      "name": "Home",
      "phone": "+91 9999999999",
      "addressLine1": "123 Main Street",
      "addressLine2": "Apartment 4B",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "isDefault": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `GET /api/addresses/:id`
Get specific address.
```
Status: 200 OK
Auth Required: ✅ Yes
```

#### `POST /api/addresses`
Create new address.
```
Status: 201 Created
Auth Required: ✅ Yes

Request Body:
{
  "name": "Office",
  "phone": "+91 9999999999",
  "addressLine1": "456 Business Ave",
  "addressLine2": "Suite 200",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560001",
  "isDefault": false
}
```

#### `PUT /api/addresses/:id`
Update address.
```
Status: 200 OK
Auth Required: ✅ Yes

Request Body: Same as POST
```

#### `DELETE /api/addresses/:id`
Delete address.
```
Status: 200 OK
Auth Required: ✅ Yes
```

#### `POST /api/addresses/:id/set-default`
Mark address as default.
```
Status: 200 OK
Auth Required: ✅ Yes
```

---

## 6️⃣ **ORDER ROUTES** (`/api/orders`)

### **Customer Routes**

#### `POST /api/orders`
Create new order.
```
Status: 201 Created
Auth Required: ✅ Yes

Request Body:
{
  "addressId": "address_id",
  "paymentMethod": "razorpay" // or "cod"
}

Response:
{
  "success": true,
  "data": {
    "_id": "order_id",
    "userId": "user_id",
    "orderNumber": "ORD-1234567890",
    "items": [
      {
        "productId": "...",
        "name": "Premium Turmeric",
        "price": 299,
        "quantity": 2,
        "image": "..."
      }
    ],
    "totalAmount": 598,
    "shippingAddress": { ... },
    "paymentMethod": "razorpay",
    "paymentStatus": "pending",
    "orderstatus": "pending",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### `POST /api/orders/verify-payment`
Verify Razorpay payment.
```
Status: 200 OK
Auth Required: ✅ Yes

Request Body:
{
  "razorpay_order_id": "order_id",
  "razorpay_payment_id": "payment_id",
  "razorpay_signature": "signature"
}
```

#### `GET /api/orders/my-orders`
Get user's order history.
```
Status: 200 OK
Auth Required: ✅ Yes

Response:
{
  "success": true,
  "data": [
    { order details }
  ]
}
```

#### `GET /api/orders/:id`
Get specific order details.
```
Status: 200 OK
Auth Required: ✅ Yes
```

---

### **Admin Routes**

#### `GET /api/orders`
Get all orders (admin).
```
Status: 200 OK
Auth Required: ✅ Yes (Admin)

Query Parameters:
- status: "pending|processing|shipped|delivered"
- page: 1
- limit: 10
```

#### `PUT /api/orders/:id/status`
Update order status (admin).
```
Status: 200 OK
Auth Required: ✅ Yes (Admin)

Request Body:
{
  "status": "shipped"  // pending, processing, shipped, delivered
}
```

---

## 7️⃣ **ADMIN ROUTES** (`/api/admin`)

**All admin routes require authentication and admin role.**

#### `GET /api/admin/stats`
Get dashboard statistics.
```
Status: 200 OK
Auth Required: ✅ Yes (Admin)

Response:
{
  "success": true,
  "data": {
    "totalUsers": 250,
    "totalOrders": 1500,
    "totalRevenue": 450000,
    "ordersByStatus": {
      "pending": 50,
      "processing": 30,
      "shipped": 100,
      "delivered": 1320
    }
  }
}
```

#### `GET /api/admin/users`
Get all users with pagination.
```
Status: 200 OK
Auth Required: ✅ Yes (Admin)

Query Parameters:
- page: 1
- limit: 10

Response:
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+91 9999999999",
        "role": "customer",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": { total, page, limit, pages }
  }
}
```

#### `GET /api/admin/analytics/revenue`
Get revenue analytics.
```
Status: 200 OK
Auth Required: ✅ Yes (Admin)

Response:
{
  "success": true,
  "data": {
    "dailyRevenue": [
      { date: "2024-01-01", total: 5000 }
    ],
    "weeklyRevenue": [...],
    "monthlyRevenue": [...]
  }
}
```

#### `GET /api/admin/analytics/payments`
Get payment analytics.
```
Status: 200 OK
Auth Required: ✅ Yes (Admin)

Response:
{
  "success": true,
  "data": {
    "totalPayments": 1500000,
    "razorpayPayments": 1200000,
    "codPayments": 300000,
    "paymentsMethods": {
      "razorpay": 800,
      "cod": 400
    }
  }
}
```

---

## 8️⃣ **PARTNERSHIP ROUTES** (`/api/partnerships`)

### **User Routes**

#### `POST /api/partnerships/apply`
Submit partnership application.
```
Status: 201 Created
Auth Required: ✅ Yes

Request Body:
{
  "fullName": "Jane Doe",
  "email": "jane@business.com",
  "phone": "+91 8888888888",
  "businessName": "Spice Traders",
  "businessType": "Distributor",
  "areaOfInterest": "wholesale",
  "cities": ["Mumbai", "Bangalore"],
  "businessExperience": 5,
  "bankAccountHolder": "Jane Doe",
  "bankAccountNumber": "1234567890",
  "ifscCode": "AXIS0001234",
  "gstNumber": "27AABCU9603R1Z0",
  "businessRegistration": "...",
  "address": "123 Business St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "country": "India",
  "additionalInfo": "..."
}

Response:
{
  "success": true,
  "data": {
    "_id": "application_id",
    "userId": "user_id",
    "status": "pending",
    "submittedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### `GET /api/partnerships/my-applications`
Get user's partnership applications.
```
Status: 200 OK
Auth Required: ✅ Yes

Response:
{
  "success": true,
  "data": [
    {
      "_id": "application_id",
      "businessName": "Spice Traders",
      "status": "pending|approved|rejected",
      "submittedAt": "..."
    }
  ]
}
```

#### `GET /api/partnerships/application/:id`
Get specific application details.
```
Status: 200 OK
Auth Required: ✅ Yes
```

---

### **Admin Routes**

#### `GET /api/partnerships/admin/all`
Get all partnership applications.
```
Status: 200 OK
Auth Required: ✅ Yes (Admin)

Response: { applications: [...] }
```

#### `PUT /api/partnerships/admin/update-status/:id`
Update application status.
```
Status: 200 OK
Auth Required: ✅ Yes (Admin)

Request Body:
{
  "status": "approved",  // or "rejected"
  "notes": "Optional rejection notes"
}
```

---

## 9️⃣ **REVIEW ROUTES** (`/api/reviews`)

### **Public Routes**

#### `POST /api/reviews/submit`
Submit product review.
```
Status: 201 Created
Auth Required: ❌ No

Request Body:
{
  "name": "John Doe",
  "rating": 5,
  "comment": "Excellent quality spices!",
  "productId": "product_id",  // optional
  "email": "john@example.com"  // optional
}

Response:
{
  "success": true,
  "message": "Thank you for your feedback!"
}
```

#### `GET /api/reviews/approved`
Get approved reviews.
```
Status: 200 OK
Auth Required: ❌ No

Query Parameters:
- limit: 10
- productId: "productId"

Response:
{
  "success": true,
  "data": [
    {
      "_id": "review_id",
      "name": "John Doe",
      "rating": 5,
      "comment": "Great product!",
      "productId": "...",
      "isApproved": true,
      "isFeatured": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### **Admin Routes**

#### `GET /api/reviews`
Get all reviews (admin).
```
Status: 200 OK
Auth Required: ✅ Yes (Admin)

Response: { reviews: [...] }
```

#### `PUT /api/reviews/:id/approve`
Approve review.
```
Status: 200 OK
Auth Required: ✅ Yes (Admin)

Request Body:
{
  "isApproved": true,
  "isFeatured": false  // optional
}
```

#### `DELETE /api/reviews/:id`
Delete review.
```
Status: 200 OK
Auth Required: ✅ Yes (Admin)
```

---

## 🔟 **COUPON ROUTES** (`/api/coupons`)

#### `POST /api/coupons/validate`
Validate coupon code.
```
Status: 200 OK
Auth Required: ✅ Yes

Request Body:
{
  "code": "SAVE2024",
  "orderAmount": 5000
}

Response:
{
  "success": true,
  "data": {
    "code": "SAVE2024",
    "discountType": "percentage",  // or "fixed"
    "discountValue": 20,
    "appliedAmount": 1000,
    "finalAmount": 4000
  }
}
```

#### `GET /api/coupons`
Get active coupons (admin).
```
Status: 200 OK
Auth Required: ✅ Yes (Admin)
```

#### `POST /api/coupons`
Create coupon (admin).
```
Status: 201 Created
Auth Required: ✅ Yes (Admin)

Request Body:
{
  "code": "SAVE2024",
  "discountType": "percentage",
  "discountValue": 20,
  "expiresAt": "2024-12-31T23:59:59Z",
  "maxUses": 100,
  "minOrderAmount": 1000
}
```

---

## 1️⃣1️⃣ **EMAIL ROUTES** (`/api/email`)

#### `POST /api/email/contact`
Send contact form email.
```
Status: 200 OK
Auth Required: ❌ No

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Product Inquiry",
  "message": "I want to inquire about...",
  "phone": "+91 9999999999"  // optional
}

Response:
{
  "success": true,
  "message": "Message sent successfully"
}
```

#### `POST /api/email/newsletter`
Subscribe to newsletter.
```
Status: 200 OK
Auth Required: ❌ No

Request Body:
{
  "email": "john@example.com"
}
```

---

## 🔒 Security Features

### **Rate Limiting**
- Window: 15 minutes
- Max Requests: 1000 per window
- Applied globally to all routes

### **CORS Configuration**
```
Allowed Origins:
- http://localhost:3000
- http://localhost:5173
- http://localhost:8080
- Process.env.FRONTEND_URL
```

### **HTTPS & Helmet**
- Content Security Policy
- Cross-Origin Resource Sharing
- Cross-Origin Resource Policy

### **Authentication**
- JWT tokens (Access & Refresh)
- Token expiry validation
- Role-based authorization
- Password hashing (bcryptjs)

---

## 📁 File Upload Routes

### **Product Image Upload**
```
Route: POST /api/products/upload/image
Method: FormData
Max Size: 10MB
Allowed Types: jpg, jpeg, png, gif, webp
Storage Location: /uploads/products/
```

---

## 🚫 Error Handling

### **Common Error Responses**

**400 Bad Request**
```json
{
  "success": false,
  "message": "Invalid email format",
  "statusCode": 400
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "statusCode": 401
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "Only admin can access this route",
  "statusCode": 403
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Product not found",
  "statusCode": 404
}
```

**500 Server Error**
```json
{
  "success": false,
  "message": "Internal server error",
  "statusCode": 500
}
```

---

## 📊 API Statistics

| Metric | Count |
|--------|-------|
| Total Route Modules | 11 |
| Total Endpoints | 54+ |
| Public Endpoints | 20+ |
| Protected Endpoints | 20+ |
| Admin-only Endpoints | 14+ |
| HTTP Methods Used | GET, POST, PUT, DELETE |

---

## 🔄 Common API Flows

### **User Registration & Login Flow**
```
1. POST /api/auth/register
   ↓
2. Receive accessToken & refreshToken
   ↓
3. Store tokens in frontend
   ↓
4. Use accessToken in Authorization header
```

### **Shopping Flow**
```
1. GET /api/products (browse)
   ↓
2. GET /api/products/:id (view details)
   ↓
3. POST /api/cart/add (add to cart)
   ↓
4. GET /api/cart (view cart)
   ↓
5. POST /api/orders (create order)
   ↓
6. POST /api/orders/verify-payment (pay)
   ↓
7. GET /api/orders/my-orders (track)
```

### **Admin Management Flow**
```
1. GET /api/admin/stats (dashboard)
   ↓
2. GET /api/admin/users (user management)
   ↓
3. GET /api/admin/analytics/revenue (analytics)
   ↓
4. PUT /api/orders/:id/status (order management)
```

---

## 🎯 Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/matasree
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

RAZORPAY_KEY_ID=your_razor_key
RAZORPAY_KEY_SECRET=your_razor_secret

FRONTEND_URL=http://localhost:8080

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

---

## ✅ Testing Checklist

- [ ] Test all public routes without auth
- [ ] Test protected routes with valid token
- [ ] Test protected routes without token (expect 401)
- [ ] Test admin routes with non-admin user (expect 403)
- [ ] Test file uploads with various file types
- [ ] Test rate limiting with multiple requests
- [ ] Test pagination with different limit/page values
- [ ] Test search and filter functionality
- [ ] Test payment verification flow
- [ ] Test error handling for invalid inputs

---

## 🎓 Key Takeaways

✅ **Modular Routes** - Each route module handles one domain
✅ **RESTful Design** - Proper HTTP methods and status codes
✅ **Security** - JWT, role-based access, rate limiting
✅ **Validation** - Input validation with Joi
✅ **Error Handling** - Consistent error responses
✅ **Documentation** - Clear endpoint documentation
✅ **Scalability** - Easy to add new routes and features
✅ **Consistency** - Standardized response format

---

## 📚 Related Documentation

- Backend Controllers: See `BACKEND_CONTROLLERS_EXPLANATION.md`
- Frontend Pages: See `FRONTEND_SCAFFOLD_AND_PAGES.md`
- Database Models: `src/models/`
- Middleware: `src/middleware/`
- Utils & Helpers: `src/utils/`

---

## 🎓 For Your Teacher

This API demonstrates:
- **RESTful Architecture** (proper HTTP verbs and status codes)
- **Security Best Practices** (JWT, role-based access, rate limiting)
- **Input Validation** (Joi schema validation)
- **Error Handling** (consistent error responses)
- **Modular Design** (11 separate route modules)
- **Authentication & Authorization** (token-based + role-based)
- **Database Operations** (CRUD operations with MongoDB)
- **File Uploads** (image handling with express-upload)
- **Payment Integration** (Razorpay gateway)
- **Email Integration** (Nodemailer for OTP & newsletters)

Perfect example of a production-ready REST API!
