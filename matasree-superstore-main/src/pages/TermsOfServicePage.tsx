import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { FileText, CheckCircle, AlertCircle, Gavel, CheckCircle2, ArrowRight } from 'lucide-react';

const TermsOfServicePage = () => {
  const sections = [
    {
      icon: CheckCircle,
      title: '1. Use of Website',
      content: 'The website is intended for personal and lawful use only. Any misuse, copying, or resale of content without permission is prohibited.'
    },
    {
      icon: FileText,
      title: '2. Product Information',
      content: 'We strive to display accurate product descriptions, prices, and images. However, slight variations may occur due to packaging updates or display settings.'
    },
    {
      icon: AlertCircle,
      title: '3. Pricing & Availability',
      content: 'Prices are subject to change without prior notice. Product availability may vary based on stock.'
    },
    {
      icon: Gavel,
      title: '4. Orders & Payments',
      content: 'Orders are confirmed only after successful payment. We reserve the right to cancel orders due to pricing errors, stock unavailability, or suspicious activity.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CartDrawer />
      
      <main>
        {/* Hero Section with Enhanced Design */}
        <section className="relative py-24 md:py-36 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-y-1/2" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-3 bg-primary/10 backdrop-blur-sm border border-primary/20 px-6 py-3 rounded-full mb-8">
                <Gavel className="w-5 h-5 text-primary animate-pulse" />
                <span className="text-foreground text-sm font-semibold tracking-wide">Legal Agreement</span>
              </div>
              <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Terms of <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Service</span>
              </h1>
              <p className="text-xl text-foreground/70 leading-relaxed max-w-2xl mx-auto">
                Please read our terms carefully to understand your rights and responsibilities
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
                  <Gavel className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-foreground/80 leading-relaxed text-lg">
                      <strong>Matasree Super Masala</strong><br className="mb-3" />
                      By accessing or using www.matasreesuper.com, you agree to comply with the following Terms of Service.
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

              {/* Additional Terms */}
              <div className="mt-20">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                    Additional Terms
                  </h2>
                  <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full mx-auto" />
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="p-8 bg-gradient-to-br from-background to-background/80 border border-foreground/5 rounded-2xl hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                      <h4 className="font-semibold text-foreground text-lg">5. Intellectual Property</h4>
                    </div>
                    <p className="text-foreground/70 leading-relaxed">
                      All content including logos, text, images, and designs belong to Matasree Super Industries Private Limited and may not be used without written consent.
                    </p>
                  </div>

                  <div className="p-8 bg-gradient-to-br from-background to-background/80 border border-foreground/5 rounded-2xl hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertCircle className="w-6 h-6 text-primary" />
                      <h4 className="font-semibold text-foreground text-lg">6. Limitation of Liability</h4>
                    </div>
                    <p className="text-foreground/70 leading-relaxed">
                      We are not responsible for delays or damages caused by circumstances beyond our control (natural disasters, logistics issues, etc.).
                    </p>
                  </div>

                  <div className="p-8 bg-gradient-to-br from-background to-background/80 border border-foreground/5 rounded-2xl hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <Gavel className="w-6 h-6 text-primary" />
                      <h4 className="font-semibold text-foreground text-lg">7. Governing Law</h4>
                    </div>
                    <p className="text-foreground/70 leading-relaxed">
                      These terms are governed by the laws of India.
                    </p>
                  </div>

                  <div className="p-8 bg-gradient-to-br from-background to-background/80 border border-foreground/5 rounded-2xl hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="w-6 h-6 text-primary" />
                      <h4 className="font-semibold text-foreground text-lg">Contact</h4>
                    </div>
                    <p className="text-foreground/70 leading-relaxed mb-4">
                      Questions about our terms?
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

export default TermsOfServicePage;
