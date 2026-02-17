import { Award, Leaf, ShieldCheck, Heart, Sparkles, BadgeCheck } from 'lucide-react';
import logo from '@/assets/matasree-logo.png';

const reasons = [
  {
    icon: Leaf,
    title: '100% Pure & Natural',
    description: 'No additives, no preservatives, no artificial colors. Just pure spices.',
  },
  {
    icon: ShieldCheck,
    title: 'Lab Tested',
    description: 'Every batch is tested for purity, safety, and authenticity.',
  },
  {
    icon: Award,
    title: '40+ Years Legacy',
    description: 'Trusted by millions of households across India since 1985.',
  },
  {
    icon: Heart,
    title: 'Traditional Methods',
    description: 'Stone grinding preserves essential oils and authentic flavors.',
  },
  {
    icon: Sparkles,
    title: 'Fresh Grinding',
    description: 'Spices are ground fresh to order for maximum aroma.',
  },
  {
    icon: BadgeCheck,
    title: 'FSSAI Certified',
    description: 'All products meet the highest food safety standards.',
  },
];

const WhyChooseUsSection = () => {
  return (
    <section className="py-20 md:py-28 bg-foreground text-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Content */}
          <div>
            <span className="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-4">Why Choose Us</span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-background mb-6">
              The <span className="text-primary">Matasree</span> Difference
            </h2>
            <p className="text-background/70 text-lg mb-10 leading-relaxed">
              For over four decades, we've been committed to bringing you the purest, 
              most flavorful spices. Here's what sets us apart from the rest.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {reasons.map((reason, index) => (
                <div 
                  key={reason.title}
                  className="group flex items-start gap-4 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <reason.icon className="w-6 h-6 text-primary group-hover:text-background transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-background mb-1 group-hover:text-primary transition-colors">
                      {reason.title}
                    </h3>
                    <p className="text-background/60 text-sm leading-relaxed">
                      {reason.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right side - Logo showcase */}
          <div className="relative hidden lg:flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-3xl" />
            <div className="relative">
              {/* Rotating ring */}
              <div className="absolute inset-0 -m-8 border-2 border-dashed border-primary/30 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
              <div className="absolute inset-0 -m-16 border border-primary/20 rounded-full" />
              <div className="absolute inset-0 -m-24 border border-primary/10 rounded-full" />
              
              {/* Logo */}
              <div className="bg-background/10 backdrop-blur-sm rounded-full p-12 shadow-2xl">
                <img 
                  src={logo} 
                  alt="Matasree Super" 
                  className="w-72 h-auto drop-shadow-2xl animate-float"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;