/**
 * Shared Type Definitions
 *
 * These interfaces mirror the actual shapes returned by the backend API.
 * MongoDB uses `_id` as the primary key; we expose both `_id` and an `id`
 * alias for convenience. All code should prefer `_id` for consistency.
 */

/**
 * A single weight/price/stock variant of a product.
 * e.g. { weight: "100g", price: 99, originalPrice: 129, stock: 50 }
 */
export interface ProductVariant {
  _id?: string;
  weight: string;
  price: number;
  originalPrice?: number;
  stock: number;
}

export interface Product {
  _id: string;
  /** @alias _id — convenience alias for components expecting `id` */
  id?: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  stock: number;
  rating: number;
  reviews: number;
  sold?: number;
  inStock?: boolean;
  weight: string;
  /** Per-weight variants with individual price/stock. When present, UI shows a weight picker. */
  variants?: ProductVariant[];
  /** Admin-managed keyword tags for improved search discoverability */
  tags?: string[];
  isNewProduct?: boolean;
  isBestseller?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  image: string;
  productCount?: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  /** The weight variant selected when adding to cart (e.g. "250g") */
  weight?: string;
  description?: string;
}

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  avatar?: string;
  provider?: 'local' | 'google' | 'github';
  isEmailVerified?: boolean;
  referralCode?: string;
  /** @deprecated Use `role === 'admin'` instead */
  isAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  _id: string;
  id?: string;
  userId: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface ShippingAddress {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface Order {
  _id: string;
  id?: string;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  orderstatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'cashfree' | 'cod' | 'razorpay';
  paymentStatus: 'pending' | 'paid' | 'failed';
  shippingAddress: ShippingAddress;
  couponCode?: string;
  discountAmount?: number;
  loyaltyPointsEarned?: number;
  loyaltyPointsRedeemed?: number;
  loyaltyDiscountAmount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Normalizes MongoDB `_id` to also be available as `id`.
 * Use this when passing backend data to components that expect `id`.
 */
export function normalizeId<T extends { _id: string; id?: string }>(item: T): T & { id: string } {
  return { ...item, id: item._id };
}
