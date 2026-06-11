import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Heart, ShoppingCart, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import logo from '@/assets/matasree-logo.png';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Nav Links ────────────────────────────────────────────────────────────────

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Products', path: '/products' },
  { name: 'Categories', path: '/categories' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
  { name: 'Become a Partner', path: '/partnership' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const MobileNavDrawer = ({ isOpen, onClose }: MobileNavDrawerProps) => {
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLDivElement>(null);

  const { toggleCart, totalItems } = useCartStore();
  const { totalItems: wishlistTotal } = useWishlistStore();
  const { isAuthenticated, user, logout } = useAuthStore();

  // Prevent body scroll while drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus trap + Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const drawerEl = drawerRef.current;
    if (!drawerEl) return;

    // Focus first focusable element
    const focusableSelectors =
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(
      drawerEl.querySelectorAll<HTMLElement>(focusableSelectors)
    );
    focusables[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/');
  };

  const handleCartClick = () => {
    toggleCart();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="drawer-overlay"
            className="fixed inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            key="drawer-panel"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed top-0 left-0 z-50 h-full w-[300px] max-w-[85vw] bg-background shadow-elevated flex flex-col overflow-y-auto"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20">
              <Link to="/" onClick={onClose} className="flex items-center">
                <img
                  src={logo}
                  alt="Matasree Super"
                  className="h-12 w-auto object-contain drop-shadow-md"
                />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close navigation menu"
                className="rounded-full hover:bg-accent/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 px-3 py-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
                Navigation
              </p>
              <ul className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      onClick={onClose}
                      className="flex items-center px-3 py-3 text-foreground/80 hover:text-primary hover:bg-primary/10 font-medium transition-all duration-200 rounded-lg text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Divider */}
              <div className="my-4 border-t border-accent/20" />

              {/* Utility Links */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
                My Account
              </p>
              <ul className="flex flex-col gap-1">
                {/* Wishlist */}
                <li>
                  <Link
                    to="/wishlist"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-3 text-foreground/80 hover:text-red-500 hover:bg-red-50 font-medium transition-all duration-200 rounded-lg text-sm"
                  >
                    <Heart className="w-4 h-4" />
                    Wishlist
                    {wishlistTotal() > 0 && (
                      <Badge className="ml-auto w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs font-bold">
                        {wishlistTotal()}
                      </Badge>
                    )}
                  </Link>
                </li>

                {/* Cart */}
                <li>
                  <button
                    onClick={handleCartClick}
                    className="w-full flex items-center gap-3 px-3 py-3 text-foreground/80 hover:text-primary hover:bg-primary/10 font-medium transition-all duration-200 rounded-lg text-sm"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Cart
                    {totalItems() > 0 && (
                      <Badge className="ml-auto w-5 h-5 p-0 flex items-center justify-center bg-gradient-spice text-white text-xs font-bold">
                        {totalItems()}
                      </Badge>
                    )}
                  </button>
                </li>

                {/* Account */}
                {isAuthenticated ? (
                  <>
                    <li>
                      <Link
                        to="/profile"
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-3 text-foreground/80 hover:text-primary hover:bg-primary/10 font-medium transition-all duration-200 rounded-lg text-sm"
                      >
                        <User className="w-4 h-4" />
                        {user?.name ?? 'My Profile'}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/orders"
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-3 text-foreground/80 hover:text-primary hover:bg-primary/10 font-medium transition-all duration-200 rounded-lg text-sm"
                      >
                        My Orders
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-3 text-red-500 hover:bg-red-50 font-medium transition-all duration-200 rounded-lg text-sm"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </li>
                  </>
                ) : (
                  <li>
                    <Link
                      to="/login"
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-3 text-foreground/80 hover:text-primary hover:bg-primary/10 font-medium transition-all duration-200 rounded-lg text-sm"
                    >
                      <User className="w-4 h-4" />
                      Login / Register
                    </Link>
                  </li>
                )}
              </ul>
            </nav>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-primary/20">
              <div className="h-1 bg-gradient-indian-flag rounded-full" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileNavDrawer;
