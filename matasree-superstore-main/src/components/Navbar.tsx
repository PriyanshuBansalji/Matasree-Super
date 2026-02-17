import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, ShoppingCart, User, Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { toggleCart, totalItems } = useCartStore();
  const { user, logout, isAuthenticated } = useAuthStore();

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
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-background via-background to-accent/5 backdrop-blur-md supports-[backdrop-filter]:bg-background/90 border-b border-primary/20 shadow-sm">
      {/* Traditional top accent border */}
      <div className="h-1 bg-gradient-indian-flag" />
      
      <nav className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 group transition-all duration-300 hover:scale-105">
            <img 
              src={logo} 
              alt="Matasree Super" 
              className="h-14 w-auto object-contain drop-shadow-md"
            />
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className="relative px-4 py-2 text-foreground/80 hover:text-primary font-medium transition-all duration-300 rounded-full hover:bg-primary/10 group"
                >
                  {link.name}
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-spice rounded-full transition-all duration-300 group-hover:w-1/2" />
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <div className={`${isSearchOpen ? 'flex' : 'hidden'} md:flex items-center`}>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search masalas..."
                  className="pl-10 w-48 lg:w-64 bg-secondary/50 border-2 border-primary/30 rounded-full focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 hover:border-primary/50"
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full hover:bg-primary/10 transition-all"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full hover:bg-primary/10 transition-all duration-300"
              onClick={toggleCart}
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems() > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-gradient-spice text-white text-xs font-bold animate-pulse shadow-md">
                  {totalItems()}
                </Badge>
              )}
            </Button>

            {/* User */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/10 transition-all duration-300">
                    <User className="w-5 h-5" />
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

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-full hover:bg-accent/10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-accent/20 pt-4 animate-fade-in">
            <ul className="flex flex-col gap-2">
              {navLinks.map((link, index) => (
                <li 
                  key={link.name}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Link
                    to={link.path}
                    className="block py-3 px-4 text-foreground/80 hover:text-primary hover:bg-accent/10 font-medium transition-all duration-300 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
