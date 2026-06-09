import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useAddresses } from '@/hooks/useApi';
import { apiClient } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { toast } from 'sonner';
import {
    MapPin, CreditCard, Truck, ShoppingBag, ArrowLeft,
    CheckCircle, Plus, Loader2, Package, Shield, Tag, X, Percent
} from 'lucide-react';

declare global {
    interface Window {
        Razorpay: any;
    }
}

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { items, totalPrice, clearCart } = useCartStore();
    const { isAuthenticated, user } = useAuthStore();
    const { data: addressesData, isLoading: addressesLoading } = useAddresses();

    const [selectedAddressId, setSelectedAddressId] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('razorpay');
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState(1);

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<{
        code: string;
        discountType: string;
        discountValue: number;
        maxDiscount: number;
        calculatedDiscount: number;
    } | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const hasAuth = isAuthenticated || !!token;
        if (!hasAuth) {
            toast.error('Please login to checkout');
            navigate('/login');
            return;
        }
        if (items.length === 0) {
            navigate('/products');
        }
    }, [isAuthenticated, items.length, navigate]);

    const addresses = useMemo(() => {
        if (!addressesData) return [];
        const data = addressesData.data?.data || addressesData.data || [];
        return Array.isArray(data) ? data : [];
    }, [addressesData]);

    useEffect(() => {
        if (addresses.length > 0 && !selectedAddressId) {
            const defaultAddr = addresses.find((a: any) => a.isDefault);
            setSelectedAddressId(defaultAddr?._id || addresses[0]._id);
        }
    }, [addresses, selectedAddressId]);

    const getImageUrl = (path: string | null | undefined): string => {
        if (!path) return 'https://via.placeholder.com/100';
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        const BACKEND_URL = 'http://localhost:5001';
        return path.startsWith('/') ? `${BACKEND_URL}${path}` : `${BACKEND_URL}/${path}`;
    };

    const subtotal = totalPrice();
    const shippingFee = subtotal >= 499 ? 0 : 49;
    const couponDiscount = appliedCoupon?.calculatedDiscount || 0;
    const total = Math.max(0, subtotal + shippingFee - couponDiscount);

    // Coupon handlers
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            toast.error('Please enter a coupon code');
            return;
        }

        setCouponLoading(true);
        try {
            const response = await apiClient.validateCoupon(couponCode.trim(), subtotal);
            const couponData = response.data.data;

            setAppliedCoupon(couponData);
            toast.success(`Coupon applied! You save ₹${couponData.calculatedDiscount} 🎉`);
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Invalid coupon code';
            toast.error(msg);
            setAppliedCoupon(null);
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        toast.info('Coupon removed');
    };

    // Sync local cart items to backend cart before order
    const syncCartToBackend = async () => {
        try {
            for (const item of items) {
                await apiClient.addToCart({ productId: item.id, quantity: item.quantity });
            }
        } catch (error) {
            console.error('Cart sync error:', error);
        }
    };

    const loadRazorpayScript = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            toast.error('Please select a delivery address');
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Sync cart to backend
            await syncCartToBackend();

            // 2. Create order
            const orderResponse = await apiClient.createOrder({
                addressId: selectedAddressId,
                paymentMethod,
                couponCode: appliedCoupon?.code || undefined,
                couponDiscount: couponDiscount || undefined,
            });

            const { order, razorpayOrder } = orderResponse.data.data;

            // 3. Mark coupon as used
            if (appliedCoupon?.code && order?._id) {
                try {
                    await apiClient.applyCoupon(appliedCoupon.code, order._id);
                } catch (err) {
                    console.error('Failed to mark coupon as used:', err);
                }
            }

            if (paymentMethod === 'razorpay' && razorpayOrder) {
                // 4. Open Razorpay
                const scriptLoaded = await loadRazorpayScript();
                if (!scriptLoaded) {
                    toast.error('Failed to load payment gateway');
                    setIsProcessing(false);
                    return;
                }

                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency || 'INR',
                    name: 'Matasree Super',
                    description: `Order ${order.orderNumber}`,
                    order_id: razorpayOrder.id,
                    handler: async (response: any) => {
                        try {
                            await apiClient.post('/orders/verify-payment', {
                                orderId: order._id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpaySignature: response.razorpay_signature,
                            });
                            clearCart();
                            toast.success('Payment successful! 🎉');
                            navigate('/orders');
                        } catch (err: any) {
                            toast.error('Payment verification failed');
                        }
                    },
                    prefill: {
                        name: user?.name || '',
                        email: user?.email || '',
                    },
                    theme: {
                        color: '#D4A373',
                    },
                    modal: {
                        ondismiss: () => {
                            setIsProcessing(false);
                            toast.info('Payment cancelled');
                        },
                    },
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                // COD order
                clearCart();
                toast.success('Order placed successfully! 🎉', {
                    description: 'You will pay on delivery.',
                });
                navigate('/orders');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to place order');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="page-enter container mx-auto px-4 pt-24 pb-16">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">Checkout</h1>
                        <p className="text-muted-foreground">Complete your order</p>
                    </div>
                </div>

                {/* Steps Indicator */}
                <div className="flex items-center justify-center gap-2 mb-10">
                    {[
                        { num: 1, label: 'Address', icon: MapPin },
                        { num: 2, label: 'Payment', icon: CreditCard },
                        { num: 3, label: 'Review', icon: CheckCircle },
                    ].map((s, i) => (
                        <div key={s.num} className="flex items-center">
                            <button
                                onClick={() => setStep(s.num)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${step >= s.num ? 'bg-gradient-spice text-white shadow-md' : 'bg-secondary text-muted-foreground'}`}
                            >
                                <s.icon className="w-4 h-4" /> {s.label}
                            </button>
                            {i < 2 && <div className={`w-8 h-0.5 mx-1 ${step > s.num ? 'bg-primary' : 'bg-border'}`} />}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Steps */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Step 1: Address */}
                        {step >= 1 && (
                            <div className={`bg-card rounded-2xl p-6 border shadow-sm ${step === 1 ? 'border-primary/40' : 'border-border'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-serif text-xl font-bold flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-primary" /> Delivery Address
                                    </h2>
                                    <Button variant="outline" size="sm" onClick={() => navigate('/addresses')} className="text-xs">
                                        <Plus className="w-3 h-3 mr-1" /> Add New
                                    </Button>
                                </div>
                                {addressesLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                                    </div>
                                ) : addresses.length > 0 ? (
                                    <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId} className="space-y-3">
                                        {addresses.map((addr: any) => (
                                            <Label key={addr._id} htmlFor={addr._id} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddressId === addr._id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                                                <RadioGroupItem value={addr._id} id={addr._id} className="mt-1" />
                                                <div className="flex-1">
                                                    <p className="font-semibold text-foreground">{addr.name} <span className="text-muted-foreground font-normal">• {addr.phone}</span></p>
                                                    <p className="text-sm text-muted-foreground mt-1">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</p>
                                                    <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} - {addr.pincode}</p>
                                                    {addr.isDefault && <Badge className="mt-2 bg-primary/10 text-primary text-xs">Default</Badge>}
                                                </div>
                                            </Label>
                                        ))}
                                    </RadioGroup>
                                ) : (
                                    <div className="text-center py-8">
                                        <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-muted-foreground mb-4">No saved addresses</p>
                                        <Button onClick={() => navigate('/addresses')} className="bg-gradient-spice text-white">
                                            <Plus className="w-4 h-4 mr-2" /> Add Address
                                        </Button>
                                    </div>
                                )}
                                {step === 1 && addresses.length > 0 && (
                                    <Button onClick={() => setStep(2)} className="w-full mt-4 bg-gradient-spice text-white py-6 rounded-xl">
                                        Continue to Payment
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Step 2: Payment */}
                        {step >= 2 && (
                            <div className={`bg-card rounded-2xl p-6 border shadow-sm ${step === 2 ? 'border-primary/40' : 'border-border'}`}>
                                <h2 className="font-serif text-xl font-bold flex items-center gap-2 mb-4">
                                    <CreditCard className="w-5 h-5 text-primary" /> Payment Method
                                </h2>
                                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'cod' | 'razorpay')} className="space-y-3">
                                    <Label htmlFor="razorpay" className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                                        <RadioGroupItem value="razorpay" id="razorpay" />
                                        <div className="flex-1">
                                            <p className="font-semibold">Pay Online (Razorpay)</p>
                                            <p className="text-sm text-muted-foreground">UPI, Cards, Net Banking, Wallets</p>
                                        </div>
                                        <Shield className="w-5 h-5 text-green-600" />
                                    </Label>
                                    <Label htmlFor="cod" className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                                        <RadioGroupItem value="cod" id="cod" />
                                        <div className="flex-1">
                                            <p className="font-semibold">Cash on Delivery</p>
                                            <p className="text-sm text-muted-foreground">Pay when your order arrives</p>
                                        </div>
                                        <Truck className="w-5 h-5 text-primary" />
                                    </Label>
                                </RadioGroup>
                                {step === 2 && (
                                    <Button onClick={() => setStep(3)} className="w-full mt-4 bg-gradient-spice text-white py-6 rounded-xl">
                                        Review Order
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Step 3: Review */}
                        {step >= 3 && (
                            <div className="bg-card rounded-2xl p-6 border border-primary/40 shadow-sm">
                                <h2 className="font-serif text-xl font-bold flex items-center gap-2 mb-4">
                                    <CheckCircle className="w-5 h-5 text-primary" /> Review Your Order
                                </h2>
                                <div className="space-y-3 mb-6">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 p-3 bg-secondary/30 rounded-xl">
                                            <img src={getImageUrl(item.image)} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm">{item.name}</p>
                                                <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="font-serif font-bold">₹{(item.price * item.quantity).toFixed(0)}</p>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    onClick={handlePlaceOrder}
                                    disabled={isProcessing}
                                    className="w-full bg-gradient-spice text-white font-bold py-7 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                                >
                                    {isProcessing ? (
                                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                                    ) : (
                                        <><ShoppingBag className="w-5 h-5 mr-2" /> Place Order — ₹{total}</>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Right: Order Summary + Coupon */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Coupon Code Section */}
                        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                            <h3 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-primary" /> Apply Coupon
                            </h3>

                            {appliedCoupon ? (
                                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                                <Percent className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-mono font-bold text-green-800 text-lg tracking-wider">{appliedCoupon.code}</p>
                                                <p className="text-sm text-green-600">
                                                    {appliedCoupon.discountType === 'percentage'
                                                        ? `${appliedCoupon.discountValue}% off`
                                                        : `₹${appliedCoupon.discountValue} off`}
                                                    {appliedCoupon.maxDiscount > 0 && ` (up to ₹${appliedCoupon.maxDiscount})`}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={handleRemoveCoupon} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-green-200 flex justify-between">
                                        <span className="text-sm text-green-700 font-medium">You save</span>
                                        <span className="font-bold text-green-700">-₹{appliedCoupon.calculatedDiscount}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Enter coupon code"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                            className="bg-secondary/30 rounded-xl font-mono tracking-wider uppercase"
                                            maxLength={20}
                                        />
                                        <Button
                                            onClick={handleApplyCoupon}
                                            disabled={couponLoading || !couponCode.trim()}
                                            variant="outline"
                                            className="px-6 rounded-xl border-primary text-primary hover:bg-primary hover:text-white transition-all font-bold"
                                        >
                                            {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        💡 Subscribe to our newsletter to get your exclusive 10% off code!
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Order Summary */}
                        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm sticky top-24">
                            <h3 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-primary" /> Order Summary
                            </h3>
                            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
                                {items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3">
                                        <img src={getImageUrl(item.image)} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                                        </div>
                                        <p className="text-sm font-bold">₹{(item.price * item.quantity).toFixed(0)}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-border pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">₹{subtotal.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span className={`font-medium ${shippingFee === 0 ? 'text-green-600' : ''}`}>
                                        {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                                    </span>
                                </div>
                                {couponDiscount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600 font-medium flex items-center gap-1">
                                            <Tag className="w-3 h-3" /> Coupon Discount
                                        </span>
                                        <span className="font-medium text-green-600">-₹{couponDiscount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-3 border-t border-border">
                                    <span className="font-bold text-lg">Total</span>
                                    <div className="text-right">
                                        {couponDiscount > 0 && (
                                            <span className="text-sm text-muted-foreground line-through mr-2">₹{(subtotal + shippingFee).toFixed(0)}</span>
                                        )}
                                        <span className="font-serif text-2xl font-bold text-primary">₹{total.toFixed(0)}</span>
                                    </div>
                                </div>
                            </div>
                            {subtotal < 499 && (
                                <div className="mt-4 p-3 bg-primary/10 rounded-xl text-sm text-center">
                                    Add <strong>₹{(499 - subtotal).toFixed(0)}</strong> more for <strong className="text-green-600">FREE shipping!</strong>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <CartDrawer />
        </div>
    );
};

export default CheckoutPage;
