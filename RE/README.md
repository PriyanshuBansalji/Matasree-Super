# 📦 Complete Frontend-Backend Connection Setup

## Summary of Changes

Your Matasree Store frontend and backend are now fully connected! Here's what was created:

### 📁 Files Created/Updated

#### Root Level
- ✅ `CONNECTION_SETUP.md` - Comprehensive setup instructions
- ✅ `INTEGRATION_GUIDE.md` - Detailed integration documentation
- ✅ `QUICK_START.md` - Quick reference guide
- ✅ `setup.bat` - Windows automated setup script
- ✅ `setup.sh` - Unix/Linux/Mac automated setup script

#### Frontend Configuration
- ✅ `.env.local` - Development environment variables
- ✅ `.env.development` - Dev environment config
- ✅ `.env.production` - Production environment config

#### Frontend Services
- ✅ `src/services/api.ts` - Axios API client with:
  - Pre-configured base URL
  - JWT token injection
  - Request/response interceptors
  - 401 error handling
  - All API endpoint methods

#### Frontend Hooks
- ✅ `src/hooks/useApi.ts` - React Query custom hooks for:
  - Authentication (login, register, logout)
  - Products (CRUD)
  - Categories (CRUD)
  - Cart operations
  - Orders (CRUD)
  - Addresses (CRUD)

#### Example Components
- ✅ `src/components/Examples/ApiExamples.tsx` - Example usage:
  - ProductsExample - Fetch and display products
  - LoginExample - User authentication
  - CartExample - Cart management
  - CategoryExample - Category browsing
  - OrderExample - Order management

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                       │
│                    http://localhost:5173                          │
├─────────────────────────────────────────────────────────────────┤
│  Components                 │  Services                │  Hooks   │
│  - Navbar                   │  - api.ts               │  - useLogin
│  - ProductCard              │    (Axios Client)       │  - useProducts
│  - CartDrawer               │                         │  - useCart
│  - etc.                     │                         │  - etc.
│                             │                         │          │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTP Requests (JSON)
                 │ Authorization: Bearer <token>
                 │
┌────────────────▼────────────────────────────────────────────────┐
│                    Backend (Express.js)                          │
│                    http://localhost:5000                         │
├─────────────────────────────────────────────────────────────────┤
│  Routes          │  Controllers       │  Models      │  Database │
│  - authRoutes    │  - authController  │  - User      │           │
│  - productRoutes │  - productCtrl     │  - Product   │           │
│  - cartRoutes    │  - cartController  │  - Cart      │ MongoDB   │
│  - etc.          │  - etc.            │  - Order     │           │
│                  │                    │  - Category  │           │
│                  │                    │  - Address   │           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Choose One)

### Option 1: Automated (Recommended)
```bash
# Windows
.\setup.bat

# Mac/Linux
chmod +x setup.sh && ./setup.sh
```

### Option 2: Manual

**Terminal 1: Backend**
```bash
cd matasree-backend
cp .env.example .env
# Edit .env with your MongoDB URI
npm install
npm run dev
```

**Terminal 2: Frontend**
```bash
cd matasree-superstore-main
npm install
npm run dev
```

---

## 📋 Configuration Checklist

- [ ] Backend `.env` created from `.env.example`
- [ ] MongoDB URI added to backend `.env`
- [ ] JWT_SECRET configured in backend `.env`
- [ ] Frontend `.env.local` created (should already be done)
- [ ] Both `npm install` commands completed
- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:5173
- [ ] Network requests visible in DevTools

---

## 💻 How to Use in Your Code

### Option A: Direct API Calls
```typescript
import { apiClient } from '@/services/api';

// Simple fetch
const products = await apiClient.getProducts();
```

### Option B: React Query (Recommended)
```typescript
import { useProducts, useAddToCart } from '@/hooks/useApi';

function MyComponent() {
  const { data, isLoading } = useProducts();
  const { mutate: addToCart } = useAddToCart();
  
  // Use data and functions in your component
}
```

### Option C: Copy & Modify Examples
See `src/components/Examples/ApiExamples.tsx` for:
- ProductsExample - Product listing
- LoginExample - User authentication  
- CartExample - Shopping cart
- CategoryExample - Category browse
- OrderExample - Order management

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `CONNECTION_SETUP.md` | Main setup guide with all steps |
| `INTEGRATION_GUIDE.md` | Detailed technical integration guide |
| `QUICK_START.md` | Quick reference with tips |
| `README.md` (at root) | Project overview |

---

## 🔌 API Endpoints Available

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
```

### Products
```
GET    /api/products
GET    /api/products/:id
POST   /api/products (admin)
PUT    /api/products/:id (admin)
DELETE /api/products/:id (admin)
```

### Categories
```
GET    /api/categories
GET    /api/categories/:id
POST   /api/categories (admin)
PUT    /api/categories/:id (admin)
DELETE /api/categories/:id (admin)
```

### Cart
```
GET    /api/cart
POST   /api/cart/add
PUT    /api/cart/update
DELETE /api/cart/remove/:itemId
```

### Orders
```
GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
PUT    /api/orders/:id/cancel
```

### Addresses
```
GET    /api/addresses
POST   /api/addresses
PUT    /api/addresses/:id
DELETE /api/addresses/:id
```

---

## 🧪 Testing the Connection

1. **Start both servers** (follow Quick Start above)
2. **Open browser**: `http://localhost:5173`
3. **Open DevTools**: Press F12 → Network tab
4. **Perform an action**: Click login, browse products, add to cart
5. **Verify in Network tab**:
   - Look for requests to `http://localhost:5000/api/...`
   - Check response status is 200
   - Verify response data is returned

---

## ⚡ Key Features

- ✅ JWT authentication with token refresh
- ✅ Request/response interceptors
- ✅ Automatic token injection
- ✅ 401 error handling
- ✅ React Query caching
- ✅ TypeScript support
- ✅ CORS configured
- ✅ Error handling
- ✅ Loading states
- ✅ Type-safe hooks

---

## 🔍 Troubleshooting

### Problem: CORS Error
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution**: Backend not running or FRONTEND_URL mismatch
- Check backend is running on port 5000
- Verify `FRONTEND_URL=http://localhost:5173` in backend `.env`

### Problem: MongoDB Connection Error
```
MongoDB Connection Failed
```
**Solution**: MongoDB URI incorrect
- Get URI from MongoDB Atlas
- Ensure IP is whitelisted in MongoDB Atlas
- Check credentials in URI

### Problem: 404 on API calls
```
POST http://localhost:5000/api/products 404 Not Found
```
**Solution**: Backend not running or route not configured
- Verify backend console shows "Server running on port 5000"
- Check routes are imported in server.ts

### Problem: Token expires
```
401 Unauthorized
```
**Solution**: Token expired - automatic refresh configured
- Check browser console for refresh errors
- Verify JWT_SECRET is same in backend

---

## 📂 Project Structure

```
matasree-backend/
├── src/
│   ├── server.ts                 ← Main server
│   ├── config/database.ts        ← MongoDB config
│   ├── controllers/              ← Business logic
│   ├── models/                   ← Schemas
│   ├── routes/                   ← API routes
│   ├── middleware/               ← JWT, CORS, etc
│   └── utils/                    ← Helpers
├── .env                          ← Config (create from .env.example)
└── package.json

matasree-superstore-main/
├── src/
│   ├── services/api.ts           ← API client ✨ NEW
│   ├── hooks/useApi.ts           ← API hooks ✨ NEW
│   ├── components/
│   │   └── Examples/             ← Example usage ✨ NEW
│   ├── pages/                    ← Page components
│   ├── store/                    ← Zustand state
│   └── types/                    ← TypeScript types
├── .env.local                    ← Dev config ✨ NEW
└── package.json
```

---

## 🎓 Learning Resources

- **API Client**: Study `src/services/api.ts`
- **Custom Hooks**: Study `src/hooks/useApi.ts`
- **Examples**: Study `src/components/Examples/ApiExamples.tsx`
- **React Query**: https://tanstack.com/query/latest
- **Axios**: https://axios-http.com/
- **Express.js**: https://expressjs.com/

---

## ✅ Next Steps

1. ✅ Read `QUICK_START.md` (2 min)
2. ✅ Run setup script or manual setup
3. ✅ Test connection with example components
4. ✅ Start building your features
5. ⭕ Connect payment gateway (Razorpay)
6. ⭕ Deploy to production

---

## 🎉 You're All Set!

Your full-stack application is ready for development. Both frontend and backend can now communicate seamlessly.

**Start coding!** 🚀

```bash
# Terminal 1
cd matasree-backend && npm run dev

# Terminal 2  
cd matasree-superstore-main && npm run dev
```

Then visit: `http://localhost:5173`

---

## 📞 Need Help?

1. Check `INTEGRATION_GUIDE.md` for detailed info
2. Check browser DevTools Network tab for API errors
3. Check backend console for server logs
4. Verify all environment variables are set
5. Review example components in `src/components/Examples/`

**Happy coding!** 💻✨
