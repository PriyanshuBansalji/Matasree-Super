import { useRef, useCallback, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { ChevronRight, Play, Sparkles, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const particles = Array.from({ length: 35 }).map((_, i) => ({
  id: i,
  size: Math.random() * 8 + 3,
  x: Math.random() * 100,
  y: Math.random() * 100,
  duration: Math.random() * 20 + 10,
  delay: Math.random() * 5,
}));

export const HeroParallax = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Multi-layer parallax for extreme cinematic depth
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const backgroundScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.2]);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '120%']);
  const headerY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const badgeScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const buttonsY = useTransform(scrollYProgress, [0, 1], ['0%', '70%']);

  // Mouse-driven subtle parallax for the entire hero
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { damping: 30, stiffness: 100 });
  const smoothMouseY = useSpring(mouseY, { damping: 30, stiffness: 100 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  // Typewriter effect for authenticity
  const [displayText, setDisplayText] = useState('');
  const fullText = 'Experience the authentic taste of tradition with absolutely pure, unadulterated cold-ground spices.';
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(timer);
    }, 25);
    return () => clearInterval(timer);
  }, []);

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen w-full overflow-hidden bg-[#FDFBF9] flex items-center justify-center"
    >
      {/* Parallax Background Texture — zooms & shifts as you scroll */}
      <motion.div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=2070&auto=format&fit=crop")',
          y: backgroundY,
          scale: backgroundScale,
          x: smoothMouseX,
        }}
      />

      {/* Contrast dimmer */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#FDFBF9]/80 via-[#FDFBF9]/50 to-[#FDFBF9] pointer-events-none" />

      {/* Mouse-reactive ambient accents */}
      <motion.div
        style={{ x: smoothMouseX, y: smoothMouseY }}
        className="absolute top-0 right-[10%] w-[40vw] h-[40vw] bg-[#E65C19]/5 rounded-full blur-[100px] pointer-events-none"
      />
      <motion.div
        style={{ x: smoothMouseX, y: smoothMouseY }}
        className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#D63220]/5 rounded-full blur-[120px] pointer-events-none"
      />

      {/* Floating Cinematic Particles */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: `${p.y}vh`, x: `${p.x}vw`, opacity: 0 }}
            animate={{
              y: [`${p.y}vh`, `${(p.y + 15) % 100}vh`, `${(p.y - 15) % 100}vh`],
              x: [`${p.x}vw`, `${(p.x + 8) % 100}vw`, `${(p.x - 8) % 100}vw`],
              opacity: [0, Math.random() * 0.5 + 0.1, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute rounded-full bg-[#8B4513]/30 filter blur-[1px]"
            style={{ width: p.size, height: p.size }}
          />
        ))}
      </div>

      {/* Ghost Typography — parallaxes at different speed */}
      <motion.div 
        className="absolute inset-x-0 top-[10%] flex flex-col items-center justify-center z-10 pointer-events-none overflow-hidden"
        style={{ y: textY, opacity }}
      >
        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-[22vw] font-black font-serif tracking-tighter leading-[0.75] text-[#3E2314]/[0.03] whitespace-nowrap select-none"
        >
          SPICES
        </motion.h1>
      </motion.div>

      {/* ── Hero Content ── */}
      <motion.div 
        className="relative z-40 container mx-auto px-4 flex flex-col items-center justify-center text-center w-full max-w-5xl pt-28"
        style={{ y: headerY, opacity }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ scale: badgeScale }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#D63220]/20 bg-white/80 backdrop-blur-md mb-8 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-[#D63220]" />
          <span className="text-xs md:text-sm font-black tracking-[0.2em] text-[#3E2314] uppercase">Premium Heritage Spices</span>
        </motion.div>

        {/* Main Heading — char-by-char stagger */}
        <motion.h2 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl lg:text-[6.5rem] font-black font-serif text-[#3E2314] tracking-tight leading-[1.05] mb-8"
        >
          Elevating Indian{' '}
          <br className="hidden md:block" />
          Culinary{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#8B4513]">
            Heritage.
          </span>
        </motion.h2>

        {/* Typewriter Paragraph */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-xl md:text-2xl text-[#3E2314]/70 max-w-2xl font-medium leading-relaxed mb-14 min-h-[4rem]"
        >
          {displayText}
          <span className="inline-block w-0.5 h-6 bg-[#D63220] ml-1 animate-pulse align-text-bottom" />
        </motion.p>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ y: buttonsY }}
          className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto"
        >
          <Link to="/products" className="w-full sm:w-auto">
            <button className="group relative overflow-hidden bg-gradient-to-r from-[#D63220] to-[#E65C19] text-white px-12 py-5 rounded-full font-bold text-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_20px_40px_rgba(214,50,32,0.35)] flex items-center justify-center gap-3 w-full sm:w-auto">
              <span className="relative z-10 whitespace-nowrap">Shop Authentic</span>
              <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </button>
          </Link>
          
          <button className="group px-8 py-5 rounded-full font-bold text-lg text-[#3E2314] border-2 border-[#3E2314]/25 hover:border-[#D63220]/60 hover:bg-[#D63220]/5 transition-all duration-300 flex items-center justify-center gap-4 w-full sm:w-auto bg-white/80 backdrop-blur-md shadow-sm">
            <div className="w-11 h-11 rounded-full bg-[#E65C19]/20 flex items-center justify-center group-hover:bg-[#D63220] group-hover:text-white transition-all duration-300">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            Watch Story
          </button>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        style={{ opacity }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3"
      >
        <span className="text-[10px] font-black tracking-[0.3em] text-[#3E2314]/30 uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown className="w-5 h-5 text-[#D63220]/40" />
        </motion.div>
      </motion.div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#FDFBF9] to-transparent z-20 pointer-events-none" />
    </section>
  );
};
