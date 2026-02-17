import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import TrustStrip from '@/components/TrustStrip';
import BestSellers from '@/components/BestSellers';
import WhyChooseMatasree from '@/components/WhyChooseMatasree';
import OurProcess from '@/components/OurProcess';
import CategoriesSection from '@/components/CategoriesSection';
import WhyChooseUsSection from '@/components/WhyChooseUsSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import FAQSection from '@/components/FAQSection';
import NewsletterSection from '@/components/NewsletterSection';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* 1. Hero Section - Above the fold */}
        <HeroSection />
        
        {/* 2. Trust Strip - Instant credibility */}
        <TrustStrip />
        
        {/* 3. Best Sellers - Fastest sales driver */}
        <BestSellers />
        
        {/* 4. Why Choose Matasree - Differentiation */}
        <WhyChooseMatasree />
        
        {/* 5. Our Process - Premium & Authenticity */}
        <OurProcess />
        
        {/* 6. Product Categories - Controlled exploration */}
        <CategoriesSection />
        
        {/* 7. Heritage Story - Emotional connection */}
        <WhyChooseUsSection />
        
        {/* 8. Testimonials - Social proof */}
        <TestimonialsSection />
        
        {/* 9. FAQ - Objection handling */}
        <FAQSection />
        
        {/* 10. Newsletter - Lead capture */}
        <NewsletterSection />
      </main>
      
      {/* 11. Footer - Legitimacy check */}
      <Footer />
      
      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
};

export default Index;