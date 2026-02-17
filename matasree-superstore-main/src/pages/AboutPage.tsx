import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import TeamSection from '@/components/TeamSection';
import { Award, Leaf, Users, TrendingUp, Heart, Shield, Star } from 'lucide-react';
import heroImage from '@/assets/hero-spices.jpg';
import logo from '@/assets/matasree-logo.png';
import posterImage from '@/assets/matasree-poster.jpg';

const stats = [
  { icon: Award, value: '20+', label: 'Years of Excellence' },
  { icon: Users, value: '50K+', label: 'Happy Customers' },
  { icon: Leaf, value: '15+', label: 'Premium Products' },
  { icon: TrendingUp, value: '100+', label: 'Partner Stores' },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        {/* Hero */}
        <section className="relative py-28 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-hero" />
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-background/10 backdrop-blur-md border border-background/20 px-4 py-2 rounded-full mb-6">
                <Star className="w-4 h-4 text-primary" />
                <span className="text-background text-sm font-medium">Our Story</span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-background mt-2 mb-6">
                A Legacy of <span className="text-primary">Authentic</span> Flavors
              </h1>
              <p className="text-lg text-background/80 leading-relaxed max-w-2xl mx-auto">
                For 20+ years, Matasree Super has been bringing the finest, most authentic spices 
                from across India to discerning kitchens and businesses worldwide.
              </p>
            </div>
          </div>
        </section>

        {/* Story with Logo */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <span className="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-4 bg-primary/10 px-3 py-1 rounded-full">Since 2008</span>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-8">
                  From Humble Beginnings to National Pride
                </h2>
                <div className="space-y-5 text-muted-foreground leading-relaxed">
                  <p>
                    In 2008, our founder Shri Sanjay Bansal started Matasree Super Industries with a vision 
                    to provide families with premium, pure spices that enhance the taste of every dish. 
                    What began as a small operation in Clement Town, Dehradun, has grown into a trusted 
                    name across India.
                  </p>
                  <p>
                    Over the past 20 years, Matasree Super products have reached millions of households, 
                    restaurants, and food businesses across the country. We've built our reputation on 
                    quality, authenticity, and customer trust.
                  </p>
                  <p>
                    Our commitment remains unchanged – sourcing the finest raw materials, using traditional 
                    grinding techniques, and maintaining the highest quality standards in every packet we produce. 
                    Every product is lab-tested for purity and safety, ensuring only the best reaches your kitchen. 
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-spice rounded-3xl opacity-20 blur-2xl" />
                <div className="relative bg-card rounded-3xl p-8 shadow-elevated">
                  <img
                    src={logo}
                    alt="Matasree Super"
                    className="w-full max-w-sm mx-auto drop-shadow-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Poster Section */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-secondary/10 via-primary/5 to-accent/10">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-spice rounded-3xl opacity-30 blur-3xl" />
                <div className="relative bg-card rounded-3xl p-8 shadow-elevated hover:shadow-elevated transition-all duration-300">
                  <img
                    src={posterImage}
                    alt="Matasree Super - The King of Spices"
                    className="w-full drop-shadow-xl rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-28 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 relative overflow-hidden">
          <div className="absolute inset-0 spice-pattern opacity-30" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h3 className="font-serif text-3xl md:text-4xl font-bold text-foreground">Our Impact</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, index) => (
                <div 
                  key={stat.label}
                  className="text-center group animate-slide-up bg-background/40 backdrop-blur-sm border border-primary/10 rounded-3xl p-8 hover:bg-background/60 hover:border-primary/30 transition-all duration-300 shadow-soft hover:shadow-elevated"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300 shadow-soft">
                    <stat.icon className="w-10 h-10 text-primary" />
                  </div>
                  <p className="font-serif text-5xl md:text-6xl font-bold text-gradient-spice mb-3">{stat.value}</p>
                  <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-24 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 spice-pattern opacity-20" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-20">
              <span className="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-3 bg-primary/10 px-4 py-2 rounded-full">Our Foundation</span>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mt-4">
                What We <span className="text-gradient-spice">Stand For</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: Leaf,
                  title: 'Purity',
                  description: 'No additives, no preservatives, no artificial colors. Just pure, natural spices as nature intended.',
                },
                {
                  icon: Shield,
                  title: 'Quality',
                  description: 'Every batch is lab-tested for quality, safety, and authenticity before reaching your kitchen.',
                },
                {
                  icon: Heart,
                  title: 'Tradition',
                  description: 'We honor age-old grinding techniques that preserve the essential oils and flavors of our spices.',
                },
              ].map((value, index) => (
                <div 
                  key={value.title}
                  className="group relative bg-gradient-to-br from-card to-card/50 rounded-3xl p-10 shadow-card hover:shadow-elevated text-center animate-slide-up transition-all duration-500 border border-primary/20 hover:border-primary/40 overflow-hidden"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6 group-hover:from-primary/30 group-hover:to-accent/30 group-hover:scale-110 transition-all duration-300 shadow-soft">
                      <value.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <TeamSection />

        {/* Company Info Section */}
        <section className="py-24 md:py-32 bg-gradient-to-br from-secondary/20 via-primary/10 to-accent/20 relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-20">
                <span className="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-3 bg-primary/10 px-4 py-2 rounded-full">Matasree Super</span>
                <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Matasree Super Industries
                </h2>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <p className="text-primary font-semibold text-lg">Private Limited</p>
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground font-medium">Est. 2008</p>
                </div>
              </div>

              <div className="grid md:grid-cols-1 lg:grid-cols-1  gap-8 mt-16">
                {/* Contact Information */}
                <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
                  <div className="bg-gradient-to-br from-background to-background/80 rounded-3xl p-10 shadow-card hover:shadow-elevated transition-all duration-300 border border-primary/20 hover:border-primary/40 backdrop-blur-sm h-full">
                    <h3 className="font-serif text-2xl font-bold text-foreground mb-8">📍 Contact Information</h3>
                    
                    <div className="space-y-6">
                      <div className="group">
                        <p className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          Address
                        </p>
                        <p className="text-muted-foreground text-sm leading-relaxed ml-4">
                          Clement Town, Dehradun<br />
                          Uttarakhand, India
                        </p>
                      </div>

                      <div className="group">
                        <p className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          Phone Numbers
                        </p>
                        <div className="space-y-2 ml-4">
                          <a href="tel:7505675163" className="text-muted-foreground text-sm hover:text-primary transition-colors block font-medium">
                            📱 +91 7505675163
                          </a>
                          <a href="tel:6937475400" className="text-muted-foreground text-sm hover:text-primary transition-colors block font-medium">
                            📱 +91 6937475400
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Our Journey */}
                <div className="lg:col-span-1 space-y-6 order-1 lg:order-2">
                  <div className="bg-gradient-to-br from-background to-background/80 rounded-3xl p-10 shadow-card hover:shadow-elevated transition-all duration-300 border border-primary/20 hover:border-primary/40 backdrop-blur-sm h-full">
                    <h3 className="font-serif text-2xl font-bold text-foreground mb-8">✨ Our Journey</h3>
                    
                    <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
                      <p className="border-l-4 border-primary/40 pl-4 hover:border-primary/80 transition-colors">
                        Founded in 2008, Matasree Super Industries has become a trusted name in the spice industry across India.
                      </p>
                      <p className="border-l-4 border-primary/40 pl-4 hover:border-primary/80 transition-colors">
                        Our commitment to quality, purity, and traditional processing methods has helped us serve millions of households and businesses.
                      </p>
                      <p className="border-l-4 border-primary/40 pl-4 hover:border-primary/80 transition-colors">
                        Located in Clement Town, Dehradun, we maintain the highest standards of quality control.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Hours & Highlights */}
                <div className="lg:col-span-1 space-y-6 order-3">
                  <div className="bg-gradient-to-br from-background to-background/80 rounded-3xl p-10 shadow-card hover:shadow-elevated transition-all duration-300 border border-primary/20 hover:border-primary/40 backdrop-blur-sm h-full">
                    <h3 className="font-serif text-2xl font-bold text-foreground mb-8">🕐 Business Hours</h3>
                    
                    <div className="space-y-6">
                      <div className="group">
                        <div className="space-y-2 ml-0">
                          <div className="flex items-start gap-3 pb-3 border-b border-primary/20">
                            <span className="text-lg">📅</span>
                            <div>
                              <p className="font-medium text-foreground text-sm">Monday - Friday</p>
                              <p className="text-muted-foreground text-sm">9:00 AM - 6:00 PM</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 pb-3 border-b border-primary/20">
                            <span className="text-lg">📅</span>
                            <div>
                              <p className="font-medium text-foreground text-sm">Saturday</p>
                              <p className="text-muted-foreground text-sm">10:00 AM - 4:00 PM</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="text-lg">🚫</span>
                            <div>
                              <p className="font-medium text-foreground text-sm">Sunday</p>
                              <p className="text-muted-foreground text-sm">Closed</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-primary/20">
                        <p className="font-medium text-foreground text-sm mb-3">Why Choose Us</p>
                        <div className="space-y-2">
                          <span className="flex items-center gap-2 text-muted-foreground text-sm hover:text-primary transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            Premium Quality Spices
                          </span>
                          <span className="flex items-center gap-2 text-muted-foreground text-sm hover:text-primary transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            Traditional Processing
                          </span>
                          <span className="flex items-center gap-2 text-muted-foreground text-sm hover:text-primary transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            100% Satisfaction Guaranteed
                          </span>
                        </div>
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
      <CartDrawer />
    </div>
  );
};

export default AboutPage;