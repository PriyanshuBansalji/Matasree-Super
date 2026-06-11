/**
 * EmptyState
 *
 * Reusable empty-state component with five variants:
 *  - cart      : Empty cart + CTA to browse products
 *  - wishlist  : Empty wishlist + CTA to browse products
 *  - search    : No products found + optional searchQuery display + CTA to browse categories
 *  - orders    : No orders yet + CTA to start shopping
 *  - reviews   : Be the first to review + CTA to write a review
 *
 * Requirements: 21.1, 21.2, 21.3
 */

import { ShoppingCart, Heart, Search, Package, MessageSquare, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type EmptyStateVariant = 'cart' | 'wishlist' | 'search' | 'orders' | 'reviews';

export interface EmptyStateProps {
  variant: EmptyStateVariant;
  /** For 'search' variant — shown in the message when provided */
  searchQuery?: string;
}

// ─── Variant config ────────────────────────────────────────────────────────────

interface VariantConfig {
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  description: (searchQuery?: string) => string;
  ctaLabel: string;
  ctaHref?: string;
  ctaAction?: boolean; // when true, renders as a plain button (no href)
}

const VARIANT_CONFIG: Record<EmptyStateVariant, VariantConfig> = {
  cart: {
    Icon: ShoppingCart,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    title: 'Your cart is empty',
    description: () =>
      "Looks like you haven't added anything yet. Explore our range of premium spices and condiments.",
    ctaLabel: 'Browse Products',
    ctaHref: '/products',
  },
  wishlist: {
    Icon: Heart,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    title: 'Your wishlist is empty',
    description: () =>
      "Save your favourite products here so you can easily find them later.",
    ctaLabel: 'Browse Products',
    ctaHref: '/products',
  },
  search: {
    Icon: Search,
    iconBg: 'bg-muted/60',
    iconColor: 'text-muted-foreground',
    title: 'No products found',
    description: (searchQuery) =>
      searchQuery
        ? `We couldn't find any products matching "${searchQuery}". Try a different keyword or browse our categories.`
        : "We couldn't find any products matching your search. Try a different keyword or browse our categories.",
    ctaLabel: 'Browse Categories',
    ctaHref: '/products',
  },
  orders: {
    Icon: Package,
    iconBg: 'bg-saffron/10',
    iconColor: 'text-saffron',
    title: "You haven't placed any orders yet",
    description: () =>
      'Once you place an order it will appear here. Start shopping to discover our handpicked spices.',
    ctaLabel: 'Start Shopping',
    ctaHref: '/products',
  },
  reviews: {
    Icon: MessageSquare,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    title: 'Be the first to review',
    description: () =>
      'Share your experience with this product and help other customers make informed decisions.',
    ctaLabel: 'Write a Review',
    ctaAction: true,
  },
};

// ─── Component ─────────────────────────────────────────────────────────────────

const EmptyState = ({ variant, searchQuery }: EmptyStateProps) => {
  const config = VARIANT_CONFIG[variant];
  const { Icon, iconBg, iconColor, title, description, ctaLabel, ctaHref, ctaAction } = config;

  return (
    <div
      className="flex flex-col items-center justify-center text-center py-16 px-6 bg-card rounded-2xl border border-border/50"
      role="status"
      aria-label={title}
    >
      {/* Icon — ≥ 64×64 px as required */}
      <div
        className={`w-20 h-20 rounded-full ${iconBg} flex items-center justify-center mb-6 flex-shrink-0`}
        aria-hidden="true"
      >
        <Icon className={`w-10 h-10 ${iconColor}`} />
      </div>

      {/* Title */}
      <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mb-8">
        {description(searchQuery)}
      </p>

      {/* CTA */}
      {ctaAction ? (
        // Reviews variant — scroll to review form or trigger parent action via a button
        <Button variant="default" className="font-serif font-semibold">
          {ctaLabel}
        </Button>
      ) : ctaHref ? (
        <Button variant="default" className="font-serif font-semibold" asChild>
          <Link to={ctaHref}>{ctaLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
};

export default EmptyState;
