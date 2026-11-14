/**
 * SpiceIngredientExplorer
 *
 * A Garam Masala blend composed of orbiting 3D ingredient cards.
 * Each ingredient rotates on its own axis.
 * Clicking one stops its rotation and opens a benefits panel.
 *
 * Real Unsplash images. No emojis.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Leaf, ShieldCheck, Zap, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Ingredient {
  id: string;
  name: string;
  role: string;
  img: string;
  color: string;
  angle: number;      // initial orbit position (degrees)
  benefits: { icon: typeof Leaf; text: string }[];
  orbitRadius: number;
}

const INGREDIENTS: Ingredient[] = [
  {
    id: 'cinnamon',
    name: 'Cinnamon',
    role: 'Warmth & Sweetness',
    img: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=200&q=80&auto=format&fit=crop',
    color: '#8B4513',
    angle: 0,
    orbitRadius: 220,
    benefits: [
      { icon: ShieldCheck, text: 'Powerful anti-inflammatory properties' },
      { icon: Heart, text: 'Helps regulate blood sugar levels' },
      { icon: Leaf, text: 'Rich in cinnamaldehyde - antifungal' },
      { icon: Zap, text: 'Boosts metabolism and digestion' },
    ],
  },
  {
    id: 'cloves',
    name: 'Cloves',
    role: 'Depth & Aroma',
    img: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=200&q=80&auto=format&fit=crop',
    color: '#5D4037',
    angle: 72,
    orbitRadius: 220,
    benefits: [
      { icon: ShieldCheck, text: 'Highest antioxidant content of any spice' },
      { icon: Leaf, text: 'Eugenol: natural pain reliever' },
      { icon: Heart, text: 'Protects liver health' },
      { icon: Zap, text: 'Potent antibacterial agent' },
    ],
  },
  {
    id: 'pepper',
    name: 'Black Pepper',
    role: 'Heat & Piperine',
    img: 'https://images.unsplash.com/photo-1598511726623-d2e9996e7cb5?w=200&q=80&auto=format&fit=crop',
    color: '#37474F',
    angle: 144,
    orbitRadius: 220,
    benefits: [
      { icon: Zap, text: 'Piperine increases nutrient absorption 20x' },
      { icon: Heart, text: 'Anti-cancer properties under study' },
      { icon: ShieldCheck, text: 'Improves brain function' },
      { icon: Leaf, text: 'Natural gut health promoter' },
    ],
  },
  {
    id: 'cardamom',
    name: 'Cardamom',
    role: 'Floral Sweetness',
    img: 'https://images.unsplash.com/photo-1599909144696-3b8e55d9eba0?w=200&q=80&auto=format&fit=crop',
    color: '#2E7D32',
    angle: 216,
    orbitRadius: 220,
    benefits: [
      { icon: Heart, text: 'Lowers blood pressure naturally' },
      { icon: ShieldCheck, text: 'Antioxidant & diuretic' },
      { icon: Leaf, text: 'Freshens breath & aids digestion' },
      { icon: Zap, text: 'Anti-inflammatory compounds' },
    ],
  },
  {
    id: 'staranise',
    name: 'Star Anise',
    role: 'Liquorice Depth',
    img: 'https://images.unsplash.com/photo-1575217111835-e0dbf0de02b7?w=200&q=80&auto=format&fit=crop',
    color: '#E65100',
    angle: 288,
    orbitRadius: 220,
    benefits: [
      { icon: ShieldCheck, text: 'Source of shikimic acid (antiviral)' },
      { icon: Leaf, text: 'Strong antibacterial properties' },
      { icon: Heart, text: 'Hormone-balancing plant estrogen' },
      { icon: Zap, text: 'Supports healthy digestion' },
    ],
  },
];

const ORBIT_SPEED = 0.35; // degrees per second

export const SpiceIngredientExplorer = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [angles, setAngles] = useState<Record<string, number>>(
    Object.fromEntries(INGREDIENTS.map((ing) => [ing.id, ing.angle]))
  );
  const rafRef = useRef<number>(0);
  const lastTime = useRef(Date.now());

  useEffect(() => {
    const loop = () => {
      const now = Date.now();
      const dt = (now - lastTime.current) / 1000;
      lastTime.current = now;

      setAngles((prev) => {
        const next = { ...prev };
        INGREDIENTS.forEach((ing) => {
          if (ing.id !== activeId) {
            next[ing.id] = (prev[ing.id] + ORBIT_SPEED * dt * 360) % 360;
          }
        });
        return next;
      });

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [activeId]);

  const activeIng = INGREDIENTS.find((i) => i.id === activeId);

  return (
    <section
      className="relative w-full py-20 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0A0502 0%, #120604 100%)' }}
      aria-label="Explore Garam Masala Ingredients"
    >
      {/* Header */}
      <div className="container mx-auto px-4 text-center mb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-xs font-black tracking-[0.3em] uppercase mb-3"
            style={{ color: '#C0392B' }}>
            Explore Ingredients
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-black text-white mb-3">
            Inside Garam Masala
          </h2>
          <p className="text-white/40 text-base max-w-md mx-auto">
            Click any ingredient to discover its ancient benefits.
          </p>
        </motion.div>
      </div>

      {/* Orbit scene */}
      <div
        className="relative mx-auto"
        style={{ width: '600px', height: '600px', maxWidth: '100vw' }}
      >
        {/* Orbit ring */}
        <div
          className="absolute rounded-full border border-dashed pointer-events-none"
          style={{
            width: '440px', height: '440px',
            top: '80px', left: '80px',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        />

        {/* Centre masala image */}
        <div
          className="absolute rounded-full overflow-hidden"
          style={{
            width: '140px', height: '140px',
            top: '230px', left: '230px',
            border: '3px solid rgba(255,255,255,0.1)',
            boxShadow: '0 0 60px rgba(192,57,43,0.3)',
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=80&auto=format&fit=crop"
            alt="Garam Masala blend"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.45)' }}>
            <p className="text-white font-black text-xs text-center leading-tight px-2">
              Garam<br />Masala
            </p>
          </div>
        </div>

        {/* Orbiting ingredients */}
        {INGREDIENTS.map((ing) => {
          const rad = (angles[ing.id] * Math.PI) / 180;
          const cx = 300 + Math.cos(rad) * ing.orbitRadius;
          const cy = 300 + Math.sin(rad) * ing.orbitRadius;
          const isActive = activeId === ing.id;

          return (
            <motion.div
              key={ing.id}
              className="absolute cursor-pointer"
              style={{
                left: cx - 44,
                top: cy - 44,
                zIndex: isActive ? 20 : 10,
              }}
              animate={isActive ? { scale: 1.2 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={() => setActiveId(isActive ? null : ing.id)}
              aria-label={`Explore ${ing.name}`}
            >
              {/* Self-rotation */}
              <motion.div
                className="w-[88px] h-[88px] rounded-full overflow-hidden relative"
                animate={{ rotate: isActive ? 0 : 360 }}
                transition={isActive ? {} : {
                  duration: 8,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{
                  border: `2px solid ${isActive ? ing.color : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: isActive
                    ? `0 0 30px ${ing.color}88, 0 0 0 4px ${ing.color}44`
                    : `0 8px 24px rgba(0,0,0,0.5)`,
                }}
              >
                <img
                  src={ing.img}
                  alt={ing.name}
                  className="w-full h-full object-cover"
                  style={{ filter: isActive ? 'brightness(1.15) saturate(1.3)' : 'brightness(0.85)' }}
                />
                {/* Sheen */}
                <div className="absolute inset-0 rounded-full"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 55%)' }} />
              </motion.div>

              {/* Name label */}
              <div
                className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-center"
                style={{ color: isActive ? ing.color : 'rgba(255,255,255,0.5)' }}
              >
                {ing.name}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Benefits panel */}
      <AnimatePresence>
        {activeIng && (
          <motion.div
            key={activeIng.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="mx-auto mt-8 max-w-lg px-4 relative z-20"
          >
            <div
              className="rounded-2xl p-6 relative"
              style={{
                background: `linear-gradient(135deg, #0F0604, ${activeIng.color}22)`,
                border: `1px solid ${activeIng.color}44`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <button
                onClick={() => setActiveId(null)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4 mb-5">
                <img
                  src={activeIng.img}
                  alt={activeIng.name}
                  className="w-14 h-14 rounded-xl object-cover"
                  style={{ border: `2px solid ${activeIng.color}66` }}
                />
                <div>
                  <h3 className="font-black text-xl text-white">{activeIng.name}</h3>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: activeIng.color }}>
                    {activeIng.role}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeIng.benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: activeIng.color + '22' }}
                    >
                      <b.icon className="w-3.5 h-3.5" style={{ color: activeIng.color }} />
                    </div>
                    <p className="text-white/65 text-sm leading-snug">{b.text}</p>
                  </div>
                ))}
              </div>

              <Link
                to={`/products?tag=${encodeURIComponent(activeIng.name.toLowerCase())}`}
                className="inline-flex items-center gap-2 mt-5 text-xs font-bold px-4 py-2 rounded-full transition-all hover:opacity-80"
                style={{ background: activeIng.color, color: 'white' }}
              >
                Shop {activeIng.name}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!activeId && (
        <p className="text-center text-white/20 text-xs tracking-widest uppercase mt-6">
          Click any ingredient to explore its benefits
        </p>
      )}
    </section>
  );
};
