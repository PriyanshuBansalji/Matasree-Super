import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { RotateCcw, Clock, DollarSign, HelpCircle, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import PageHelmet from '@/components/PageHelmet';

const RefundPolicyPage = () => {
  const sections = [
    {
      icon: Clock,
      title: '1. Eligibility for Refund',
      content: 'Refunds or replacements are applicable only if: The product is damaged or leaked upon delivery. Wrong product is delivered. Product is expired at the time of delivery. 📌 Unboxing video is mandatory for any refund or replacement request.'
    },
    {
      icon: RotateCcw,
      title: '2. Non-Refundable Items',
      content: 'Opened or used products. Orders placed incorrectly by the customer. Taste preferences (as spices are food items).'
    },
    {
      icon: DollarSign,
      title: '3. Refund Process',
      content: 'Report the issue within 48 hours of delivery. Email us with order ID, images/videos at labourzkart@gmail.com. After verification, refund will be processed within 5–7 working days.'
    },
    {
      icon: HelpCircle,
      title: '4. Mode of Refund',
      content: 'Refunds will be credited to: Original payment method. Or wallet/store credit (if applicable).'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHelmet
        title="Refund Policy | Matasree Super Masale"
        description="Read the Refund Policy for Matasree Super Masale — eligibility, process, and timelines for returns and refunds."
        canonicalUrl="https://matasreesuper.com/refund-policy"
        ogType="website"
      />
      <Navbar />
      <CartDrawer />
      
      <main id="main-content" aria-label="Refund policy">
        {/* Hero Section with Enhanced Design */}
        <section className="relative py-24 md:py-36 overflow-hidden" aria-labelledby="refund-hero-heading">
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-y-1/2" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-3 bg-primary/10 backdrop-blur-sm border border-primary/20 px-6 py-3 rounded-full mb-8">
                <RotateCcw className="w-5 h-5 text-primary animate-pulse" />
                <span className="text-foreground text-sm font-semibold tracking-wide">Customer Friendly</span>
              </div>
              <h1 id="refund-hero-heading" className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Refund <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Policy</span>
              </h1>
              <p className="text-xl text-foreground/70 leading-relaxed max-w-2xl mx-auto">
                Your satisfaction is our priority. We make returns easy and hassle-free
              </p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-20 md:py-32 relative z-10" aria-labelledby="refund-content-heading">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {/* Introduction Card */}
              <div className="mb-16 p-8 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 rounded-2xl backdrop-blur-sm">
                <div className="flex gap-4">
                  <RotateCcw className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-foreground/80 leading-relaxed text-lg">
                      <strong>Matasree Super Masala</strong><br className="mb-3" />
                      Customer satisfaction is important to us. Please read our refund policy carefully.
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Sections Grid */}
              <div className="grid md:grid-cols-2 gap-8 mb-16">
                {sections.map((section, index) => {
                  const Icon = section.icon;
                  return (
                    <div 
                      key={index} 
                      className="group p-8 bg-gradient-to-br from-background to-background/80 border border-foreground/5 rounded-2xl hover:border-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
                    >
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
                          <Icon className="w-7 h-7 text-primary" />
                        </div>
                        <h3 className="text-2xl font-serif font-semibold text-foreground mt-1">
                          {section.title}
                        </h3>
                      </div>
                      <p className="text-foreground/70 leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Additional Policy Details */}
              <div className="mt-20">
                <div className="text-center mb-16">
                  <h2 id="refund-content-heading" className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                    More Information
                  </h2>
                  <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full mx-auto" />
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="p-8 bg-gradient-to-br from-background to-background/80 border border-foreground/5 rounded-2xl hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                      <h4 className="font-semibold text-foreground text-lg">5. Cancellation Policy</h4>
                    </div>
                    <p className="text-foreground/70 leading-relaxed">
                      Orders can be canceled only before dispatch. Once shipped, cancellation is not allowed.
                    </p>
                  </div>

                  <div className="p-8 bg-gradient-to-br from-background to-background/80 border border-foreground/5 rounded-2xl hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <DollarSign className="w-6 h-6 text-primary" />
                      <h4 className="font-semibold text-foreground text-lg">Contact Support</h4>
                    </div>
                    <p className="text-foreground/70 leading-relaxed mb-4">
                      For refund and return assistance:
                    </p>
                    <a href="mailto:labourzkart@gmail.com" className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all font-semibold">
                      matasreesuper@gmail.com
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="md:col-span-2 p-8 bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="w-7 h-7 text-accent flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-foreground text-lg mb-3">📌 Important Note</h4>
                        <p className="text-foreground/70 leading-relaxed">
                          Unboxing video is mandatory for any refund or replacement request. Please ensure you record the unboxing process when your order arrives to validate your claim.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default RefundPolicyPage;
