import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { SmoothScroll } from '@/components/home/SmoothScroll';

// Cinematic scroll-driven sections
import { HeroParallax } from '@/components/home/HeroParallax';
import { ProductScrollGrid } from '@/components/home/ProductScrollGrid';
import { BrandStoryScroll } from '@/components/home/BrandStoryScroll';
import { TrustStatsSection } from '@/components/home/TrustStatsSection';
import { PremiumCTA } from '@/components/home/PremiumCTA';

// Additional sections — all restyled with scroll effects & heritage theme
import FeaturesSection from '@/components/FeaturesSection';
import WhyChooseUsSection from '@/components/WhyChooseUsSection';
import OurProcess from '@/components/OurProcess';
import TestimonialsSection from '@/components/TestimonialsSection';
import FAQSection from '@/components/FAQSection';
import NewsletterSection from '@/components/NewsletterSection';

const Index = () => {
  return (
    <SmoothScroll>
      <div className="bg-brand-cream text-brand-cinnamon font-sans min-h-screen selection:bg-brand-chili selection:text-white">
        <Navbar />
        
        <main className="overflow-x-clip">
          {/* ━━━━ ACT 1: OPENING ━━━━ */}
          {/* Cinematic parallax hero */}
          <HeroParallax />

          {/* Horizontal slide-in feature badges (light) */}
          <FeaturesSection />

          {/* ━━━━ ACT 2: PRODUCTS ━━━━ */}
          {/* Bestselling products — staggered column parallax */}
          <ProductScrollGrid />

          {/* ━━━━ ACT 3: STORY & TRUST ━━━━ */}
          {/* Brand story — scroll-driven split-screen timeline */}
          <BrandStoryScroll />

          {/* Why choose us — parallax card grid (light) */}
          <WhyChooseUsSection />

          {/* Farm to table process — staggered parallax steps + animated line */}
          <OurProcess />

          {/* ━━━━ ACT 4: SOCIAL PROOF ━━━━ */}
          {/* Animated counters + auto-rotating testimonials (light) */}
          <TrustStatsSection />

          {/* Customer reviews with review form — parallax cards (white) */}
          <TestimonialsSection />

          {/* ━━━━ ACT 5: CONVERSION ━━━━ */}
          {/* FAQ — alternating slide-in accordion */}
          <FAQSection />

          {/* Newsletter CTA (dark) */}
          <NewsletterSection />

          {/* Final premium CTA (dark) */}
          <PremiumCTA />
        </main>
        
        <Footer />
        <CartDrawer />
      </div>
    </SmoothScroll>
  );
};

export default Index;