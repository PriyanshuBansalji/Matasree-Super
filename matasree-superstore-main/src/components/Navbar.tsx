import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Menu, ShoppingCart, User, Search, LogOut, Heart } from 'lucide-react';
import MobileNavDrawer from '@/components/MobileNavDrawer';
import BottomTabBar from '@/components/BottomTabBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useProducts } from '@/hooks/useApi';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import logo from '@/assets/matasree-logo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { toggleCart, totalItems } = useCartStore();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { totalItems: wishlistTotal } = useWishlistStore();

  // Search with debounce
  const { data: searchData } = useProducts(
    searchQuery.length >= 2 ? { search: searchQuery, limit: 5 } : undefined
  );

  const searchResults = searchQuery.length >= 2
    ? (searchData?.data?.data?.products || searchData?.data?.products || searchData?.data || []).slice(0, 5)
    : [];

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:5001${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'Categories', path: '/categories' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Become a Partner', path: '/partnership' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-background via-background to-accent/5 backdrop-blur-md supports-[backdrop-filter]:bg-background/90 border-b border-primary/20 shadow-sm" role="banner">
      {/* Traditional top accent border */}
      <div className="h-1 bg-gradient-indian-flag" aria-hidden="true" />

      <nav className="container mx-auto px-4 py-2" aria-label="Main navigation" role="navigation">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 group transition-all duration-300 hover:scale-105" aria-label="Matasree Super Masale — go to homepage">
            <img
              src={logo}
              alt="Matasree Super Masale logo" aria-hidden="true"
              className="h-14 w-auto object-contain drop-shadow-md"
            />
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center gap-1" role="list">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className="relative px-5 py-2.5 text-foreground/80 hover:text-primary font-bold tracking-wide text-sm transition-all duration-300 rounded-full hover:bg-primary/10 group uppercase"
                >
                  {link.name}
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-spice rounded-full transition-all duration-300 group-hover:w-2/3" />
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <div className={`${isSearchOpen ? 'flex' : 'hidden'} md:flex items-center`} ref={searchRef}>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search masalas..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
                  onFocus={() => setShowSearchResults(true)}
                  className="pl-10 w-48 lg:w-64 bg-secondary/50 border-2 border-primary/30 rounded-full focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 hover:border-primary/50"
                  aria-label="Search for masalas and spices"
                  role="combobox"
                  aria-expanded={showSearchResults && searchQuery.length >= 2}
                  aria-autocomplete="list"
                  aria-controls="search-results-dropdown"
                />
                {/* Search Results Dropdown */}
                {showSearchResults && searchQuery.length >= 2 && (
                  <div id="search-results-dropdown" className="absolute top-full mt-2 left-0 right-0 bg-card border border-border rounded-xl shadow-elevated py-2 z-50 search-dropdown min-w-[280px]" role="listbox" aria-label="Search suggestions">
                    {Array.isArray(searchResults) && searchResults.length > 0 ? (
                      <>
                        {searchResults.map((p: any) => (
                          <Link
                            key={p._id}
                            to={`/product/${p._id}`}
                            onClick={() => { setShowSearchResults(false); setSearchQuery(''); }}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors"
                            role="option"
                            aria-selected={false}
                          >
                            <img src={getImageUrl(p.image)} alt="" aria-hidden="true" className="w-10 h-10 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate capitalize">{p.name}</p>
                              <p className="text-xs text-muted-foreground">₹{p.price}</p>
                            </div>
                          </Link>
                        ))}
                        <Link
                          to={`/products?search=${searchQuery}`}
                          onClick={() => { setShowSearchResults(false); setSearchQuery(''); }}
                          className="block text-center text-sm text-primary font-semibold py-2 border-t border-border mt-1 hover:bg-secondary/30"
                        >
                          View all results →
                        </Link>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No products found</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full hover:bg-primary/10 transition-all"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label={isSearchOpen ? 'Close search' : 'Open search'}
              aria-expanded={isSearchOpen}
            >
              <Search className="w-5 h-5" aria-hidden="true" />
            </Button>

            {/* Wishlist */}
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full hover:bg-red-50 transition-all duration-300 hover:scale-110 hover:text-red-500"
              onClick={() => navigate('/wishlist')}
              aria-label={`Wishlist${wishlistTotal() > 0 ? ` (${wishlistTotal()} items)` : ''}`}
            >
              <Heart className="w-5 h-5" aria-hidden="true" />
              {wishlistTotal() > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs font-bold shadow-lg border border-white/50">
                  {wishlistTotal()}
                </Badge>
              )}
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full hover:bg-primary/10 transition-all duration-300 hover:scale-110 hover:text-primary"
              onClick={toggleCart}
              aria-label={`Shopping cart${totalItems() > 0 ? ` (${totalItems()} items)` : ''}`}
            >
              <ShoppingCart className="w-5 h-5" aria-hidden="true" />
              {totalItems() > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-gradient-spice text-white text-xs font-bold animate-pulse shadow-lg border border-white/50">
                  {totalItems()}
                </Badge>
              )}
            </Button>

            {/* User */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/10 transition-all duration-300 hover:scale-110 hover:text-primary" aria-label={`Account menu for ${user?.name}`}>
                    <User className="w-5 h-5" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-semibold">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')}>
                    My Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/addresses')}>
                    Addresses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/wishlist')}>
                    Wishlist
                  </DropdownMenuItem>
                  {user?.isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-4 py-2 text-xs font-semibold text-orange-600">ADMIN</div>
                      <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/users')}>
                        Users
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/products')}>
                        Products
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/categories')}>
                        Categories
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/orders')}>
                        Orders
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                className="rounded-full hover:bg-accent/10"
              >
                Login
              </Button>
            )}

            {/* Mobile Menu Toggle — opens slide-in drawer */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-full hover:bg-accent/10"
              aria-label={isDrawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isDrawerOpen}
              aria-controls="mobile-nav-drawer"
              onClick={() => setIsDrawerOpen(true)}
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>
        </div>

      </nav>
    </header>
    <MobileNavDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    <BottomTabBar />
    </>
  );
};

export default Navbar;
