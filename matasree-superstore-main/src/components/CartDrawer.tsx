import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import { Link } from 'react-router-dom';

const CartDrawer = () => {
  const { items, isOpen, setCartOpen, updateQuantity, removeItem, totalPrice } = useCartStore();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={() => setCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background z-50 shadow-2xl flex flex-col animate-slide-in-right" data-lenis-prevent>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-spice flex items-center justify-center shadow-md">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold">Your Cart</h2>
              <p className="text-sm text-muted-foreground">{items.length} items</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCartOpen(false)}
            className="rounded-full hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Free shipping banner */}
        {items.length > 0 && totalPrice() < 499 && (
          <div className="mx-4 mt-4 p-3 bg-primary/10 rounded-xl border border-primary/20">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Add <strong>₹{499 - totalPrice()}</strong> more for free shipping!</span>
            </div>
            <div className="mt-2 h-2 bg-primary/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-spice rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalPrice() / 499) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                <ShoppingBag className="w-12 h-12 text-muted-foreground/30" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6">Discover our premium spices and add them to your cart</p>
              <Button asChild onClick={() => setCartOpen(false)} className="bg-gradient-spice hover:opacity-90 text-white">
                <Link to="/products">
                  Start Shopping
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                className="flex gap-4 bg-card rounded-2xl p-4 shadow-soft border border-border/50 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-xl"
                  />
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {item.quantity}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground line-clamp-1 mb-1">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{item.weight}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-md hover:bg-background"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-md hover:bg-background"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-serif font-bold text-lg">₹{item.price * item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-6 space-y-4 bg-gradient-to-t from-secondary/50 to-background">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{totalPrice()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-green-600">{totalPrice() >= 499 ? 'FREE' : '₹49'}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="font-semibold">Total</span>
                <span className="font-serif text-2xl font-bold text-primary">
                  ₹{totalPrice() + (totalPrice() >= 499 ? 0 : 49)}
                </span>
              </div>
            </div>
            <Button asChild className="w-full bg-gradient-spice hover:opacity-90 text-white font-semibold py-6 rounded-xl shadow-lg group">
              <Link to="/checkout" onClick={() => setCartOpen(false)}>
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full hover:bg-secondary"
              onClick={() => setCartOpen(false)}
            >
              Continue Shopping
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;