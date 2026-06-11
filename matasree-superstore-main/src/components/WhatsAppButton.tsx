import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined;

// ─── Named exports (used individually by pages) ───────────────────────────────

/** Order button for the Product Detail page */
export interface WhatsAppOrderButtonProps {
  productName: string;
  qty: number;
  price: number;
}

export const WhatsAppOrderButton = ({ productName, qty, price }: WhatsAppOrderButtonProps) => {
  if (!WHATSAPP_NUMBER) return null;

  const message = `Hi, I'd like to order: ${productName} x${qty} — ₹${price.toFixed(0)}. Please confirm availability.`;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full" aria-label={`Order ${productName} via WhatsApp`}>
      <Button
        type="button"
        className="w-full bg-[#25D366] hover:bg-green-600 text-white font-bold rounded-xl py-6 shadow-md transition-all flex items-center justify-center gap-2"
      >
        <MessageCircle className="w-5 h-5" aria-hidden="true" />
        Order via WhatsApp
      </Button>
    </a>
  );
};

/** Order button for the Cart page / drawer */
export interface CartItem {
  name: string;
  qty: number;
  price: number;
}

export interface WhatsAppCartButtonProps {
  cartItems: CartItem[];
  total: number;
}

export const WhatsAppCartButton = ({ cartItems, total }: WhatsAppCartButtonProps) => {
  if (!WHATSAPP_NUMBER) return null;
  if (cartItems.length === 0) return null;

  const lines = cartItems
    .map((item) => `- ${item.name} x${item.qty} — ₹${item.price.toFixed(0)}`)
    .join('\n');
  const message = `Hi, I'd like to order:\n${lines}\nTotal: ₹${total.toFixed(0)}`;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full" aria-label="Order cart items via WhatsApp">
      <Button
        type="button"
        className="w-full bg-[#25D366] hover:bg-green-600 text-white font-bold rounded-xl py-3 shadow-md transition-all flex items-center justify-center gap-2"
      >
        <MessageCircle className="w-5 h-5" aria-hidden="true" />
        Order via WhatsApp
      </Button>
    </a>
  );
};

/** Floating action button — mobile only (< 768 px), fixed bottom-right, all pages */
export const WhatsAppFAB = () => {
  if (!WHATSAPP_NUMBER) return null;

  const message = `Hi, I need help with my order.`;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-50 md:hidden"
      aria-label="Chat on WhatsApp"
    >
      <div className="bg-[#25D366] hover:bg-green-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95">
        <MessageCircle className="w-7 h-7" />
      </div>
    </a>
  );
};

// ─── Legacy default export (variant-based) — kept for backwards compat ────────

interface WhatsAppButtonProductProps {
  variant: 'product';
  productName: string;
  price: number;
  quantity: number;
}

interface WhatsAppButtonFloatingProps {
  variant: 'floating';
}

interface WhatsAppButtonCartProps {
  variant: 'cart';
  cartItems?: CartItem[];
  total?: number;
}

type WhatsAppButtonProps =
  | WhatsAppButtonProductProps
  | WhatsAppButtonFloatingProps
  | WhatsAppButtonCartProps;

const WhatsAppButton = (props: WhatsAppButtonProps) => {
  if (!WHATSAPP_NUMBER) return null;

  if (props.variant === 'product') {
    return (
      <WhatsAppOrderButton
        productName={props.productName}
        qty={props.quantity}
        price={props.price}
      />
    );
  }

  if (props.variant === 'cart') {
    if (!props.cartItems || props.cartItems.length === 0) return null;
    return (
      <WhatsAppCartButton
        cartItems={props.cartItems}
        total={props.total ?? 0}
      />
    );
  }

  if (props.variant === 'floating') {
    return <WhatsAppFAB />;
  }

  return null;
};

export default WhatsAppButton;
