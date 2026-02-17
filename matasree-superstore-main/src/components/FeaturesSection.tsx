import { Truck, Shield, Leaf, Clock } from 'lucide-react';

const features = [
  {
    icon: Leaf,
    title: '100% Natural',
    description: 'Pure spices with no additives or preservatives',
    color: 'from-green-500/20 to-green-600/20',
  },
  {
    icon: Truck,
    title: 'Free Delivery',
    description: 'Free shipping on orders above ₹499',
    color: 'from-blue-500/20 to-blue-600/20',
  },
  {
    icon: Shield,
    title: 'Quality Assured',
    description: 'Lab tested for purity and safety',
    color: 'from-primary/20 to-accent/20',
  },
  {
    icon: Clock,
    title: 'Fresh Grinding',
    description: 'Ground fresh to preserve aroma and flavor',
    color: 'from-orange-500/20 to-red-500/20',
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-16 border-y border-border/50 bg-gradient-to-r from-card via-background to-card relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 spice-pattern opacity-50" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="group flex flex-col items-center text-center p-6 rounded-2xl hover:bg-card hover:shadow-card transition-all duration-500 animate-fade-in cursor-default"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-soft`}>
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-serif font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;