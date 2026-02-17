import { Leaf, Droplets, Wind, Zap, BookOpen, Award } from 'lucide-react';

const WhyChooseMatasree = () => {
  const reasons = [
    {
      icon: Leaf,
      title: '100% Pure & Natural',
      description: 'No additives, no fillers, just pure spices',
    },
    {
      icon: Droplets,
      title: 'No Preservatives',
      description: 'Fresh ground in small batches',
    },
    {
      icon: Wind,
      title: 'Stone Ground',
      description: 'Traditional grinding preserves aroma',
    },
    {
      icon: Zap,
      title: 'Fresh Grinding',
      description: 'Ground to order for maximum potency',
    },
    {
      icon: BookOpen,
      title: 'Traditional Recipes',
      description: 'Centuries-old blending secrets',
    },
    {
      icon: Award,
      title: '20+ Years Trust',
      description: 'Family legacy of excellence',
    },
  ];

  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-b from-amber-50/50 to-white overflow-hidden">
      {/* Premium decorative elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-amber-300/25 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl opacity-40" />

      <div className="container mx-auto px-4 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-b from-amber-950 to-orange-900 bg-clip-text text-transparent mb-6">
            Why Choose Matasree?
          </h2>
          <p className="text-amber-900/70 max-w-2xl mx-auto text-lg leading-relaxed">
            Six reasons why thousands trust us for authentic Indian flavors
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <div
                key={index}
                className="group relative"
              >
                {/* Glow effect on hover */}
                <div className="absolute -inset-1 bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 rounded-2xl opacity-0 group-hover:opacity-25 transition-opacity duration-300 blur" />
                
                {/* Card */}
                <div className="relative p-8 bg-white/90 backdrop-blur rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-amber-100/50 hover:border-amber-300/80 group-hover:scale-105 overflow-hidden h-full">
                  
                  {/* Top accent line with gradient */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

                  {/* Icon container */}
                  <div className="mb-5">
                    <div className="inline-block p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl group-hover:from-amber-200 group-hover:to-orange-200 transition-all duration-300 group-hover:scale-110">
                      <Icon className="w-6 h-6 text-amber-700 group-hover:text-amber-900 transition-colors" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-serif text-xl font-bold text-amber-950 mb-3 group-hover:text-orange-950 transition-colors">
                    {reason.title}
                  </h3>
                  <p className="text-amber-900/70 text-sm leading-relaxed group-hover:text-amber-900/80 transition-colors">
                    {reason.description}
                  </p>

                  {/* Bottom accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseMatasree;
