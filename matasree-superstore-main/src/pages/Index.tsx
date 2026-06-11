/**
 * Index (Homepage)
 *
 * Section order (Requirements 17.1):
 *  1. Hero banner — HeroParallax
 *  2. Featured Categories — FeaturedCategoriesSection
 *  3. Bestseller products — ProductScrollGrid
 *  4. Recently Viewed — RecentlyViewedSection (after bestsellers)
 *  5. Seasonal banner slot — SeasonalBannerSlot
 *  6. Testimonials — TestimonialsSection
 *  7. Newsletter signup — NewsletterSection
 *
 * Additional brand/content sections come AFTER newsletter (not affecting primary flow).
 *
 * Requirements: 17.1, 17.2, 17.3, 17.4
 */
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { SmoothScroll } from '@/components/home/SmoothScroll';
import RecentlyViewedSection from '@/components/RecentlyViewedSection';
import SeasonalBannerSlot from '@/components/SeasonalBannerSlot';

// ── Primary sections (spec-mandated order) ──────────────────────────────────
import { HeroParallax } from '@/components/home/HeroParallax';
import FeaturedCategoriesSection from '@/components/home/FeaturedCategoriesSection';
import { ProductScrollGrid } from '@/components/home/ProductScrollGrid';
import TestimonialsSection from '@/components/TestimonialsSection';
import NewsletterSection from '@/components/NewsletterSection';

// ── Secondary brand/content sections (after newsletter) ─────────────────────
import FeaturesSection from '@/components/FeaturesSection';
import { BrandStoryScroll } from '@/components/home/BrandStoryScroll';
import WhyChooseUsSection from '@/components/WhyChooseUsSection';
import OurProcess from '@/components/OurProcess';
import { TrustStatsSection } from '@/components/home/TrustStatsSection';
import FAQSection from '@/components/FAQSection';
import { PremiumCTA } from '@/components/home/PremiumCTA';
import PageHelmet from '@/components/PageHelmet';
import JsonLd, { buildOrganizationSchema } from '@/components/JsonLd';

/** Shared whileInView animation variant (Requirements 17.3) */
const scrollReveal = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

const Index = () => {
  return (
    <SmoothScroll>
      <div className="bg-brand-cream text-brand-cinnamon font-sans min-h-screen selection:bg-brand-chili selection:text-white">
        <PageHelmet
          title="Matasree Super Masale — Premium Indian Spices"
          description="Discover Matasree Super Masale — authentic premium Indian spices sourced from the finest farms. Shop chilli powder, turmeric, garam masala, and more."
          canonicalUrl="https://matasreesuper.com/"
          ogType="website"
        />
        {/* Organization JSON-LD structured data (Req 27.2) */}
        <JsonLd schema={buildOrganizationSchema()} />
        <Navbar />

        <main className="overflow-x-clip">
          {/* ━━━━ 1. HERO ━━━━ */}
          {/* HeroParallax has its own internal animations — no double-wrap */}
          <HeroParallax />

          {/* ━━━━ 2. FEATURED CATEGORIES ━━━━ */}
          {/* FeaturedCategoriesSection applies whileInView internally */}
          <FeaturedCategoriesSection />

          {/* ━━━━ 3. BESTSELLER PRODUCTS ━━━━ */}
          {/* ProductScrollGrid has its own internal scroll animations — no double-wrap */}
          <ProductScrollGrid />

          {/* ━━━━ 4. RECENTLY VIEWED ━━━━ */}
          {/* Shows only when items exist in local storage */}
          <div className="container mx-auto px-4">
            <RecentlyViewedSection />
          </div>

          {/* ━━━━ 5. SEASONAL BANNER ━━━━ */}
          {/* SeasonalBannerSlot has its own whileInView — no double-wrap */}
          <SeasonalBannerSlot />

          {/* ━━━━ 6. TESTIMONIALS ━━━━ */}
          {/* TestimonialsSection has its own internal animations — no double-wrap */}
          <TestimonialsSection />

          {/* ━━━━ 7. NEWSLETTER ━━━━ */}
          {/* NewsletterSection has its own internal motion — add outer scroll reveal */}
          <motion.div {...scrollReveal}>
            <NewsletterSection />
          </motion.div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* SECONDARY SECTIONS — brand storytelling, come after primary flow */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

          {/* Horizontal slide-in feature badges */}
          <FeaturesSection />

          {/* Brand story — scroll-driven split-screen timeline */}
          <BrandStoryScroll />

          {/* Why choose us — parallax card grid */}
          <WhyChooseUsSection />

          {/* Farm-to-table process — staggered parallax steps */}
          <OurProcess />

          {/* Animated counters */}
          <TrustStatsSection />

          {/* FAQ — alternating slide-in accordion */}
          <FAQSection />

          {/* Final premium CTA */}
          <PremiumCTA />
        </main>

        <Footer />
        <CartDrawer />
      </div>
    </SmoothScroll>
  );
};

export default Index;
