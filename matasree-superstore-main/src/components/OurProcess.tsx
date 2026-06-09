import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Sprout, Microscope, Wind, Package, Truck } from 'lucide-react';

const steps = [
  { number: '01', title: 'Farm Sourcing', description: "Hand-picked from India's finest spice gardens", icon: Sprout, accent: '#D63220' },
  { number: '02', title: 'Quality Testing', description: 'Lab tested for purity & potency', icon: Microscope, accent: '#E65C19' },
  { number: '03', title: 'Traditional Grinding', description: 'Stone-ground in small batches', icon: Wind, accent: '#8B4513' },
  { number: '04', title: 'Vacuum Packaging', description: 'Sealed fresh to lock in aroma', icon: Package, accent: '#D63220' },
  { number: '05', title: 'Safe Delivery', description: 'Packed with care to your doorstep', icon: Truck, accent: '#E65C19' },
];

const ProcessStep = ({ step, index, scrollProgress }: { step: typeof steps[0]; index: number; scrollProgress: ReturnType<typeof useScroll>['scrollYProgress'] }) => {
  const Icon = step.icon;
  
  // Each step has a unique vertical parallax offset based on its position
  const smoothProgress = useSpring(scrollProgress, { damping: 30, stiffness: 80 });
  const yOffsets = ['8%', '-12%', '10%', '-8%', '6%'];
  const yEnd = ['-8%', '12%', '-10%', '8%', '-6%'];
  const parallaxY = useTransform(smoothProgress, [0, 1], [yOffsets[index], yEnd[index]]);
  const rotateOffset = useTransform(smoothProgress, [0, 1], [index % 2 === 0 ? 2 : -2, index % 2 === 0 ? -2 : 2]);

  return (
    <motion.div
      style={{ y: parallaxY, rotate: rotateOffset }}
      className="group relative text-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 60 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.9, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Step Number + Icon */}
        <div className="relative mx-auto mb-8">
          <div
            className="w-[5.5rem] h-[5.5rem] rounded-[1.5rem] flex items-center justify-center mx-auto bg-white border-2 border-[#3E2314]/5 group-hover:border-[#3E2314]/15 shadow-[0_8px_30px_rgba(62,35,20,0.06)] group-hover:shadow-[0_20px_50px_rgba(62,35,20,0.12)] transition-all duration-700 group-hover:scale-110 group-hover:-rotate-6 relative overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `radial-gradient(circle, ${step.accent}10, transparent)` }}
            />
            <Icon className="w-9 h-9 relative z-10 transition-colors duration-300" style={{ color: step.accent }} />
          </div>
          <div
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg z-10"
            style={{ backgroundColor: step.accent }}
          >
            {step.number}
          </div>
        </div>

        <h3 className="font-serif text-xl font-black text-[#3E2314] mb-3 group-hover:text-[#D63220] transition-colors">
          {step.title}
        </h3>
        <p className="text-[#3E2314]/50 text-sm leading-relaxed font-medium max-w-[200px] mx-auto">
          {step.description}
        </p>
      </motion.div>
    </motion.div>
  );
};

const OurProcess = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const titleY = useTransform(scrollYProgress, [0, 0.4], ['30%', '0%']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.25], [0, 1]);
  
  // Connecting line grows with scroll
  const lineScaleX = useTransform(scrollYProgress, [0.15, 0.55], [0, 1]);

  return (
    <section ref={sectionRef} className="relative py-32 lg:py-48 bg-[#FDFBF9] overflow-hidden">
      <div className="absolute top-[-10%] right-0 w-[500px] h-[500px] bg-[#E65C19]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-0 w-[500px] h-[500px] bg-[#D63220]/3 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Header */}
        <motion.div
          style={{ y: titleY, opacity: titleOpacity }}
          className="text-center mb-24 lg:mb-32"
        >
          <span className="text-[#E65C19] font-black tracking-[0.3em] uppercase text-sm mb-6 block">
            Farm to Table
          </span>
          <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl font-black text-[#3E2314] mb-8 tracking-tight leading-[1.1]">
            Our Premium{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#8B4513] italic">
              Process
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-[#3E2314]/60 max-w-3xl mx-auto font-medium leading-relaxed">
            Every step is crafted to ensure you get the finest quality masalas with authentic taste.
          </p>
        </motion.div>

        {/* Process Steps */}
        <div className="relative">
          {/* Scroll-animated connecting line (desktop) */}
          <motion.div
            className="hidden lg:block absolute top-[4.5rem] left-[10%] right-[10%] h-[2px] origin-left"
            style={{
              scaleX: lineScaleX,
              background: 'linear-gradient(90deg, #D63220, #E65C19, #8B4513)',
            }}
          />

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-6 relative">
            {steps.map((step, index) => (
              <ProcessStep key={index} step={step} index={index} scrollProgress={scrollYProgress} />
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-center mt-20 pt-10 border-t border-[#3E2314]/5"
        >
          <p className="text-[#3E2314]/40 max-w-2xl mx-auto text-base leading-relaxed font-medium">
            From farm to table, every masala goes through rigorous quality checks to ensure you get nothing but the best authentic flavors.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default OurProcess;
