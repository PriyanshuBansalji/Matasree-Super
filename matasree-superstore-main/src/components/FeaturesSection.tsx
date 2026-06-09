import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Truck, Shield, Leaf, Clock } from 'lucide-react';

const features = [
  { icon: Leaf, title: '100% Natural', description: 'Pure spices with no additives or preservatives', accent: '#D63220' },
  { icon: Truck, title: 'Free Delivery', description: 'Free shipping on orders above ₹499', accent: '#E65C19' },
  { icon: Shield, title: 'Quality Assured', description: 'Lab tested for purity and safety', accent: '#8B4513' },
  { icon: Clock, title: 'Fresh Grinding', description: 'Ground fresh to preserve aroma and flavor', accent: '#D63220' },
];

const FeaturesSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Horizontal sliding effect — items slide inward from edges
  const slideLeft = useTransform(scrollYProgress, [0, 0.5], ['10%', '0%']);
  const slideRight = useTransform(scrollYProgress, [0, 0.5], ['-10%', '0%']);
  const fadeIn = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <section ref={sectionRef} className="py-16 md:py-20 bg-white border-y border-[#3E2314]/5 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #3E2314 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            // Alternate sliding direction per item
            const x = index % 2 === 0 ? slideLeft : slideRight;
            return (
              <motion.div
                key={feature.title}
                style={{ x, opacity: fadeIn }}
                className="group flex flex-col items-center text-center p-6 rounded-2xl hover:bg-[#FDFBF9] transition-all duration-500 cursor-default"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-sm"
                  style={{ backgroundColor: `${feature.accent}10` }}
                >
                  <Icon className="w-8 h-8" style={{ color: feature.accent }} />
                </div>
                <h3 className="font-serif font-black text-[#3E2314] text-lg mb-2 group-hover:text-[#D63220] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#3E2314]/50 leading-relaxed font-medium">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;