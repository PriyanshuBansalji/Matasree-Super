import { Link, useLocation } from 'react-router-dom';
import { Home, Package, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

// ─── Component ────────────────────────────────────────────────────────────────

const BottomTabBar = () => {
  const location = useLocation();
  const { toggleCart, totalItems } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const cartCount = totalItems();
  const accountPath = isAuthenticated ? '/profile' : '/login';

  const isActive = (path: string) => location.pathname === path;

  return (
    // md:hidden ensures this bar is invisible at ≥768 px (Tailwind breakpoint)
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-elevated"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around px-2 py-1 h-16">
        {/* Home */}
        <Link
          to="/"
          aria-label="Home"
          aria-current={isActive('/') ? 'page' : undefined}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 min-w-[56px] ${
            isActive('/')
              ? 'text-primary'
              : 'text-muted-foreground hover:text-primary'
          }`}
        >
          <Home
            className={`w-5 h-5 transition-transform duration-200 ${isActive('/') ? 'scale-110' : ''}`}
          />
          <span className="text-[10px] font-medium leading-none">Home</span>
        </Link>

        {/* Products */}
        <Link
          to="/products"
          aria-label="Products"
          aria-current={isActive('/products') ? 'page' : undefined}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 min-w-[56px] ${
            isActive('/products')
              ? 'text-primary'
              : 'text-muted-foreground hover:text-primary'
          }`}
        >
          <Package
            className={`w-5 h-5 transition-transform duration-200 ${isActive('/products') ? 'scale-110' : ''}`}
          />
          <span className="text-[10px] font-medium leading-none">Products</span>
        </Link>

        {/* Cart */}
        <button
          onClick={toggleCart}
          aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
          className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-muted-foreground hover:text-primary transition-all duration-200 min-w-[56px]"
        >
          <span className="relative">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 flex items-center justify-center rounded-full bg-gradient-spice text-white text-[9px] font-bold leading-none border border-background shadow-sm">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </span>
          <span className="text-[10px] font-medium leading-none">Cart</span>
        </button>

        {/* Account */}
        <Link
          to={accountPath}
          aria-label="Account"
          aria-current={isActive(accountPath) ? 'page' : undefined}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 min-w-[56px] ${
            isActive(accountPath)
              ? 'text-primary'
              : 'text-muted-foreground hover:text-primary'
          }`}
        >
          <User
            className={`w-5 h-5 transition-transform duration-200 ${isActive(accountPath) ? 'scale-110' : ''}`}
          />
          <span className="text-[10px] font-medium leading-none">Account</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomTabBar;
