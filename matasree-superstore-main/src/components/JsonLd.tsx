/**
 * JsonLd
 *
 * Renders a <script type="application/ld+json"> tag via react-helmet-async
 * to inject structured data (JSON-LD) schemas into a page's <head>.
 *
 * Usage:
 *   <JsonLd schema={buildProductSchema(product)} />
 *   <JsonLd schema={buildOrganizationSchema()} />
 *   <JsonLd schema={buildBreadcrumbSchema([...])} />
 *   <JsonLd schema={buildLocalBusinessSchema()} />
 *
 * Requirements: 27.1, 27.2, 27.3, 27.4, 27.5
 */
import { Helmet } from 'react-helmet-async';

// ─── Component ────────────────────────────────────────────────────────────────

export interface JsonLdProps {
  /** Pre-built JSON-LD schema object */
  schema: Record<string, unknown>;
}

const JsonLd = ({ schema }: JsonLdProps) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify(schema)}</script>
  </Helmet>
);

export default JsonLd;

// ─── Schema Builders ──────────────────────────────────────────────────────────

/** Availability mapping from stock count → schema.org value */
const stockAvailability = (stock: number): string =>
  stock > 0
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

/**
 * Product JSON-LD schema (Req 27.1)
 *
 * Includes aggregateRating only when the product has at least one review.
 */
export interface ProductSchemaInput {
  name: string;
  description: string;
  image: string;
  sku: string;
  price: number;
  stock: number;
  /** Number of approved reviews */
  reviewCount?: number;
  /** Average rating (1–5) */
  ratingValue?: number;
  /** Absolute product URL */
  url: string;
}

export const buildProductSchema = (p: ProductSchemaInput): Record<string, unknown> => {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: p.image,
    description: p.description,
    sku: p.sku,
    url: p.url,
    brand: {
      '@type': 'Brand',
      name: 'Matasree Super Masale',
    },
    offers: {
      '@type': 'Offer',
      price: p.price.toFixed(2),
      priceCurrency: 'INR',
      availability: stockAvailability(p.stock),
      url: p.url,
      seller: {
        '@type': 'Organization',
        name: 'Matasree Super Masale',
      },
    },
  };

  // Add aggregateRating only when the product has at least one approved review (Req 27.1)
  if (p.reviewCount && p.reviewCount > 0 && p.ratingValue) {
    schema['aggregateRating'] = {
      '@type': 'AggregateRating',
      ratingValue: p.ratingValue.toFixed(1),
      reviewCount: p.reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  return schema;
};

/**
 * Organization JSON-LD schema (Req 27.2)
 *
 * Used on Homepage and AboutPage.
 */
export const buildOrganizationSchema = (): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MATASREE SUPER MASALE',
  alternateName: 'MATASREE SUPER',
  url: 'https://www.matasreesuper.com',
  logo: 'https://www.matasreesuper.com/matasree-logo.png',
  description:
    '100% Pure stone-ground Himalayan spices. Premium single-origin and blended masalas from Dehradun, Uttarakhand.',
  foundingDate: '2008',
  vatID: 'FSSAI 22626030001734',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-6397415400',
    contactType: 'customer service',
    areaServed: 'IN',
    availableLanguage: ['English', 'Hindi'],
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'C-20, Gokul Enclave, Clement Town, Turner Road',
    addressLocality: 'Dehradun',
    postalCode: '248002',
    addressRegion: 'Uttarakhand',
    addressCountry: 'IN',
  },
  sameAs: [
    'https://www.instagram.com/matasreesuper_spices/',
  ],
});

/**
 * BreadcrumbList JSON-LD schema (Req 27.3)
 *
 * Used on ProductDetailPage and category pages.
 * Accepts an ordered array of { name, url } items.
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export const buildBreadcrumbSchema = (
  items: BreadcrumbItem[],
): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

/**
 * LocalBusiness JSON-LD schema (Req 27.4, 27.5)
 *
 * Used on AboutPage and ContactPage.
 */
export const buildLocalBusinessSchema = (): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'MATASREE SUPER MASALE',
  image: 'https://www.matasreesuper.com/matasree-logo.png',
  url: 'https://www.matasreesuper.com',
  telephone: '+91-6397415400',
  email: 'admin@matasreesuper.com',
  priceRange: '₹₹',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'C-20, Gokul Enclave, Clement Town, Turner Road',
    addressLocality: 'Dehradun',
    postalCode: '248002',
    addressRegion: 'Uttarakhand',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 30.2634,
    longitude: 78.0281,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
      opens: '09:00',
      closes: '18:00',
    },
  ],
  servesCuisine: 'Indian Spices',
  description:
    'Premium authentic Indian spices and masalas manufactured at our FSSAI-certified facility in Dehradun, India.',
});
