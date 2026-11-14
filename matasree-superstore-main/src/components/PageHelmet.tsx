/**
 * PageHelmet
 *
 * Reusable SEO wrapper component using react-helmet-async.
 * Sets <title>, meta description, canonical URL, Open Graph tags,
 * and optionally a noindex robots directive for private pages.
 *
 * Requirements: 26.1, 26.2, 26.3, 26.4, 26.5
 */
import { Helmet } from 'react-helmet-async';

export interface PageHelmetProps {
  /** Full page title, e.g. "Chilli Powder 500g | Matasree Super Masale" */
  title: string;
  /** Meta description for the page */
  description?: string;
  /** Absolute Cloudinary / CDN URL for og:image */
  ogImage?: string;
  /** Open Graph type — defaults to "website" */
  ogType?: 'website' | 'product';
  /** Absolute canonical URL for this page */
  canonicalUrl?: string;
  /** When true, renders <meta name="robots" content="noindex, nofollow"> */
  noIndex?: boolean;
}

const DEFAULT_OG_IMAGE =
  'https://res.cloudinary.com/matasree/image/upload/v1/matasree-og-default.jpg';

const DEFAULT_DESCRIPTION =
  'Matasree Super - Buy authentic spices, pure masalas, and high-quality grocery online with fast delivery.';

const PageHelmet = ({
  title,
  description = DEFAULT_DESCRIPTION,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  canonicalUrl,
  noIndex = false,
}: PageHelmetProps) => {
  const currentUrl =
    canonicalUrl ||
    (typeof window !== 'undefined' ? window.location.href : 'https://matasreesuper.com');

  return (
    <Helmet>
      {/* Primary meta */}
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {currentUrl && <link rel="canonical" href={currentUrl} />}

      {/* Robots — only emit noindex tag when explicitly required */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={ogImage} />
      {currentUrl && <meta property="og:url" content={currentUrl} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Matasree Super Masale" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default PageHelmet;
