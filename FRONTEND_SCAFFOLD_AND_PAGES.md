# Matasree Super - Frontend Scaffold & Main Pages (Vite + React)

## Overview
The Matasree Super frontend is built with **Vite + React + TypeScript** with a modern component-based architecture using **shadcn/ui** and **Radix UI**.

---

## 🏗️ Project Structure

```
matasree-superstore-main/
├── src/
│   ├── pages/              # Page components (24 pages)
│   ├── components/         # Reusable UI components
│   ├── services/           # API calls (axios)
│   ├── store/              # State management (Zustand)
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   ├── lib/                # Utility functions
│   ├── assets/             # Images, icons
│   ├── data/               # Static data files
│   ├── test/               # Test files
│   ├── App.tsx             # Main app component with routing
│   ├── main.tsx            # React entry point
│   ├── vite-env.d.ts       # Vite type definitions
│   ├── App.css             # Global styles
│   └── index.css           # Base styles with Tailwind
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind CSS config
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

---

## 📦 Core Technologies & Dependencies

### Build & Development
- **Vite** - Fast build tool and dev server
- **React 18** - UI library
- **TypeScript** - Type safety

### UI Framework
- **shadcn/ui** - High-quality React components
- **Radix UI** - Unstyled, accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework

### State Management & Data
- **Zustand** - Lightweight state management
- **TanStack React Query** - Server state management
- **Axios** - HTTP client

### Forms & Validation
- **react-hook-form** - Efficient form handling
- **Zod** - Schema validation

### Routing
- **React Router DOM** - Client-side routing

### UI Enhancements
- **lucide-react** - Icon library
- **embla-carousel** - Carousel component
- **react-fast-marquee** - Marquee scrolling text
- **date-fns** - Date utilities
- **clsx** - Conditional className utility

### Development Tools
- **Vitest** - Unit testing
- **ESLint** - Code linting

---

## 🎨 Main Pages (24 Pages)

### **Public Pages**

#### 1. **Index.tsx** (Home)
- Hero section with featured spices
- Best sellers carousel
- Categories section
- Features & benefits showcase
- Testimonials
- Newsletter signup
- Traditional elements (cultural theme)

#### 2. **ProductsPage.tsx** (Shop)
- Product listing with grid layout
- Advanced filtering (category, price range)
- Search functionality
- Sorting options (price, rating, newest)
- Pagination
- Add to cart functionality

#### 3. **ProductDetailsPage.tsx**
- Detailed product information (name, description, price)
- Product images gallery
- Stock availability
- Weight/size selection
- Customer reviews & ratings
- Related products
- Add to cart/wishlist buttons

#### 4. **CategoriesPage.tsx**
- All spice categories display
- Category cards with images
- Category filtering
- Products within each category
- Traditional aesthetic display

#### 5. **AboutPage.tsx**
- Company history (Est. 2008)
- Mission & vision statement
- Team section with photos
- Company achievements
- Heritage & legacy information
- Quality certifications

#### 6. **ContactPage.tsx**
- Contact form (name, email, message)
- Company contact information
- Map integration
- Social media links
- Email & phone support

#### 7. **PartnershipPage.tsx** (Distributor Program)
- Partnership program overview
- Application form fields:
  - Business details (name, type)
  - Contact information
  - Area of interest
  - Cities for operation
  - Business experience
  - Bank account details
  - GST number
  - Address information
- Benefits of partnership
- Terms & conditions

### **Authentication Pages**

#### 8. **LoginPage.tsx**
- Email/password login form
- "Remember me" checkbox
- "Forgot password" link
- Register link
- Form validation
- Error handling

#### 9. **RegisterPage.tsx**
- Signup form with fields:
  - Full name
  - Email address
  - Password (with strength indicator)
  - Phone number (optional)
- Terms & conditions acceptance
- Already have account link
- Email verification option

#### 10. **ForgotPasswordPage.tsx**
- Email input for password reset
- OTP verification
- New password creation
- Confirmation message

### **User Account Pages**

#### 11. **ProfilePage.tsx**
- User profile information
- Edit personal details
- Change password
- Account settings
- Account deletion option
- Order history summary

#### 12. **AddressesPage.tsx**
- List all saved addresses
- Add new address form:
  - Name, phone
  - Address lines 1 & 2
  - City, state, pincode
- Edit address
- Delete address
- Set default address

#### 13. **OrdersPage.tsx**
- Order history list (all user orders)
- Order number, date, total
- Order status tracking:
  - Pending → Processing → Shipped → Delivered
- Order details modal
- Reorder option
- Order cancellation (if applicable)

#### 14. **CheckoutPage.tsx**
- Cart summary
- Delivery address selection/entry
- Shipping method choice
- Payment method selection:
  - Razorpay (online)
  - COD (Cash on Delivery)
- Order review
- Place order button
- Order confirmation

#### 15. **WishlistPage.tsx**
- Saved favorite products
- Remove from wishlist
- Add to cart from wishlist
- View similar products
- Empty wishlist message

### **Admin Pages** (Dashboard)

#### 16. **AdminDashboard.tsx**
- Dashboard statistics:
  - Total users
  - Total orders
  - Total revenue
  - Orders by status chart
- Recent orders list
- Revenue analytics (daily/weekly/monthly)
- Top products
- Quick action buttons

#### 17. **AdminUsers.tsx**
- User management table
- User details (name, email, phone, join date)
- View user orders
- Edit user role
- Deactivate/delete users
- Search & filter users
- Pagination

#### 18. **AdminProducts.tsx**
- Product management table
- Add new product form
- Edit product details
- Delete products
- Bulk operations
- Search & filter by category
- Stock management
- View product analytics

#### 19. **AdminCategories.tsx**
- Category management
- Add new category:
  - Name, slug, description, image
- Edit category
- Delete category
- View products in category
- Reorder categories

#### 20. **AdminOrders.tsx**
- All orders management
- Order status updates:
  - Pending → Processing → Shipped → Delivered
- View order details
- Print invoice
- Track shipment
- Filter by status/date range
- Search by order number

### **Policy Pages**

#### 21. **PrivacyPolicyPage.tsx**
- Privacy policy content
- Data collection practices
- User rights
- Cookie policy
- GDPR compliance

#### 22. **TermsOfServicePage.tsx**
- Terms & conditions
- User responsibilities
- Limitations of liability
- Intellectual property
- Dispute resolution

#### 23. **RefundPolicyPage.tsx**
- Return policy details
- Refund timeline
- Return process
- Conditions for refund
- Contact for returns

#### 24. **NotFound.tsx** (404)
- 404 Page Not Found
- Navigation back to home
- Suggested links

---

## 🧩 Main Components

### **Layout Components**
- **Navbar.tsx** - Navigation header with logo, menu, search, cart, profile
- **Footer.tsx** - Footer with links, copyright, social media
- **NavLink.tsx** - Navigation link component

### **Hero & Featured**
- **HeroSection.tsx** - Main hero banner with CTA buttons
- **BestSellers.tsx** - Top-selling products carousel
- **FeaturedProducts.tsx** - Featured spices display
- **FeaturedProductsMarquee.tsx** - Scrolling featured products

### **Home Page Sections**
- **CategoriesSection.tsx** - Category showcase
- **WhyChooseUsSection.tsx** - USPs (unique selling points)
- **FeaturesSection.tsx** - Product features highlight
- **StatsSection.tsx** - Company stats (users, orders, etc.)
- **TestimonialsSection.tsx** - Customer reviews & testimonials
- **FAQSection.tsx** - Frequently asked questions
- **NewsletterSection.tsx** - Email subscription signup
- **WhyChooseMatasree.tsx** - Brand benefits

### **Product Components**
- **ProductCard.tsx** - Individual product card
- **CartDrawer.tsx** - Shopping cart sidebar
- **TraditionalElements.tsx** - Cultural design elements

### **Trust & Credibility**
- **TrustBadgesMarquee.tsx** - Scrolling trust badges
- **TrustStrip.tsx** - Trust indicators strip
- **StoreSection.tsx** - Store information

### **Additional Sections**
- **TeamSection.tsx** - Team member profiles
- **OurProcess.tsx** - How we work
- **ProcessSection.tsx** - Process workflow

### **UI Components** (shadcn/ui)
- Buttons, Forms, Dialogs
- Dropdowns, Menus, Modals
- Cards, Tables, Tabs
- Alerts, Badges, Progress bars
- Input fields, Checkboxes, Radio buttons
- Carousels, Tooltips, etc.

---

## 🔧 Services & API Layer

### **api.ts**
Centralized Axios instance with:
- Base URL configuration
- Request/response interceptors
- Error handling
- Token management (JWT)
- Automatic retry logic

**Main API calls:**
```typescript
// Products
GET /api/products              // Get all products
GET /api/products/search       // Search products
GET /api/products/:id          // Get product details

// Categories
GET /api/categories            // Get all categories
GET /api/categories/:id        // Get category details

// Cart
GET /api/cart                  // Get user cart
POST /api/cart/add             // Add to cart
PUT /api/cart/update           // Update cart
DELETE /api/cart/remove        // Remove from cart

// Orders
POST /api/orders               // Create order
GET /api/orders                // Get user orders
GET /api/orders/:id            // Get order details

// Auth
POST /api/auth/register        // Register user
POST /api/auth/login           // Login user
POST /api/auth/refresh         // Refresh token

// Addresses
GET /api/addresses             // Get user addresses
POST /api/addresses            // Create address
PUT /api/addresses/:id         // Update address

// Admin
GET /api/admin/stats           // Dashboard stats
GET /api/admin/users           // All users
GET /api/admin/products        // Manage products
```

---

## 🎯 State Management (Zustand)

### **authStore.ts**
```typescript
- user: User object
- accessToken: JWT token
- isAuthenticated: Boolean
- login(credentials)
- register(data)
- logout()
- initializeAuth()
```

### **cartStore.ts**
```typescript
- items: Cart items[]
- total: Number
- addItem(product, quantity)
- removeItem(productId)
- updateQuantity(productId, quantity)
- clearCart()
```

### **wishlistStore.ts**
```typescript
- items: Wishlist items[]
- addToWishlist(product)
- removeFromWishlist(productId)
- isInWishlist(productId)
```

---

## 🪝 Custom Hooks

### **useApi.ts**
Wrapper around React Query for API calls:
```typescript
- useQuery() - Fetch data
- useMutation() - POST/PUT/DELETE data
- useInfiniteQuery() - Pagination
```

### **use-toast.ts**
Toast notification system (success, error, info)

### **use-mobile.tsx**
Detect mobile viewport size

---

## 🎨 Styling & Design

### **Tailwind CSS**
- Utility-first approach
- Custom color scheme (amber/orange/red for spice theme)
- Responsive design (mobile-first)
- Dark mode support

### **CSS Architecture**
- Global styles in `index.css`
- Component-specific in `App.css`
- Tailwind utility classes in JSX

### **Color Palette**
- **Primary:** Amber & Orange (spice colors)
- **Accent:** Red (CTAs)
- **Text:** Amber-950 (dark brown)
- **Backgrounds:** Amber-50 gradients

---

## 📱 Responsive Design

All pages built with mobile-first approach:
- **Mobile:** 320px - 640px (sm)
- **Tablet:** 640px - 1024px (md, lg)
- **Desktop:** 1024px+ (xl, 2xl)

Using Tailwind breakpoints:
```tsx
<div className="block md:hidden">Mobile</div>
<div className="hidden md:block">Desktop</div>
```

---

## 🔐 Authentication Flow

1. User enters credentials on **LoginPage** or **RegisterPage**
2. Credentials sent to backend via **API service**
3. Backend returns JWT tokens (access + refresh)
4. Tokens stored in **authStore** (Zustand)
5. Tokens added to all API requests via interceptor
6. Protected routes check authentication status
7. Logout clears tokens and redirects to home

---

## 🛒 Shopping Flow

1. Browse products on **ProductsPage**
2. View details on **ProductDetailsPage**
3. Add to cart (stored in **cartStore**)
4. Proceed to **CheckoutPage**
5. Enter/select delivery address
6. Choose payment method (Razorpay/COD)
7. Review and place order
8. Order confirmation with tracking
9. View order history on **OrdersPage**

---

## ⚙️ Build & Development Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:8080)
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Preview production build
npm preview

# Run tests
npm test

# Watch mode for tests
npm test:watch

# Lint code
npm run lint
```

---

## 📊 Performance Features

1. **Code Splitting** - Lazy loading routes
2. **Image Optimization** - Compressed images in assets
3. **Caching** - React Query caching strategy
4. **Bundle Analysis** - Optimized bundling with Vite
5. **CSS-in-JS** - Tailwind's purging unused styles

---

## 🔒 Security Features

1. **JWT Authentication** - Secure token-based auth
2. **HTTPS** - Encrypted data transmission
3. **Input Validation** - Form validation with Zod
4. **XSS Protection** - React's built-in protection
5. **CSRF Tokens** - Server-side validation
6. **Password Hashing** - Backend password security
7. **Protected Routes** - Auth middleware in App.tsx

---

## 📋 Project Configuration Files

### **vite.config.ts**
- Dev server settings (port 8080)
- React plugin configuration
- Path alias for `@/` imports
- HMR (Hot Module Replacement) settings

### **tsconfig.json**
- Strict type checking disabled for flexibility
- Base URL paths with `@/` alias
- Loose null checks (strictNullChecks: false)
- ES modules configuration

### **tailwind.config.ts**
- Custom color extensions
- Custom spacing values
- Plugin registrations
- Theme customization

---

## 🎯 Key Features

✅ **Responsive Design** - Mobile-optimized UI
✅ **Product Search** - Full-text search with filters
✅ **Shopping Cart** - Persistent cart management
✅ **Order Tracking** - Real-time order status
✅ **User Profiles** - Account management
✅ **Admin Dashboard** - Complete management system
✅ **Payment Integration** - Razorpay + COD
✅ **Email Integration** - OTP, confirmations
✅ **Modern UI** - shadcn/ui + Radix UI
✅ **Type Safety** - Full TypeScript support
✅ **State Management** - Zustand stores
✅ **API Caching** - React Query optimization

---

## 🚀 Deployment

### **Build Process**
```bash
npm run build        # Creates optimized build in dist/
```

### **Deployment Targets**
- Vercel
- Netlify
- GitHub Pages
- Azure Static Web Apps
- Docker containerization

---

## 📚 Best Practices Implemented

1. **Component-Based** - Modular, reusable components
2. **Type Safety** - TypeScript throughout
3. **Separation of Concerns** - Pages, components, services, stores
4. **Error Handling** - Try-catch, error states
5. **Loading States** - Spinners, loading indicators
6. **Form Validation** - Real-time validation feedback
7. **Accessibility** - ARIA labels, semantic HTML
8. **SEO Ready** - Proper heading hierarchy
9. **Code Organization** - Clear folder structure
10. **DRY Principle** - Reusable components & hooks

---

## 📖 Summary

The Matasree Super frontend is a **modern, scalable React application** built with:
- **Vite** for fast development
- **TypeScript** for type safety  
- **shadcn/ui + Radix UI** for beautiful components
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Query** for server state
- **React Router** for navigation

With **24 main pages**, **20+ reusable components**, and a **complete admin dashboard**, 
the frontend provides a seamless shopping experience with modern web technologies and best practices.

---

## 🎓 For Your Teacher

This frontend demonstrates:
- **Full-stack architecture** (frontend + backend integration)
- **Modern React patterns** (hooks, context, custom hooks)
- **State management** (client + server state)
- **API integration** (REST APIs with Axios)
- **Authentication** (JWT tokens, protected routes)
- **E-commerce features** (cart, checkout, orders)
- **Admin functionality** (dashboard, user management)
- **Responsive design** (mobile-first approach)
- **Professional UI/UX** (modern component library)
- **Performance optimization** (lazy loading, caching)

Perfect example of production-ready React application!
