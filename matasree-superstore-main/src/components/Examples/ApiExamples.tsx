import { useState } from 'react';
import { useProducts, useAddToCart, useLogin } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Example Component: ProductsExample
 * Demonstrates how to use the API hooks in a real component
 */

export function ProductsExample() {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Fetch products using React Query
  const { data: productsData, isLoading, error } = useProducts();

  // Mutation for adding to cart
  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();

  const handleAddToCart = (productId: string) => {
    addToCart(
      { productId, quantity: 1 },
      {
        onSuccess: () => {
          alert('Product added to cart!');
        },
        onError: (error) => {
          alert('Failed to add to cart: ' + (error as any).message);
        },
      }
    );
  };

  if (isLoading) return <div>Loading products...</div>;
  if (error) return <div>Error loading products</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {productsData?.data?.products?.map((product: any) => (
        <Card key={product._id}>
          <CardHeader>
            <CardTitle>{product.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{product.description}</p>
            <p className="text-lg font-bold mb-4">₹{product.price}</p>
            <Button
              onClick={() => handleAddToCart(product._id)}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Example Component: LoginExample
 * Demonstrates authentication flow
 */

export function LoginExample() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { mutate: login, isPending: isLoading, error } = useLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    login(
      { email, password },
      {
        onSuccess: (response) => {
          console.log('Login successful!', response.data);
          // Redirect to dashboard or home page
          window.location.href = '/dashboard';
        },
        onError: (error) => {
          console.error('Login failed:', error);
        },
      }
    );
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm">
                {(error as any).response?.data?.message || 'Login failed'}
              </div>
            )}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Example Component: CartExample
 * Demonstrates cart management
 */

export function CartExample() {
  const { data: cartData, isLoading } = useCart();
  const { mutate: removeFromCart } = useRemoveFromCart();
  const { mutate: updateCartItem } = useUpdateCartItem();

  if (isLoading) return <div>Loading cart...</div>;

  const cartItems = cartData?.data?.items || [];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Shopping Cart</h2>

      {cartItems.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        cartItems.map((item: any) => (
          <Card key={item._id}>
            <CardContent className="flex justify-between items-center p-4">
              <div>
                <h3 className="font-bold">{item.product.name}</h3>
                <p className="text-gray-600">₹{item.product.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateCartItem({
                      itemId: item._id,
                      quantity: parseInt(e.target.value),
                    })
                  }
                  className="w-20 px-2 py-1 border rounded"
                />
                <Button
                  variant="destructive"
                  onClick={() => removeFromCart(item._id)}
                >
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {cartItems.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-lg font-bold">
              Total: ₹
              {cartItems.reduce(
                (sum: number, item: any) =>
                  sum + item.product.price * item.quantity,
                0
              )}
            </p>
            <Button className="w-full mt-4">Proceed to Checkout</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Example Component: CategoryExample
 * Demonstrates category browsing
 */

import { useCart, useRemoveFromCart, useUpdateCartItem } from '@/hooks/useApi';
import { useCategories } from '@/hooks/useApi';

export function CategoryExample() {
  const { data: categoriesData, isLoading } = useCategories();

  if (isLoading) return <div>Loading categories...</div>;

  const categories = categoriesData?.data?.categories || [];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map((category: any) => (
        <Card key={category._id} className="cursor-pointer hover:shadow-lg">
          <CardContent className="p-4">
            <h3 className="font-bold text-center">{category.name}</h3>
            <p className="text-sm text-gray-600 text-center mt-2">
              {category.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Example Component: OrderExample
 * Demonstrates order creation and history
 */

import { useOrders, useCreateOrder } from '@/hooks/useApi';

export function OrderExample() {
  const { data: ordersData, isLoading } = useOrders();
  const { mutate: createOrder, isPending: isCreating } = useCreateOrder();

  const handleCreateOrder = () => {
    const orderData = {
      items: [
        // This would come from your cart
        { productId: '123', quantity: 2 },
      ],
      address: {
        street: '123 Main St',
        city: 'City',
        state: 'State',
        zipCode: '12345',
      },
      paymentMethod: 'razorpay',
    };

    createOrder(orderData, {
      onSuccess: (response) => {
        console.log('Order created:', response.data);
        // Redirect to payment or order confirmation
      },
      onError: (error) => {
        console.error('Failed to create order:', error);
      },
    });
  };

  const orders = ordersData?.data?.orders || [];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Orders</h2>

      {isLoading ? (
        <div>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div>
          <p>No orders yet</p>
          <Button onClick={handleCreateOrder} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create New Order'}
          </Button>
        </div>
      ) : (
        orders.map((order: any) => (
          <Card key={order._id}>
            <CardHeader>
              <CardTitle>Order #{order._id}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Status: {order.status}</p>
              <p>Total: ₹{order.total}</p>
              <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

export default ProductsExample;
