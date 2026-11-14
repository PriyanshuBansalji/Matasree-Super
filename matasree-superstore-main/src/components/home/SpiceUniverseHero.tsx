/**
 * SpiceUniverseHero
 *
 * On-theme section that fits the Matasree cream/cinnamon palette.
 * Real spice photos float gently on the cream background.
 * Mouse movement creates a subtle parallax effect.
 * Matches the HeroParallax and WhyChooseUsSection aesthetic exactly.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';

interface FloatingSpice {
  id: string;
  name: string;
  img: string;
  size: number;
  x: number;   // % from left
  y: number;   // % from top
  orbitAmp: number;
  orbitSpeed: number;
  orbitPhase: number;
  delay: number;
}

const SPICES: FloatingSpice[] = [
  {
    id: 'cinnamon', name: 'Cinnamon',
    img: '/Whole Spice/—Pngtree—spice cinnamon_5610999.png',
    size: 88, x: 8, y: 20, orbitAmp: 12, orbitSpeed: 0.4, orbitPhase: 0, delay: 0,
  },
  {
    id: 'cloves', name: 'Cloves',
    img: '/Whole Spice/vecteezy_ai-generated-dried-cloves-in-the-wooden-spoon-isolated-on_37924336.png',
    size: 72, x: 82, y: 15, orbitAmp: 10, orbitSpeed: 0.5, orbitPhase: 1.3, delay: 0.2,
  },
  {
    id: 'cardamom', name: 'Cardamom',
    img: '/Whole Spice/vecteezy_fresh-cardamom-pods-in-a-wooden-bowl_55395910.png',
    size: 80, x: 72, y: 62, orbitAmp: 14, orbitSpeed: 0.35, orbitPhase: 2.6, delay: 0.4,
  },
  {
    id: 'pepper', name: 'Black Pepper',
    img: '/Whole Spice/vecteezy_ai-generated-black-pepper-png-isolated-on-transparent_37280071.png',
    size: 76, x: 14, y: 66, orbitAmp: 10, orbitSpeed: 0.45, orbitPhase: 0.7, delay: 0.6,
  },
  {
    id: 'staranise', name: 'Star Anise',
    img: '/Whole Spice/vecteezy_a-white-ceramic-bowl-filled-with-numerous-star-anise-pods_67847656.png',
    size: 84, x: 88, y: 42, orbitAmp: 8, orbitSpeed: 0.3, orbitPhase: 4.1, delay: 0.1,
  },
  {
    id: 'turmeric', name: 'Turmeric',
    img: '/Whole Spice/—Pngtree—bowl of turmeric powder with_16791150.png',
    size: 68, x: 4, y: 44, orbitAmp: 10, orbitSpeed: 0.55, orbitPhase: 3.2, delay: 0.3,
  },
  {
    id: 'cumin', name: 'Cumin',
    img: '/Whole Spice/vecteezy_ai-generated-dried-cumin-seeds-in-wooden-spoon-png_41167200.png',
    size: 70, x: 48, y: 8, orbitAmp: 11, orbitSpeed: 0.42, orbitPhase: 5.1, delay: 0.5,
  },
  {
    id: 'coriander', name: 'Coriander',
    img: '/Whole Spice/vecteezy_coriander-seeds-displayed-in-a-wooden-bowl-on-a-transparent_57176801.png',
    size: 66, x: 44, y: 78, orbitAmp: 9, orbitSpeed: 0.48, orbitPhase: 2.0, delay: 0.7,
  },
];

export const SpiceUniverseHero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number>(0);
  const startTime = useRef(Date.now());

  // Subtle mouse-driven tilt for the floating field
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 25, damping: 18 });
  const springY = useSpring(mouseY, { stiffness: 25, damping: 18 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(((e.clientX - rect.left) / rect.width - 0.5) * 18);
    mouseY.set(((e.clientY - rect.top) / rect.height - 0.5) * 10);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  // Orbit animation tick
  useEffect(() => {
    const loop = () => {
      setTick(Date.now() - startTime.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <section
      className="relative py-28 lg:py-40 bg-[#FDFBF9] overflow-hidden"
      aria-label="Spice Heritage Collection"
    >
      {/* Ambient blurs — matches other sections */}
      <div className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] bg-[#D63220]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-[#E65C19]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-[#8B4513]/4 rounded-full blur-[80px] pointer-events-none" />

      {/* Floating spices layer */}
      <motion.div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden"
        style={{ x: springX, y: springY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {SPICES.map((spice) => {
          const t = tick / 1000;
          const angle = t * spice.orbitSpeed + spice.orbitPhase;
          const dx = Math.cos(angle) * spice.orbitAmp;
          const dy = Math.sin(angle) * spice.orbitAmp * 0.6;
          const isHovered = hoveredId === spice.id;

          return (
            <motion.div
              key={spice.id}
              className="absolute cursor-pointer select-none"
              style={{
                left: `calc(${spice.x}% + ${dx}px)`,
                top: `calc(${spice.y}% + ${dy}px)`,
              }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: spice.delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              onMouseEnter={() => setHoveredId(spice.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <motion.div
                animate={{ scale: isHovered ? 1.12 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative rounded-full overflow-hidden flex items-center justify-center"
                style={{
                  width: spice.size,
                  height: spice.size,
                  background: 'radial-gradient(circle at 40% 35%, #FFF8F0, #F5E6D0)',
                  boxShadow: isHovered
                    ? '0 20px 50px rgba(214,50,32,0.25), 0 0 0 3px rgba(214,50,32,0.3)'
                    : '0 12px 32px rgba(62,35,20,0.15), 0 0 0 1px rgba(62,35,20,0.06)',
                }}
              >
                <motion.img
                  src={spice.img}
                  alt={spice.name}
                  className="w-full h-full object-contain p-2"
                  loading="lazy"
                  draggable={false}
                />
                {/* Glossy sheen overlay */}
                <div className="absolute inset-0 rounded-full"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 55%)' }} />
              </motion.div>

              {/* Name chip on hover */}
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full text-xs font-black text-white shadow-lg pointer-events-none"
                  style={{ background: 'linear-gradient(135deg, #D63220, #E65C19)' }}
                >
                  {spice.name}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Centre content */}
      <div className="container mx-auto px-4 max-w-4xl relative z-10 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#D63220]/20 bg-white/80 backdrop-blur-md mb-8 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-[#D63220]" />
          <span className="text-xs font-black tracking-[0.2em] text-[#3E2314] uppercase">
            Heritage Spice Collection
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-5xl md:text-7xl lg:text-8xl font-black text-[#3E2314] tracking-tight leading-[1.05] mb-7"
        >
          Pure Spices.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#8B4513] italic">
            Authentic Taste.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-[#3E2314]/60 max-w-2xl mx-auto font-medium leading-relaxed mb-12"
        >
          Stone-ground whole spices, sourced directly from India's finest farms.
          No additives. No shortcuts. Since 2008.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/products">
            <button className="group relative overflow-hidden bg-gradient-to-r from-[#D63220] to-[#E65C19] text-white px-10 py-4 rounded-full font-bold text-base transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_20px_40px_rgba(214,50,32,0.3)] flex items-center gap-3">
              <span className="relative z-10">Explore Collection</span>
              <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </button>
          </Link>
          <Link to="/spice-guide">
            <button className="px-10 py-4 rounded-full font-bold text-base text-[#3E2314] border-2 border-[#3E2314]/20 hover:border-[#D63220]/50 hover:bg-[#D63220]/5 transition-all duration-300 bg-white/70 backdrop-blur-sm shadow-sm">
              Spice Guide
            </button>
          </Link>
        </motion.div>

        {/* Hover hint */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="text-[#3E2314]/30 text-xs tracking-widest uppercase mt-10"
        >
          Hover the spices to explore
        </motion.p>
      </div>
    </section>
  );
};
