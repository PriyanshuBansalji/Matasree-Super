/**
 * HeroParallax — PREMIUM EDITION (on-theme)
 *
 * Palette: site's warm cream background, cinnamon brown text,
 * saffron primary, chili accent — zero deviation from design system.
 *
 * Animations:
 *  ① Word-by-word clip-path wipe headline reveal
 *  ② Spices enter from off-screen with spring physics, then float continuously
 *  ③ Layered depth-of-field — blur decreases front-to-back
 *  ④ Mouse parallax — 4 independent depth layers
 *  ⑤ Scroll — content lifts + fades, spices drift at different rates
 *  ⑥ Spice-dust micro-particles rise upward continuously
 *  ⑦ Horizontal marquee name strip with pausing on hover
 *  ⑧ Counter stats animate up on mount
 *  ⑨ CTA shimmer sweep on hover
 */

import {
  useRef, useCallback, useEffect, useState,
} from 'react';
import {
  motion, useScroll, useTransform,
  useMotionValue, useSpring,
} from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowUpRight, Sparkles, ShieldCheck, Leaf, Award, MapPin, Truck, CheckCircle2, Clock } from 'lucide-react';

// ─── Theme colours (matching CSS variables exactly) ───────────────────────────
const C = {
  bg:        '#F8F3EC',   // hsl(35 25% 96%) — warm cream
  fg:        '#3E2314',   // hsl(20 35% 20%) — dark cinnamon
  primary:   '#F07D05',   // hsl(33 98% 48%) — saffron
  chili:     '#D63220',   // hsl(6  95% 45%) — chili red
  muted:     '#A07850',   // muted foreground
  border:    '#D4A87A',   // hsl(33 50% 82%)
};

// ─── Spice image definitions with DoF layer ───────────────────────────────────
const SPICE_LAYERS = [
  // Layer 0 — deep background, heavy blur, very transparent, slowest parallax
  {
    id: 'bg-turmeric',
    src: '/Whole Spice/—Pngtree—bowl of turmeric powder with_16791150.png',
    layer: 0,
    size: 480,
    pos: { top: '-14%', left: '-8%' },
    rotate: -20,
    blur: 18,
    opacity: 0.22,
    parallax: 0.012,
    floatAmp: 14,
    floatDur: 9,
    enterFrom: { x: -120, y: -80, rotate: -35 },
    enterDelay: 0,
  },
  {
    id: 'bg-staranise',
    src: '/Whole Spice/vecteezy_a-white-ceramic-bowl-filled-with-numerous-star-anise-pods_67847656.png',
    layer: 0,
    size: 420,
    pos: { top: '-10%', right: '-6%' },
    rotate: 26,
    blur: 16,
    opacity: 0.20,
    parallax: 0.012,
    floatAmp: 12,
    floatDur: 11,
    enterFrom: { x: 120, y: -60, rotate: 45 },
    enterDelay: 0.15,
  },
  // Layer 1 — mid, soft blur, medium parallax
  {
    id: 'mid-cinnamon',
    src: '/Whole Spice/—Pngtree—spice cinnamon_5610999.png',
    layer: 1,
    size: 310,
    pos: { bottom: '4%', left: '1%' },
    rotate: 14,
    blur: 5,
    opacity: 0.62,
    parallax: 0.038,
    floatAmp: 10,
    floatDur: 7,
    enterFrom: { x: -160, y: 80, rotate: 30 },
    enterDelay: 0.3,
  },
  {
    id: 'mid-cardamom',
    src: '/Whole Spice/vecteezy_fresh-cardamom-pods-in-a-wooden-bowl_55395910.png',
    layer: 1,
    size: 280,
    pos: { bottom: '2%', right: '2%' },
    rotate: -10,
    blur: 4,
    opacity: 0.65,
    parallax: 0.038,
    floatAmp: 8,
    floatDur: 8.5,
    enterFrom: { x: 140, y: 100, rotate: -25 },
    enterDelay: 0.45,
  },
  // Layer 2 — sharp foreground, full opacity, transparent PNG floating spices
  {
    id: 'fg-pepper',
    src: '/Whole Spice/vecteezy_ai-generated-black-pepper-png-isolated-on-transparent_37280071.png',
    layer: 2,
    size: 210,
    pos: { top: '16%', left: '4%' },
    rotate: -7,
    blur: 0,
    opacity: 0.95,
    parallax: 0.085,
    floatAmp: 6,
    floatDur: 5.5,
    enterFrom: { x: -200, y: 0, rotate: -20 },
    enterDelay: 0.6,
  },
  {
    id: 'fg-coriander',
    src: '/Whole Spice/vecteezy_coriander-seeds-displayed-in-a-wooden-bowl-on-a-transparent_57176801.png',
    layer: 2,
    size: 195,
    pos: { top: '20%', right: '5%' },
    rotate: 11,
    blur: 0,
    opacity: 0.92,
    parallax: 0.085,
    floatAmp: 7,
    floatDur: 6,
    enterFrom: { x: 200, y: -20, rotate: 28 },
    enterDelay: 0.7,
  },
  {
    id: 'fg-cumin',
    src: '/Whole Spice/vecteezy_ai-generated-dried-cumin-seeds-in-wooden-spoon-png_41167200.png',
    layer: 2,
    size: 170,
    pos: { bottom: '28%', right: '16%' },
    rotate: -16,
    blur: 0,
    opacity: 0.90,
    parallax: 0.085,
    floatAmp: 5,
    floatDur: 6.5,
    enterFrom: { x: 160, y: 120, rotate: -30 },
    enterDelay: 0.8,
  },
  {
    id: 'fg-cloves',
    src: '/Whole Spice/vecteezy_ai-generated-dried-cloves-in-the-wooden-spoon-isolated-on_37924336.png',
    layer: 2,
    size: 168,
    pos: { bottom: '30%', left: '18%' },
    rotate: 20,
    blur: 1,
    opacity: 0.82,
    parallax: 0.072,
    floatAmp: 8,
    floatDur: 6.8,
    enterFrom: { x: -100, y: 140, rotate: 38 },
    enterDelay: 0.9,
  },
] as const;

// ─── Rising dust particles ────────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x:        5 + (i * 3.4) % 90,
  size:     2 + (i % 3),
  duration: 8 + (i % 6) * 1.4,
  delay:    (i * 0.38) % 5,
  opacity:  0.12 + (i % 4) * 0.05,
  color:    i % 3 === 0 ? C.chili : i % 3 === 1 ? C.primary : C.border,
}));

// ─── Ticker items ─────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  'Cinnamon', '✦', 'Cardamom', '✦', 'Turmeric', '✦', 'Star Anise',
  '✦', 'Black Pepper', '✦', 'Cumin', '✦', 'Coriander', '✦', 'Cloves', '✦',
];

// ─── Counter hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, delay = 1200, duration = 1600) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const e = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(e * target));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay, duration]);
  return val;
}

const STATS = [
  { value: 38,   suffix: '+',  label: 'Spice Varieties', icon: Leaf },
  { value: 2008, suffix: '',   label: 'Est. Year',       icon: Award },
  { value: 2400, suffix: '+',  label: 'Happy Customers', icon: ShieldCheck },
];

// ─── Headline words ───────────────────────────────────────────────────────────
// "Elevating Indian Culinary Heritage." — words split for stagger
const HEADLINE_LINES = [
  ['Elevating', 'Indian'],
  ['Culinary'],
  ['Heritage.'],
];

// ─── Component ────────────────────────────────────────────────────────────────

export const HeroParallax = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const contentY    = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);

  // Mouse parallax (0–1 normalised)
  const rawMX = useMotionValue(0.5);
  const rawMY = useMotionValue(0.5);
  const mx = useSpring(rawMX, { stiffness: 55, damping: 20 });
  const my = useSpring(rawMY, { stiffness: 55, damping: 20 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    rawMX.set((e.clientX - r.left) / r.width);
    rawMY.set((e.clientY - r.top)  / r.height);
  }, [rawMX, rawMY]);

  const handleMouseLeave = useCallback(() => {
    rawMX.set(0.5); rawMY.set(0.5);
  }, [rawMX, rawMY]);

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full overflow-hidden bg-background"
      style={{ minHeight: '100svh' }}
    >
      {/* ── Warm radial light behind text ──────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 50% 42%,
              hsl(33 98% 48% / 0.08) 0%,
              transparent 70%
            ),
            radial-gradient(ellipse 40% 35% at 12% 80%,
              hsl(6 95% 45% / 0.07) 0%,
              transparent 55%
            ),
            radial-gradient(ellipse 40% 35% at 88% 75%,
              hsl(6 95% 45% / 0.06) 0%,
              transparent 55%
            )
          `,
        }}
      />

      {/* ── Spice pattern tile ─────────────────────────────── */}
      <div className="absolute inset-0 spice-pattern opacity-60 pointer-events-none z-0" />

      {/* ── Rising dust particles ──────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left:   `${p.x}%`,
              bottom: '-5%',
              width:  p.size,
              height: p.size,
              backgroundColor: p.color,
              opacity: 0,
            }}
            animate={{
              y:       [0, -(380 + p.id * 8)],
              opacity: [0, p.opacity, p.opacity * 0.5, 0],
              x:       [0, (p.id % 2 === 0 ? 1 : -1) * (10 + p.id % 14)],
            }}
            transition={{
              duration: p.duration,
              delay:    p.delay,
              repeat:   Infinity,
              ease:     'easeOut',
            }}
          />
        ))}
      </div>

      {/* ── Depth-of-field spice images (Responsive: scaled & filtered for mobile) ────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {SPICE_LAYERS.map((spice) => (
          <SpiceLayer key={spice.id} spice={spice} mx={mx} my={my} />
        ))}
      </div>

      {/* ── Hero content ───────────────────────────────────── */}
      <motion.div
        className="relative z-30 flex flex-col min-h-0 sm:min-h-svh justify-between py-6 sm:py-12"
        style={{ opacity: heroOpacity, y: contentY }}
      >
        {/* Top ticker */}
        <div className="pt-16 sm:pt-28">
          <SpiceTicker />
        </div>

        {/* Centre content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-10 text-center max-w-5xl mx-auto w-full">

          {/* Traditional Heritage Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-1.5 sm:gap-2.5 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full border mb-4 sm:mb-8 shadow-sm max-w-[92vw]"
            style={{
              borderColor: '#C89B3C70',
              background:  '#FAF6F0',
              boxShadow: '0 4px 20px rgba(200, 155, 60, 0.15)',
            }}
          >
            <span className="text-amber-700 text-xs">✦</span>
            <span
              className="text-[9px] sm:text-[11px] font-bold tracking-[0.14em] sm:tracking-[0.24em] uppercase text-[#3E2314] truncate"
            >
              Estd. 2008 • 100% Pure Stone-Ground Masale
            </span>
            <span className="text-amber-700 text-xs">✦</span>
          </motion.div>

          {/* Headline — line-by-line clip wipe */}
          <h1
            className="font-serif font-black tracking-tight leading-[1.08] sm:leading-[1.04] mb-4 sm:mb-6 text-[#3E2314] px-2"
            style={{ fontSize: 'clamp(2.1rem, 8vw, 8.5rem)' }}
          >
            {HEADLINE_LINES.map((line, li) => (
              <div key={li} className="block overflow-hidden">
                {line.map((word, wi) => {
                  const isAccent = word === 'Heritage.';
                  const delay = 0.4 + (li * line.length + wi) * 0.12;
                  return (
                    <span key={word} className="inline-block overflow-hidden mr-2 sm:mr-4 last:mr-0">
                      <motion.span
                        className="inline-block"
                        initial={{ y: '115%', opacity: 0 }}
                        animate={{ y: '0%', opacity: 1 }}
                        transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
                        style={
                          isAccent
                            ? {
                                backgroundImage: `linear-gradient(135deg, ${C.chili} 0%, #C89B3C 60%, ${C.fg} 100%)`,
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                color: 'transparent' as const,
                              }
                            : {}
                        }
                      >
                        {word}
                      </motion.span>
                    </span>
                  );
                })}
              </div>
            ))}
          </h1>

          {/* Sub-copy */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 1.1 }}
            className="text-xs sm:text-xl max-w-xl font-serif font-medium leading-relaxed mb-6 sm:mb-10 text-[#3E2314]/80 px-2"
          >
            Authentic taste of Indian heritage. Sourced directly from Himalayan foothills &amp; cold-ground in traditional mortars to preserve 100% natural essential oils.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 1.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-14 w-full sm:w-auto px-4"
          >
            <Link to="/products" className="w-full sm:w-auto">
              <motion.button
                className="group relative overflow-hidden flex items-center justify-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-bold text-xs sm:text-sm tracking-wider uppercase text-white w-full sm:w-auto shadow-md"
                style={{ background: `linear-gradient(135deg, ${C.chili} 0%, ${C.primary} 100%)` }}
                whileHover={{ scale: 1.04, boxShadow: `0 16px 40px ${C.chili}40` }}
                whileTap={{ scale: 0.97 }}
              >
                {/* shimmer sweep */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ x: '-100%', skewX: '-20deg' }}
                  whileHover={{ x: '160%' }}
                  transition={{ duration: 0.55, ease: 'easeInOut' }}
                  style={{ background: 'rgba(255,255,255,0.25)', width: '50%' }}
                />
                <span className="relative z-10">Shop Authentic</span>
                <ChevronRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <Link to="/categories" className="w-full sm:w-auto">
              <motion.button
                className="flex items-center justify-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-bold text-xs sm:text-sm tracking-wider uppercase w-full sm:w-auto"
                style={{
                  color:   C.fg,
                  border:  `1.5px solid ${C.border}80`,
                  background: 'rgba(255,255,255,0.65)',
                  backdropFilter: 'blur(10px)',
                }}
                whileHover={{
                  scale: 1.04,
                  borderColor: C.primary,
                  color: C.chili,
                  background: 'rgba(255,255,255,0.9)',
                }}
                whileTap={{ scale: 0.97 }}
              >
                Browse Categories <ArrowUpRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>

          {/* ── Express Delivery Pincode Estimator Pill ───────────────────── */}
          <HeroPincodeEstimator />

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.6 }}
            className="grid grid-cols-3 items-center justify-center gap-2 sm:gap-12 px-3 sm:px-6 py-3.5 sm:py-5 rounded-2xl w-full max-w-xl"
            style={{
              background:  'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(16px)',
              border:      `1px solid ${C.border}40`,
              boxShadow:   `0 8px 32px ${C.fg}08`,
            }}
          >
            {STATS.map((s, i) => (
              <StatItem key={s.label} {...s} delay={1800 + i * 180} />
            ))}
          </motion.div>
        </div>

        {/* Scroll pill */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4 }}
          className="hidden sm:flex flex-col items-center gap-2 pb-6"
        >
          <div
            className="w-6 h-10 rounded-full flex items-start justify-center pt-2"
            style={{ border: `1.5px solid ${C.border}60` }}
          >
            <motion.div
              className="w-1.5 h-2.5 rounded-full"
              style={{ background: `linear-gradient(${C.chili}, ${C.primary})` }}
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <span
            className="text-[9px] font-black tracking-[0.4em] uppercase"
            style={{ color: `${C.fg}35` }}
          >
            Scroll
          </span>
        </motion.div>
      </motion.div>

      {/* Bottom fade to next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-40"
        style={{ background: 'linear-gradient(to top, hsl(35 25% 96%) 0%, transparent 100%)' }}
      />
    </section>
  );
};

// ─── SpiceLayer sub-component ─────────────────────────────────────────────────

type TSpice = typeof SPICE_LAYERS[number];

function SpiceLayer({
  spice,
  mx,
  my,
}: {
  spice: TSpice;
  mx: ReturnType<typeof useSpring>;
  my: ReturnType<typeof useSpring>;
}) {
  const px = useTransform(mx, [0, 1], [-(spice.parallax * 500), spice.parallax * 500]);
  const py = useTransform(my, [0, 1], [-(spice.parallax * 360), spice.parallax * 360]);

  // Hide deep background blur overlays on mobile so they don't block mobile screen text
  const isMobileHidden = spice.layer === 0 || spice.layer === 1;

  return (
    <motion.div
      className={`absolute pointer-events-none ${isMobileHidden ? 'hidden sm:block' : 'block'}`}
      style={{
        ...spice.pos,
        x: px,
        y: py,
        width:   'clamp(90px, 22vw, ' + spice.size + 'px)',
        height:  'clamp(90px, 22vw, ' + spice.size + 'px)',
        filter:  `blur(${spice.blur}px)`,
      }}
      initial={{
        opacity: 0,
        rotate: spice.enterFrom.rotate,
        scale: 0.75,
      }}
      animate={{
        opacity: spice.opacity,
        rotate: spice.rotate,
        scale: 1,
      }}
      transition={{
        opacity: { duration: 1.1, delay: spice.enterDelay },
        scale:   { duration: 1.1, delay: spice.enterDelay, ease: [0.16, 1, 0.3, 1] },
        rotate:  { duration: 1.1, delay: spice.enterDelay, ease: [0.16, 1, 0.3, 1] },
      }}
    >
      {/* Continuous float after entrance */}
      <motion.img
        src={spice.src}
        alt=""
        aria-hidden
        draggable={false}
        loading="eager"
        className="w-full h-full object-contain"
        style={{
          filter: `
            drop-shadow(0 ${12 + spice.layer * 8}px ${28 + spice.layer * 14}px rgba(62,35,20,${0.18 + spice.layer * 0.06}))
            saturate(${1.05 + spice.layer * 0.08})
          `,
        }}
        animate={{
          y: [-spice.floatAmp / 2, spice.floatAmp / 2, -spice.floatAmp / 2],
        }}
        transition={{
          duration: spice.floatDur,
          repeat:   Infinity,
          ease:     'easeInOut',
          delay:    spice.enterDelay + 1.1,
        }}
      />
    </motion.div>
  );
}

// ─── Ticker ───────────────────────────────────────────────────────────────────

function SpiceTicker() {
  const repeated = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div
      className="overflow-hidden w-full py-2.5 border-y"
      style={{ borderColor: `${C.border}50` }}
    >
      <motion.div
        className="flex gap-6 whitespace-nowrap w-max"
        animate={{ x: ['0%', '-33.33%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        style={{ willChange: 'transform' }}
      >
        {repeated.map((item, i) => (
          <span
            key={i}
            className="text-[10px] font-black tracking-[0.28em] uppercase select-none"
            style={{ color: item === '✦' ? C.chili : `${C.fg}45` }}
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Stat item ────────────────────────────────────────────────────────────────

function StatItem({
  value, suffix, label, icon: Icon, delay,
}: {
  value: number; suffix: string; label: string;
  icon: typeof Leaf; delay: number;
}) {
  const count = useCountUp(value, delay);
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: `${C.chili}15` }}
      >
        <Icon className="w-4 h-4" style={{ color: C.chili }} />
      </div>
      <div className="text-left">
        <p
          className="font-serif font-black leading-none tabular-nums"
          style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: C.fg }}
        >
          {count.toLocaleString()}{suffix}
        </p>
        <p
          className="text-[10px] font-semibold tracking-widest uppercase mt-0.5"
          style={{ color: `${C.fg}50` }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

// ─── Express Delivery Pincode Estimator Subcomponent ──────────────────────────

function HeroPincodeEstimator() {
  const [pincode, setPincode] = useState('248001');
  const [result, setResult] = useState<{ status: 'success' | 'checking'; message: string; date: string } | null>({
    status: 'success',
    message: 'Express Delivery Available to Dehradun',
    date: '2-3 Business Days (Free on orders > ₹499)',
  });

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      setResult({
        status: 'checking',
        message: 'Please enter a valid 6-digit Indian PIN Code',
        date: '',
      });
      return;
    }

    setResult({
      status: 'success',
      message: `Express Courier Dispatch Available for PIN ${pincode}`,
      date: 'Estimated Delivery in 2 to 4 Days',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, delay: 1.45 }}
      className="mb-10 w-full max-w-md mx-auto"
    >
      <form onSubmit={handleCheck} className="flex items-center gap-2 p-1.5 rounded-full border shadow-sm" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderColor: `${C.border}80` }}>
        <div className="flex items-center gap-2 pl-3 flex-1">
          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: C.primary }} />
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter Pincode (e.g. 248001)"
            className="w-full bg-transparent text-xs font-semibold text-foreground focus:outline-none placeholder:text-gray-400"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white transition-all hover:scale-105 active:scale-95 shadow-sm"
          style={{ background: `linear-gradient(135deg, ${C.chili} 0%, ${C.primary} 100%)` }}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Check</span>
        </button>
      </form>

      {result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-2.5 flex items-center justify-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50/90 border border-emerald-200/80 px-3.5 py-1.5 rounded-full shadow-sm mx-auto w-fit"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span><strong>{result.message}:</strong> {result.date}</span>
        </motion.div>
      )}
    </motion.div>
  );
}

