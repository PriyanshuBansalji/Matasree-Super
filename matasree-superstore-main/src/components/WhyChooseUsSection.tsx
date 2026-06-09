import { useRef, useState, useCallback } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Award, Leaf, ShieldCheck, Heart, Sparkles, BadgeCheck } from 'lucide-react';
import logo from '@/assets/matasree-logo.png';

const reasons = [
  { icon: Leaf, title: '100% Pure & Natural', description: 'No additives, no preservatives, no artificial colors. Just pure spices from trusted Indian farms.', accent: '#D63220' },
  { icon: ShieldCheck, title: 'Lab Tested Quality', description: 'Every batch is rigorously tested in certified labs for purity, safety, and authenticity.', accent: '#E65C19' },
  { icon: Award, title: '20+ Years Legacy', description: 'A family heritage of excellence trusted by thousands of households across India.', accent: '#8B4513' },
  { icon: Heart, title: 'Traditional Methods', description: 'Stone grinding at low temperatures preserves volatile essential oils and authentic flavors.', accent: '#D63220' },
  { icon: Sparkles, title: 'Fresh Grinding', description: 'Spices are ground fresh in small batches to ensure maximum aroma and potency.', accent: '#E65C19' },
  { icon: BadgeCheck, title: 'FSSAI Certified', description: 'All products meet the highest food safety standards for your peace of mind.', accent: '#8B4513' },
];

/* ───── 3D Interactive Logo ───── */
const Logo3D = () => {
  const logoRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  // Smooth spring-based rotation for luxurious feel
  const smoothRotateX = useSpring(rotateX, { damping: 20, stiffness: 150 });
  const smoothRotateY = useSpring(rotateY, { damping: 20, stiffness: 150 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!logoRef.current) return;
    const rect = logoRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // Mouse offset from center, normalized to -1..1
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    rotateX.set(-y * 25); // tilt up/down
    rotateY.set(x * 25);  // tilt left/right
  }, [rotateX, rotateY]);

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  return (
    <div
      ref={logoRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex items-center justify-center cursor-grab active:cursor-grabbing"
      style={{ perspective: '1000px' }}
    >
      {/* Pulsating outer rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="absolute w-[320px] h-[320px] md:w-[380px] md:h-[380px] border-2 border-dashed border-[#D63220]/15 rounded-full"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        className="absolute w-[380px] h-[380px] md:w-[450px] md:h-[450px] border border-[#E65C19]/10 rounded-full"
      />
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-[420px] h-[420px] md:w-[500px] md:h-[500px] border border-[#8B4513]/5 rounded-full"
      />

      {/* Ambient glow behind logo */}
      <div className="absolute w-[250px] h-[250px] bg-[#D63220]/10 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute w-[180px] h-[180px] bg-[#E65C19]/15 rounded-full blur-[40px] pointer-events-none" />

      {/* 3D Tilting Logo Container */}
      <motion.div
        style={{
          rotateX: smoothRotateX,
          rotateY: smoothRotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative z-10"
      >
        {/* Shadow/reflection layer — behind the logo */}
        <motion.div
          style={{
            rotateX: smoothRotateX,
            rotateY: smoothRotateY,
            translateZ: '-40px',
          }}
          className="absolute inset-0 flex items-center justify-center opacity-20 blur-md pointer-events-none"
        >
          <img src={logo} alt="" className="w-48 h-48 md:w-56 md:h-56 object-contain" />
        </motion.div>

        {/* Main logo */}
        <motion.div
          style={{ translateZ: '40px' }}
          className="relative"
        >
          {/* Glossy highlight overlay */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none z-20" />
          
          <motion.img
            src={logo}
            alt="Matasree Super"
            className="w-48 h-48 md:w-56 md:h-56 object-contain drop-shadow-[0_30px_60px_rgba(214,50,32,0.25)] relative z-10"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Floating sparkle particles around logo */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 4 + Math.random() * 4,
              height: 4 + Math.random() * 4,
              top: `${15 + Math.random() * 70}%`,
              left: `${10 + Math.random() * 80}%`,
              backgroundColor: ['#D63220', '#E65C19', '#F4D03F', '#8B4513'][i % 4],
              translateZ: `${20 + i * 10}px`,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0.5, 1.2, 0.5],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

/* ───── Reason Card with Parallax ───── */
const ReasonCard = ({ reason, index, scrollProgress }: { reason: typeof reasons[0]; index: number; scrollProgress: ReturnType<typeof useScroll>['scrollYProgress'] }) => {
  const Icon = reason.icon;
  const colIndex = index % 3;
  const smoothProgress = useSpring(scrollProgress, { damping: 30, stiffness: 80 });
  const yRanges: [string, string][] = [['6%', '-6%'], ['12%', '-12%'], ['8%', '-8%']];
  const parallaxY = useTransform(smoothProgress, [0, 1], yRanges[colIndex]);

  return (
    <motion.div style={{ y: parallaxY }} className="group relative h-full">
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.92 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.9, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="relative h-full"
      >
        {/* Hover glow */}
        <div
          className="absolute -inset-1 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none"
          style={{ background: `radial-gradient(circle, ${reason.accent}20, transparent)` }}
        />

        <div className="relative p-10 bg-white border border-[#3E2314]/5 rounded-[2rem] hover:border-[#3E2314]/15 transition-all duration-700 shadow-[0_8px_30px_rgba(62,35,20,0.04)] hover:shadow-[0_25px_60px_rgba(62,35,20,0.1)] h-full">
          {/* Top accent line */}
          <div
            className="absolute top-0 left-8 right-8 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: `linear-gradient(90deg, transparent, ${reason.accent}, transparent)` }}
          />

          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6"
            style={{ backgroundColor: `${reason.accent}10` }}
          >
            <Icon className="w-8 h-8 transition-colors duration-300" style={{ color: reason.accent }} />
          </div>

          <h3 className="font-serif text-2xl font-black text-[#3E2314] mb-4 group-hover:text-[#D63220] transition-colors leading-tight">
            {reason.title}
          </h3>
          <p className="text-[#3E2314]/60 text-base leading-relaxed font-medium">
            {reason.description}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ───── Main Section ───── */
const WhyChooseUsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const titleY = useTransform(scrollYProgress, [0, 0.4], ['30%', '0%']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.25], [0, 1]);

  return (
    <section ref={sectionRef} className="py-32 lg:py-48 bg-[#FDFBF9] relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#E65C19]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#D63220]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Two-column hero: Text + 3D Logo */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center mb-28 lg:mb-40">
          {/* Left: Title */}
          <motion.div
            style={{ y: titleY, opacity: titleOpacity }}
          >
            <span className="text-[#D63220] font-black tracking-[0.3em] uppercase text-sm mb-6 block">
              Why Choose Us
            </span>
            <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl font-black text-[#3E2314] mb-8 tracking-tight leading-[1.05]">
              The Matasree{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#8B4513] italic">
                Difference.
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-[#3E2314]/60 max-w-xl font-medium leading-relaxed">
              For over two decades, we've been committed to bringing you the purest, most flavorful spices — crafted with care, rooted in tradition.
            </p>
          </motion.div>

          {/* Right: 3D Interactive Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center py-12 lg:py-0"
          >
            <Logo3D />
          </motion.div>
        </div>

        {/* Reasons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {reasons.map((reason, index) => (
            <ReasonCard key={reason.title} reason={reason} index={index} scrollProgress={scrollYProgress} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;