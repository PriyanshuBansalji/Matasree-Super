# Matasree Super - Backend API

Production-ready e-commerce backend for Matasree Super masala company.

## Features

✅ User Authentication (JWT)
✅ Product & Category Management
✅ Shopping Cart
✅ Order Management
✅ Razorpay Payment Integration
✅ Admin Dashboard
✅ Address Management
✅ Role-Based Access Control
✅ Input Validation
✅ Error Handling

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - Logout

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `GET /api/products/featured` - Get featured products
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Cart
- `GET /api/cart` - Get cart
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/update` - Update item
- `POST /api/cart/remove` - Remove item
- `POST /api/cart/clear` - Clear cart

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/verify-payment` - Verify Razorpay payment

### Admin
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/users` - All users
- `GET /api/admin/analytics/revenue` - Revenue analytics
- `GET /api/admin/analytics/payments` - Payment summary

## Database Models

- **User** - Authentication and profile
- **Product** - Product details
- **Category** - Product categories
- **Cart** - Shopping cart items
- **Address** - User addresses
- **Order** - Order details
- **Payment** - Payment transactions

## Security Features

- Password hashing (bcryptjs)
- JWT authentication
- Role-based access control
- Input validation (Joi)
- Rate limiting
- CORS protection
- Helmet security headers

## Deployment

### On Render:

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Set environment variables in Render
5. Build command: `npm run build`
6. Start command: `npm start`

## Environment Variables

See `.env.example` for all required variables.

## SMS Configuration

> **Status: Stub — live SMS is not enabled by default.**

The backend ships with a Twilio SMS integration that is implemented as a stub. When the required environment variables are absent the `sendOTPSMS` function logs a warning and returns `false` — it does **not** throw an unhandled exception and it does **not** block the application from starting.

To enable live SMS delivery, add the following variables to your `.env` file:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   # must start with "AC"
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890                         # E.164 format
```

When these variables are set and valid, the server will log `✅ Twilio SMS service initialized` on startup and OTPs will be delivered via Twilio.

When any of the three variables are absent or invalid, the server will log:
```
⚠️  SMS (Twilio) is not configured. Mobile OTP will not be delivered.
```

---

## Validation Strategy

All request-body validation uses **Joi**. The `express-mongo-sanitize` and `HPP` middleware are applied globally in `server.ts` to prevent MongoDB operator injection and HTTP Parameter Pollution.

**Zod and `express-validator` are not used for request validation.**

Every Joi schema is configured with `abortEarly: false` and `stripUnknown: true`. Validation failures return HTTP 400 with the body:

```json
{ "success": false, "message": "<field>: <validation message>" }
```

---

## License

MIT
