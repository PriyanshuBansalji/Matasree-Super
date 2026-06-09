# Matasree Super - Backend Controllers Explanation

## Overview
This document explains all 8 controller files in the backend that handle different business logic for the Matasree Super e-commerce application.

---

## 1. **authController.ts** - User Authentication
**Purpose:** Handles user registration, login, and authentication-related operations.

### Key Functions:
- **register()** - Creates new user accounts
  - Validates input (name, email, password, phone)
  - Checks if email already exists
  - Hashes password for security
  - Generates JWT tokens (access & refresh)
  - Returns user data with tokens

- **login()** - Authenticates existing users
  - Validates email and password
  - Compares hashed passwords
  - Generates JWT tokens
  - Returns authenticated user data

### Technologies Used:
- Joi (for input validation)
- JWT (JSON Web Tokens for authentication)
- Password hashing (security)
- Email sending capabilities

---

## 2. **productController.ts** - Product Management
**Purpose:** Handles all product-related operations (CRUD operations).

### Key Functions:
- **getProducts()** - Fetches products with advanced filtering
  - Search functionality (by name, description, tags)
  - Filter by category, price range
  - Pagination support
  - Sorting options (price, rating, sold count)
  - Returns paginated results

- **getProductById()** - Get single product details
- **createProduct()** - Add new products (Admin only)
  - Validates: name, description, price, category, stock, image
  - Supports weight options (100g, 250g, 500g, 1kg, 2kg)
  - Supports tags for better categorization
- **updateProduct()** - Edit existing products
- **deleteProduct()** - Remove products

### Key Features:
- Regex-based search for flexibility
- Dynamic category lookup
- Price range filtering
- Advanced sorting capabilities

---

## 3. **categoryController.ts** - Category Management
**Purpose:** Manages spice categories (e.g., Turmeric, Cinnamon, Chilli, etc.).

### Key Functions:
- **getCategories()** - List all categories (sorted alphabetically)
- **getCategoryById()** - Get single category details
- **createCategory()** - Add new category (Admin only)
  - Fields: name, slug, description, image
  
- **updateCategory()** - Modify category information
- **deleteCategory()** - Remove categories
- **getCategoryProducts()** - Get all products in a category

### Validation Schema:
```
- name: Required string
- slug: Required lowercase identifier
- description: Optional
- image: Optional
```

---

## 4. **cartController.ts** - Shopping Cart Management
**Purpose:** Manages user shopping carts (add, update, remove items).

### Key Functions:
- **getCart()** - Retrieve user's current cart
  - Auto-creates empty cart if doesn't exist
  - Populates product details

- **addToCart()** - Add product to cart
  - Validates productId and quantity
  - Checks product stock availability
  - Updates quantity if product already in cart
  - Records price at time of addition

- **updateCartItem()** - Change quantity of cart items
  - Validates new quantity
  - Checks stock availability

- **removeFromCart()** - Delete item from cart
- **clearCart()** - Empty entire cart

### Data Structure:
```
Cart {
  userId: User ID
  items: [
    {
      productId: Product reference
      quantity: Number
      price: Price at time of addition
      addedAt: Timestamp
    }
  ]
}
```

---

## 5. **orderController.ts** - Order Management
**Purpose:** Handles order creation, payment processing, and order tracking.

### Key Functions:
- **createOrder()** - Convert cart to order
  - Validates address and payment method
  - Checks cart availability
  - Calculates total amount
  - Generates unique order number
  - Supports two payment methods:
    - **COD** (Cash on Delivery)
    - **Razorpay** (Online payment)

- **getOrders()** - Retrieve user's order history
- **getOrderById()** - Get specific order details
- **updateOrderStatus()** - Track order progress
  - Statuses: pending → shipped → delivered
  
- **verifyPayment()** - Validate Razorpay payment
- **cancelOrder()** - Allow order cancellation

### Payment Integration:
- Razorpay gateway integration
- Signature verification for security
- Payment record creation and tracking

---

## 6. **adminController.ts** - Admin Dashboard
**Purpose:** Provides admin analytics and management features.

### Key Functions:
- **getDashboardStats()** - Display key metrics
  - Total users count
  - Total orders count
  - Total revenue calculation
  - Orders breakdown by status

- **getAllUsers()** - Manage user accounts
  - Paginated user list
  - Excludes passwords from response
  
- **getRevenueAnalytics()** - Analyze sales data
  - Daily revenue reports
  - Revenue trends

- **getAllOrders()** - View all orders
- **updateOrderStatus()** - Modify order status (Admin only)
- **getUserDetails()** - View specific user info
- **editUserRole()** - Assign admin privileges

### Use Cases:
- Business intelligence
- Revenue tracking
- User management
- Order monitoring

---

## 7. **addressController.ts** - Delivery Address Management
**Purpose:** Handles user shipping addresses for orders.

### Key Functions:
- **getAddresses()** - List all user's saved addresses
  - Sorted by default address first

- **getAddressById()** - Get specific address details
- **createAddress()** - Save new delivery address
  - Validates: name, phone, address lines, city, state, pincode
  - Supports default address marking

- **updateAddress()** - Modify address information
- **deleteAddress()** - Remove address
- **setDefaultAddress()** - Mark as primary delivery address

### Validation:
```
- name: Required
- phone: Required
- addressLine1: Required (street address)
- addressLine2: Optional (apartment/suite)
- city: Required
- state: Required
- pincode: Required
- isDefault: Boolean (optional)
```

---

## 8. **partnershipController.ts** - Partnership Program
**Purpose:** Handles distributor/partner applications and management.

### Key Functions:
- **submitPartnershipApplication()** - New partner applications
  - Collects business details:
    - Business name and type
    - Area of interest
    - Cities for operation
    - Business experience
    - Bank account details (for payments)
    - GST number
    - Business registration
    - Full address

  - Prevents duplicate pending applications
  - Records application status

- **getApplications()** - View partnership applications
- **approveApplication()** - Accept partner
- **rejectApplication()** - Deny partnership
- **getPartnerDetails()** - View accepted partners

### Application Flow:
```
1. User submits application
2. Admin reviews submission
3. Admin approves/rejects
4. Email notification sent
5. Partner gains distributor access
```

---

## Security Features Across All Controllers:

1. **Authentication Middleware**
   - JWT token verification
   - User identification
   - Role-based access control

2. **Input Validation**
   - Joi schema validation
   - Data type checking
   - Required field enforcement

3. **Password Security**
   - Hashing (not storing plain text)
   - Comparison for login verification

4. **Authorization**
   - Admin-only operations protected
   - User-specific data access
   - Role enforcement

---

## Data Flow Example - Order Placement:

```
1. User adds items to Cart (cartController)
2. User provides delivery Address (addressController)
3. User creates Order from Cart (orderController)
   - Cart items converted to order items
   - Order number generated
   - Payment initiated (if Razorpay)
4. Payment verified (orderController)
5. Order status updated (adminController monitoring)
6. Email confirmation sent
```

---

## API Response Format:

All controllers use standardized response format:
```json
{
  "success": true/false,
  "message": "Description",
  "data": { /* actual data */ },
  "statusCode": 200
}
```

---

## Database Models Used:

- **User** - User accounts and authentication
- **Product** - Spice products inventory
- **Category** - Product categories
- **Cart** - Shopping carts
- **Order** - Purchase orders
- **Address** - Delivery addresses
- **Payment** - Payment records
- **Partnership** - Partner applications

---

## Installation & Dependencies:

```json
{
  "express": "Web framework",
  "mongoose": "MongoDB ORM",
  "joi": "Input validation",
  "bcryptjs": "Password hashing",
  "jsonwebtoken": "JWT tokens",
  "razorpay": "Payment gateway",
  "nodemailer": "Email sending"
}
```

---

## Summary Table:

| Controller | Purpose | Key Operations |
|-----------|---------|-----------------|
| Auth | User login/registration | Register, Login, Refresh Token |
| Product | Manage products | CRUD, Search, Filter, Sort |
| Category | Manage spice categories | CRUD on categories |
| Cart | Shopping cart | Add, Update, Remove, Clear |
| Order | Order management | Create, Track, Cancel |
| Admin | Dashboard & analytics | Stats, Revenue, User mgmt |
| Address | Shipping addresses | CRUD, Set Default |
| Partnership | Partner applications | Apply, Review, Approve |

---

## Conclusion:

This backend architecture follows a **modular controller pattern** where:
- Each controller handles one business domain
- Consistent error handling and response formats
- Security measures implemented throughout
- Scalable and maintainable code structure
- Full CRUD operations for data management
- Integration with payment gateways
- Email notifications support

This design allows for easy testing, debugging, and future feature additions!
