import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShoppingBag, ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const ctaParticles = Array.from({ length: 20 }).map((_, i) => ({
  id: i,
  size: Math.random() * 8 + 2,
  x: Math.random() * 100,
  y: Math.random() * 100,
  duration: Math.random() * 20 + 10,
  delay: Math.random() * 5,
}));

export const PremiumCTA = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['-30%', '30%']);
  const ringScale = useTransform(scrollYProgress, [0, 1], [0.8, 1.5]);

  return (
    <section
      ref={containerRef}
      className="relative py-48 md:py-64 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1A0E08 0%, #3E2314 40%, #5A2D0E 100%)',
      }}
    >
      {/* Dynamic Expanding Glow Rings */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[2px] border-[#F4D03F]/10 rounded-full"
        style={{ scale: ringScale }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border-[1px] border-[#D63220]/10 rounded-full"
        style={{ scale: ringScale }}
      />

      {/* Deep Rich Parallax Texture Background */}
      <motion.div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=2070")',
          y: backgroundY,
          scale: 1.2,
        }}
      />

      {/* Massive Center Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(214,50,32,0.25),transparent)] blur-[80px] rounded-full" />

      {/* Floating Particles */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {ctaParticles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: `${p.y}%`, x: `${p.x}%`, opacity: 0 }}
            animate={{
              y: [`${p.y}%`, `${p.y - 15}%`, `${p.y}%`],
              opacity: [0, Math.random() * 0.7 + 0.2, 0],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: Math.random() > 0.5 ? '#F4D03F' : '#FDFBF9',
              boxShadow: `0 0 ${p.size * 3}px ${Math.random() > 0.5 ? '#F4D03F' : '#FDFBF9'}`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 max-w-5xl relative z-20 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex flex-col items-center p-12 md:p-20 rounded-[3rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.3)]"
        >
          {/* Logo Mark */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D63220] to-[#E65C19] border-2 border-[#F4D03F]/30 flex items-center justify-center mb-10 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[#F4D03F]/20 animate-pulse" />
            <Star className="w-6 h-6 text-white fill-white relative z-10" />
          </div>

          <h2 className="text-6xl md:text-8xl lg:text-9xl font-black font-serif text-white mb-10 leading-[0.9] tracking-tight">
            Taste the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4D03F] via-[#FDFBF9] to-[#E65C19]">
              Difference.
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-white/60 font-medium mb-16 max-w-3xl mx-auto leading-relaxed">
            Stop settling for commercial dust. Upgrade your kitchen with unadulterated, farm-fresh Indian spices delivered directly to you.
          </p>

          <Link to="/products">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-14 py-6 rounded-full overflow-hidden shadow-[0_20px_40px_rgba(214,50,32,0.3)] hover:shadow-[0_20px_60px_rgba(244,208,63,0.3)] transition-all duration-500"
            >
              <div className="absolute inset-0 bg-[#FDFBF9] group-hover:bg-[#F4D03F] transition-all duration-500" />
              <div className="relative z-10 flex items-center justify-center gap-4 text-[#3E2314] font-black text-xl tracking-wider uppercase">
                <ShoppingBag className="w-6 h-6 group-hover:-rotate-12 transition-transform" />
                Shop The Collection
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </div>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
