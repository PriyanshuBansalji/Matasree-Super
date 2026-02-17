import { Wheat, FlaskConical, Package, Truck, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: Wheat,
    step: '01',
    title: 'Sourcing',
    description: 'We source the finest raw spices directly from farms across India - Kashmir, Kerala, Rajasthan, and more.',
  },
  {
    icon: CheckCircle,
    step: '02',
    title: 'Quality Check',
    description: 'Every batch undergoes rigorous quality testing for purity, moisture content, and authenticity.',
  },
  {
    icon: FlaskConical,
    step: '03',
    title: 'Processing',
    description: 'Traditional stone grinding preserves essential oils and natural flavors that modern machines destroy.',
  },
  {
    icon: Package,
    step: '04',
    title: 'Packaging',
    description: 'Vacuum-sealed packaging locks in freshness and aroma, ensuring spices reach you at their best.',
  },
  {
    icon: Truck,
    step: '05',
    title: 'Delivery',
    description: 'Swift delivery to your doorstep with careful handling to maintain product integrity.',
  },
];

const ProcessSection = () => {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-background to-secondary/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 spice-pattern opacity-30" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-primary font-medium text-sm uppercase tracking-wider mb-2">Our Process</span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-2 mb-4">
            From Farm to <span className="text-gradient-spice">Your Kitchen</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Every packet of Matasree spices goes through a meticulous 5-step process 
            to ensure you get nothing but the purest flavors.
          </p>
        </div>

        {/* Process Steps */}
        <div className="relative">
          {/* Connection line - desktop */}
          <div className="hidden lg:block absolute top-20 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {steps.map((step, index) => (
              <div 
                key={step.title}
                className="relative group animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Step number badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-gradient-spice text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    {step.step}
                  </span>
                </div>
                
                {/* Card */}
                <div className="bg-card rounded-3xl p-8 pt-10 shadow-card hover:shadow-elevated transition-all duration-500 text-center border border-transparent hover:border-primary/20 h-full group-hover:-translate-y-2">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-soft">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="font-serif text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;