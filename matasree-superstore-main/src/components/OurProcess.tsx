import { Sprout, Microscope, Wind, Package, Truck, ArrowRight } from 'lucide-react';

const OurProcess = () => {
  const steps = [
    {
      number: '1',
      title: 'Farm Sourcing',
      description: 'Hand-picked from India\'s finest spice gardens',
      icon: Sprout,
    },
    {
      number: '2',
      title: 'Quality Testing',
      description: 'Lab tested for purity & potency',
      icon: Microscope,
    },
    {
      number: '3',
      title: 'Traditional Grinding',
      description: 'Stone-ground in small batches',
      icon: Wind,
    },
    {
      number: '4',
      title: 'Vacuum Packaging',
      description: 'Sealed fresh to lock in aroma',
      icon: Package,
    },
    {
      number: '5',
      title: 'Safe Delivery',
      description: 'Packed with care to your doorstep',
      icon: Truck,
    },
  ];

  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-b from-white via-orange-50/20 to-white overflow-hidden">
      {/* Premium decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-300/20 rounded-full blur-3xl opacity-40" />

      <div className="container mx-auto px-4 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-b from-amber-950 to-orange-900 bg-clip-text text-transparent mb-6">
            Our Premium Process
          </h2>
          <p className="text-amber-900/70 max-w-2xl mx-auto text-lg leading-relaxed">
            Every step is crafted to ensure you get the finest quality masalas with authentic taste
          </p>
        </div>

        {/* Process Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 via-orange-400 via-red-400 to-orange-400 -translate-y-1/2" />

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="relative group"
                >
                  {/* Arrow connector for mobile/tablet */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:flex lg:hidden absolute top-32 right-0 translate-x-1/2 z-20">
                      <ArrowRight className="w-6 h-6 text-orange-400 transform rotate-90" />
                    </div>
                  )}

                  {/* Glow effect on hover */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur" />

                  {/* Step card */}
                  <div className="relative p-6 bg-white/95 backdrop-blur rounded-2xl border-2 border-amber-200/50 hover:border-orange-300 hover:shadow-2xl transition-all duration-300 text-center h-full group-hover:scale-105">
                    
                    {/* Step Number Circle */}
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold text-lg rounded-full mb-5 group-hover:scale-125 transition-transform shadow-lg">
                      {step.number}
                    </div>

                    {/* Icon */}
                    <div className="mb-4">
                      <div className="inline-block p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl group-hover:from-amber-200 group-hover:to-orange-200 transition-all">
                        <Icon className="w-7 h-7 text-amber-700 group-hover:text-amber-900 transition-colors group-hover:scale-110" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="font-serif text-xl font-bold text-amber-950 mb-2 group-hover:text-orange-950 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-amber-900/70 text-sm leading-relaxed group-hover:text-amber-900 transition-colors">
                      {step.description}
                    </p>

                    {/* Top accent */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full group-hover:w-12 transition-all opacity-0 group-hover:opacity-100" />
                    
                    {/* Bottom highlight */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-2xl" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA Text */}
        <div className="text-center mt-16 pt-8 border-t border-amber-200/30">
          <p className="text-amber-900/70 max-w-2xl mx-auto text-base leading-relaxed">
            From farm to table, every masala goes through rigorous quality checks to ensure you get nothing but the best authentic flavors.
          </p>
        </div>
      </div>
    </section>
  );
};

export default OurProcess;
