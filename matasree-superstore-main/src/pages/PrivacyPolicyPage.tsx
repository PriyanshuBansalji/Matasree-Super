import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { Shield, Mail, Lock, Eye, CheckCircle2, ArrowRight } from 'lucide-react';
import PageHelmet from '@/components/PageHelmet';

const PrivacyPolicyPage = () => {
  const sections = [
    {
      icon: Eye,
      title: '1. Information We Collect',
      content: 'Personal details: Name, phone number, email address, delivery address. Payment information (processed securely via trusted payment gateways). Order history and preferences. Technical data: IP address, browser type, device information, cookies.'
    },
    {
      icon: Lock,
      title: '2. How We Use Your Information',
      content: 'Your information is used to: Process and deliver orders. Communicate order updates and customer support. Improve our products, services, and website experience. Send promotional offers (only if you opt-in).'
    },
    {
      icon: Shield,
      title: '3. Data Security',
      content: 'We implement appropriate security measures to protect your data against unauthorized access, alteration, or disclosure.'
    },
    {
      icon: Mail,
      title: '4. Sharing of Information',
      content: 'We do not sell or trade your personal data. Information may be shared only with: Delivery partners for order fulfillment. Payment gateways for secure transactions. Legal authorities when required by law.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHelmet
        title="Privacy Policy | Matasree Super Masale"
        description="Read the Privacy Policy for Matasree Super Masale — how we collect, use, and protect your personal information."
        canonicalUrl="https://matasreesuper.com/privacy-policy"
        ogType="website"
      />
      <Navbar />
      <CartDrawer />
      
      <main>
        {/* Hero Section with Enhanced Design */}
        <section className="relative py-24 md:py-36 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-y-1/2" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-3 bg-primary/10 backdrop-blur-sm border border-primary/20 px-6 py-3 rounded-full mb-8">
                <Shield className="w-5 h-5 text-primary animate-pulse" />
                <span className="text-foreground text-sm font-semibold tracking-wide">Your Privacy Matters</span>
              </div>
              <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Your Data is <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Safe with Us</span>
              </h1>
              <p className="text-xl text-foreground/70 leading-relaxed max-w-2xl mx-auto">
                We're committed to protecting your personal information with industry-leading security practices
              </p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-20 md:py-32 relative z-10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {/* Introduction Card */}
              <div className="mb-16 p-8 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 rounded-2xl backdrop-blur-sm">
                <div className="flex gap-4">
                  <Shield className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-foreground/80 leading-relaxed text-lg">
                      <strong>Matasree Super Industries Private Limited</strong><br className="mb-3" />
                      At Matasree Super Masala, we value your trust and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you visit or make a purchase from www.matasreesuper.com
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

              {/* Additional Policies */}
              <div className="mt-20">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                    Additional Information
                  </h2>
                  <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full mx-auto" />
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="p-8 bg-gradient-to-br from-background to-background/80 border border-foreground/5 rounded-2xl hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                      <h4 className="font-semibold text-foreground text-lg">5. Cookies</h4>
                    </div>
                    <p className="text-foreground/70 leading-relaxed">
                      Our website uses cookies to enhance browsing experience and analyze traffic. You may disable cookies in your browser settings.
                    </p>
                  </div>

                  <div className="p-8 bg-gradient-to-br from-background to-background/80 border border-foreground/5 rounded-2xl hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                      <h4 className="font-semibold text-foreground text-lg">6. Your Rights</h4>
                    </div>
                    <p className="text-foreground/70 leading-relaxed">
                      You have the right to: Access or update your personal information. Request deletion of your data (subject to legal obligations).
                    </p>
                  </div>

                  <div className="p-8 bg-gradient-to-br from-background to-background/80 border border-foreground/5 rounded-2xl hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                      <h4 className="font-semibold text-foreground text-lg">7. Policy Updates</h4>
                    </div>
                    <p className="text-foreground/70 leading-relaxed">
                      We may update this policy periodically. Any changes will be posted on this page.
                    </p>
                  </div>

                  <div className="p-8 bg-gradient-to-br from-background to-background/80 border border-foreground/5 rounded-2xl hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <Mail className="w-6 h-6 text-primary" />
                      <h4 className="font-semibold text-foreground text-lg">Contact Us</h4>
                    </div>
                    <p className="text-foreground/70 leading-relaxed mb-4">
                      For privacy-related concerns:
                    </p>
                    <a href="mailto:Matasreesuper@gmail.com" className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all font-semibold">
                      Matasreesuper@gmail.com
                      <ArrowRight className="w-4 h-4" />
                    </a>
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

export default PrivacyPolicyPage;
