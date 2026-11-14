  /**
 * SpiceJar3D
 *
 * Implements the 3D "Explore Ingredients" Section:
 * - A masala selector (Garam Masala, Chaat Masala, Biryani Masala)
 * - 4 raw ingredients specific to the selected masala float in 3D space, spinning continuously
 * - Ingredients are rendered using custom premium SVGs (Cinnamon, Clove, Pepper, Cardamom, etc.)
 * - Users click an ingredient to load its health benefits and wellness facts
 *
 * Requirements: 9 (3D Explore Ingredients Section)
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, Sparkles, AlertCircle, Heart } from 'lucide-react';

interface Ingredient {
  name: string;
  benefits: string;
  aroma: string;
  healthBoost: string;
  renderSvg: () => JSX.Element;
  xOffset: number; // placement angle/position around center
  yOffset: number;
}

interface MasalaData {
  name: string;
  description: string;
  color: string;
  ingredients: Ingredient[];
}

// ━━━━ INLINE CUSTOM SVGs FOR SPICES ━━━━

const CinnamonSvg = () => (
  <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-[0_8px_16px_rgba(139,69,19,0.3)]">
    <defs>
      <linearGradient id="barkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A0522D" />
        <stop offset="50%" stopColor="#8B4513" />
        <stop offset="100%" stopColor="#5C2E0B" />
      </linearGradient>
    </defs>
    {/* Inner rolled barks */}
    <path d="M25,20 C35,15 65,15 75,20 C78,22 78,28 75,30 C65,35 35,35 25,30 C22,28 22,22 25,20 Z" fill="url(#barkGrad)" />
    <path d="M22,30 C32,25 68,25 78,30 C81,32 81,38 78,40 C68,45 32,45 22,40 C19,38 19,32 22,30 Z" fill="#8B4513" opacity="0.9" />
    <path d="M20,40 C30,35 70,35 80,40 C83,42 83,48 80,50 C70,55 30,55 20,50 C17,48 17,42 20,40 Z" fill="url(#barkGrad)" />
    <path d="M18,50 C28,45 72,45 82,50 C85,52 85,58 82,60 C72,65 28,65 18,60 C15,58 15,52 18,50 Z" fill="#5C2E0B" />
    {/* Wooden grain lines */}
    <path d="M28,25 L72,25" stroke="#3E1F07" strokeWidth="2" strokeLinecap="round" />
    <path d="M25,35 L75,35" stroke="#3E1F07" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M22,45 L78,45" stroke="#3E1F07" strokeWidth="2" strokeLinecap="round" />
    <path d="M20,55 L80,55" stroke="#3E1F07" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CloveSvg = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_6px_12px_rgba(92,46,11,0.4)]">
    <defs>
      <linearGradient id="cloveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#8A4B2D" />
        <stop offset="60%" stopColor="#5C2E16" />
        <stop offset="100%" stopColor="#3E1F0E" />
      </linearGradient>
    </defs>
    {/* Stem */}
    <rect x="44" y="35" width="12" height="45" rx="5" fill="url(#cloveGrad)" />
    {/* Texture ridges on stem */}
    <line x1="47" y1="45" x2="47" y2="70" stroke="#3E1F0E" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="53" y1="48" x2="53" y2="73" stroke="#3E1F0E" strokeWidth="1.5" strokeLinecap="round" />
    {/* Head base petals */}
    <path d="M36,35 C36,35 40,25 50,30 C60,25 64,35 64,35 C64,35 68,32 60,37 C52,42 48,42 40,37 C32,32 36,35 36,35 Z" fill="#5C2E16" />
    {/* Rounded bud bulb cap */}
    <circle cx="50" cy="22" r="13" fill="#D27D56" />
    {/* Cap highlight */}
    <ellipse cx="47" cy="18" rx="6" ry="4" fill="#E8B097" opacity="0.6" />
  </svg>
);

const BlackPepperSvg = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
    <defs>
      <radialGradient id="peppercornGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#4A4A4A" />
        <stop offset="50%" stopColor="#212121" />
        <stop offset="100%" stopColor="#0B0B0B" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="30" fill="url(#peppercornGrad)" />
    {/* Textured craters/dimples */}
    <circle cx="40" cy="38" r="2.5" fill="#111" opacity="0.7" />
    <circle cx="62" cy="45" r="3" fill="#111" opacity="0.8" />
    <circle cx="48" cy="65" r="3.5" fill="#111" opacity="0.75" />
    <circle cx="36" cy="54" r="2" fill="#111" opacity="0.6" />
    <circle cx="56" cy="32" r="2.5" fill="#111" opacity="0.7" />
    {/* Light reflection gloss */}
    <ellipse cx="42" cy="32" rx="6" ry="3" fill="#FFF" opacity="0.25" transform="rotate(-30 42 32)" />
  </svg>
);

const CardamomSvg = () => (
  <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-[0_8px_16px_rgba(39,174,96,0.3)]">
    <defs>
      <linearGradient id="podGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A2D149" />
        <stop offset="50%" stopColor="#7DAE2E" />
        <stop offset="100%" stopColor="#5A8F1C" />
      </linearGradient>
    </defs>
    {/* Oval ribbed pod */}
    <path d="M50,15 C20,35 20,65 50,85 C80,65 80,35 50,15 Z" fill="url(#podGrad)" />
    {/* Cardamom ribs/grooves */}
    <path d="M50,15 C38,35 38,65 50,85" fill="none" stroke="#BADA82" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
    <path d="M50,15 C62,35 62,65 50,85" fill="none" stroke="#BADA82" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
    <path d="M50,15 C45,35 45,65 50,85" fill="none" stroke="#5A8F1C" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    <path d="M50,15 C55,35 55,65 50,85" fill="none" stroke="#5A8F1C" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    {/* Stem tip */}
    <path d="M47,83 L53,83 L50,92 Z" fill="#5A8F1C" />
  </svg>
);

const StarAniseSvg = () => (
  <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-[0_8px_16px_rgba(139,69,19,0.4)]">
    <defs>
      <linearGradient id="aniseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#B05E3C" />
        <stop offset="50%" stopColor="#8E4624" />
        <stop offset="100%" stopColor="#5E2C14" />
      </linearGradient>
    </defs>
    {/* 8-pointed star shape */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
      <g key={i} transform={`rotate(${angle} 50 50)`}>
        {/* Point pod */}
        <path d="M50,50 L42,18 C45,10 55,10 58,18 Z" fill="url(#aniseGrad)" stroke="#4A200B" strokeWidth="1" />
        {/* Inner seed hole */}
        <ellipse cx="50" cy="25" rx="3" ry="5" fill="#3D1807" />
        {/* Shiny seed */}
        <ellipse cx="50" cy="25" rx="2" ry="3.5" fill="#E59866" />
      </g>
    ))}
    {/* Central hub connection */}
    <circle cx="50" cy="50" r="10" fill="#5E2C14" stroke="#3D1807" strokeWidth="2" />
    <circle cx="50" cy="50" r="4" fill="#B05E3C" />
  </svg>
);

const MaceSvg = () => (
  <svg viewBox="0 0 100 100" className="w-18 h-18 drop-shadow-[0_6px_12px_rgba(211,84,0,0.4)]">
    <defs>
      <linearGradient id="maceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E67E22" />
        <stop offset="50%" stopColor="#D35400" />
        <stop offset="100%" stopColor="#A04000" />
      </linearGradient>
    </defs>
    {/* Webbed organic branches */}
    <path d="M50,15 C45,25 35,30 30,25 C25,20 18,28 22,35 C26,42 35,45 40,40 C45,45 42,55 35,60 C28,65 30,75 38,72 C46,69 50,58 52,58 C54,58 58,69 66,72 C74,75 76,65 69,60 C62,55 59,45 64,40 C69,45 78,42 82,35 C86,28 79,20 74,25 C69,30 59,25 54,15 C52,10 48,10 50,15 Z" fill="url(#maceGrad)" stroke="#803000" strokeWidth="1.5" />
    <circle cx="52" cy="48" r="8" fill="#5C2E16" />
  </svg>
);

const MintSvg = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_6px_12px_rgba(46,204,113,0.3)]">
    <defs>
      <linearGradient id="mintGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#27AE60" />
        <stop offset="100%" stopColor="#2ECC71" />
      </linearGradient>
    </defs>
    {/* Leaf shape with jagged edges */}
    <path d="M50,85 C20,65 15,35 50,15 C85,35 80,65 50,85 Z" fill="url(#mintGrad)" />
    {/* Rib veins */}
    <path d="M50,15 L50,85" stroke="#A9DFBF" strokeWidth="2" strokeLinecap="round" />
    <path d="M50,35 Q35,30 25,32" fill="none" stroke="#A9DFBF" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M50,48 Q32,45 22,50" fill="none" stroke="#A9DFBF" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M50,60 Q35,60 28,70" fill="none" stroke="#A9DFBF" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M50,35 Q65,30 75,32" fill="none" stroke="#A9DFBF" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M50,48 Q68,45 78,50" fill="none" stroke="#A9DFBF" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M50,60 Q65,60 72,70" fill="none" stroke="#A9DFBF" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CuminSeedsSvg = () => (
  <svg viewBox="0 0 100 100" className="w-18 h-18 drop-shadow-[0_4px_8px_rgba(139,69,19,0.3)]">
    <defs>
      <linearGradient id="cuminGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8E6F56" />
        <stop offset="100%" stopColor="#5A4535" />
      </linearGradient>
    </defs>
    {/* Pile of 3 cumin seeds */}
    <g transform="rotate(15 45 45)">
      <path d="M15,45 C25,38 65,38 75,45 C65,52 25,52 15,45 Z" fill="url(#cuminGrad)" stroke="#3E3025" strokeWidth="1" />
      <path d="M25,45 L65,45" stroke="#B08D73" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 3" />
    </g>
    <g transform="rotate(-30 55 55)">
      <path d="M25,55 C35,48 75,48 85,55 C75,62 35,62 25,55 Z" fill="url(#cuminGrad)" stroke="#3E3025" strokeWidth="1" />
      <path d="M35,55 L75,55" stroke="#B08D73" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 3" />
    </g>
    <g transform="rotate(60 50 40)">
      <path d="M20,35 C30,28 70,28 80,35 C70,42 30,42 20,35 Z" fill="url(#cuminGrad)" stroke="#3E3025" strokeWidth="1" />
      <path d="M30,35 L70,35" stroke="#B08D73" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 3" />
    </g>
  </svg>
);

const GingerSvg = () => (
  <svg viewBox="0 0 100 100" className="w-18 h-18 drop-shadow-[0_6px_12px_rgba(202,156,97,0.35)]">
    <defs>
      <linearGradient id="gingerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E2C499" />
        <stop offset="60%" stopColor="#CA9C61" />
        <stop offset="100%" stopColor="#9C703C" />
      </linearGradient>
    </defs>
    {/* Knobby root shape */}
    <path d="M25,45 C20,38 32,25 45,35 C52,30 55,20 65,25 C75,30 70,45 60,50 C65,58 75,55 80,65 C85,75 70,85 55,75 C45,82 35,78 28,68 C22,62 18,52 25,45 Z" fill="url(#gingerGrad)" stroke="#805627" strokeWidth="1.5" />
    {/* Horizonal growth lines */}
    <path d="M24,52 Q28,48 34,53" fill="none" stroke="#9C703C" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M42,34 Q46,38 52,33" fill="none" stroke="#9C703C" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M58,26 Q60,32 64,30" fill="none" stroke="#9C703C" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M60,65 Q56,69 50,66" fill="none" stroke="#9C703C" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M72,69 Q75,73 70,76" fill="none" stroke="#9C703C" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const BlackSaltSvg = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_6px_12px_rgba(100,50,100,0.4)]">
    <defs>
      <linearGradient id="saltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D7BDE2" />
        <stop offset="40%" stopColor="#9B59B6" />
        <stop offset="100%" stopColor="#4A235A" />
      </linearGradient>
    </defs>
    {/* Geometric mineral crystals */}
    <polygon points="50,15 80,45 50,75 20,45" fill="url(#saltGrad)" stroke="#2E113C" strokeWidth="1.5" />
    <polygon points="50,15 65,45 50,75 35,45" fill="#7D3C98" opacity="0.6" />
    <polygon points="50,25 70,45 50,65 30,45" fill="#D7BDE2" opacity="0.4" />
    {/* Floating tiny crystals around */}
    <polygon points="20,15 30,25 20,35 10,25" fill="#9B59B6" transform="scale(0.6) translate(15, 15)" />
    <polygon points="85,65 95,75 85,85 75,75" fill="#4A235A" transform="scale(0.5) translate(80, 60)" />
  </svg>
);

const FennelSvg = () => (
  <svg viewBox="0 0 100 100" className="w-18 h-18 drop-shadow-[0_4px_8px_rgba(46,204,113,0.25)]">
    <defs>
      <linearGradient id="fennelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A9DFBF" />
        <stop offset="100%" stopColor="#1E8449" />
      </linearGradient>
    </defs>
    {/* Curved fennel seeds */}
    <g transform="rotate(-10 40 40)">
      <path d="M18,45 C28,32 68,32 78,45 C68,58 28,58 18,45 Z" fill="url(#fennelGrad)" stroke="#145A32" strokeWidth="1" />
      <path d="M28,45 L68,45" stroke="#F9E79F" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 4" />
    </g>
    <g transform="rotate(40 60 60)">
      <path d="M22,55 C32,42 72,42 82,55 C72,68 32,68 22,55 Z" fill="url(#fennelGrad)" stroke="#145A32" strokeWidth="1" />
      <path d="M32,55 L72,55" stroke="#F9E79F" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 4" />
    </g>
  </svg>
);

const CorianderSeedsSvg = () => (
  <svg viewBox="0 0 100 100" className="w-18 h-18 drop-shadow-[0_4px_8px_rgba(245,166,35,0.3)]">
    <defs>
      <linearGradient id="corianderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F5CBA7" />
        <stop offset="100%" stopColor="#B9770E" />
      </linearGradient>
    </defs>
    {/* Group of 3 tiny spherical grains */}
    <circle cx="35" cy="40" r="12" fill="url(#corianderGrad)" stroke="#7E5109" strokeWidth="1" />
    <path d="M35,28 L35,52" stroke="#FDF2E9" strokeWidth="1" strokeDasharray="2 2" />

    <circle cx="62" cy="48" r="14" fill="url(#corianderGrad)" stroke="#7E5109" strokeWidth="1" />
    <path d="M62,34 L62,62" stroke="#FDF2E9" strokeWidth="1" strokeDasharray="2 2" />

    <circle cx="48" cy="65" r="10" fill="url(#corianderGrad)" stroke="#7E5109" strokeWidth="1" />
    <path d="M48,55 L48,75" stroke="#FDF2E9" strokeWidth="1" strokeDasharray="2 2" />
  </svg>
);

// ━━━━ MASALA SPECIFIC INGREDIENTS DATA ━━━━

const MASALAS: MasalaData[] = [
  {
    name: 'Garam Masala',
    description: 'A deeply aromatic blend of sweet, floral, and woody whole spices ground to release rich warming essential oils.',
    color: '#D63220',
    ingredients: [
      {
        name: 'Cinnamon Bark',
        benefits: 'Promotes heart health, aids blood sugar regulation, and contains potent anti-inflammatory properties.',
        aroma: 'Sweet · Woody · Earthy spice',
        healthBoost: 'Heart Health & Digestion',
        renderSvg: () => <CinnamonSvg />,
        xOffset: -120,
        yOffset: -100,
      },
      {
        name: 'Whole Cloves',
        benefits: 'Rich in antioxidants, supports liver wellness, and provides natural antimicrobial action.',
        aroma: 'Intense · Medicinal · Sweet-pungent',
        healthBoost: 'Immune & Liver Support',
        renderSvg: () => <CloveSvg />,
        xOffset: 120,
        yOffset: -100,
      },
      {
        name: 'Black Pepper',
        benefits: 'Enhances nutrient absorption, improves metabolic function, and boosts cognitive processes.',
        aroma: 'Sharp · Hot · Forest pine',
        healthBoost: 'Metabolism Booster',
        renderSvg: () => <BlackPepperSvg />,
        xOffset: -120,
        yOffset: 100,
      },
      {
        name: 'Green Cardamom',
        benefits: 'Improves digestion, supports oral health, and helps lower blood pressure.',
        aroma: 'Floral · Minty · Warm citrus',
        healthBoost: 'Blood Pressure & Detox',
        renderSvg: () => <CardamomSvg />,
        xOffset: 120,
        yOffset: 100,
      },
    ],
  },
  {
    name: 'Chaat Masala',
    description: 'A tangy, zesty seasoning mix that sparks mouthwatering digestive enzymes in salads, fruits, and snacks.',
    color: '#27AE60',
    ingredients: [
      {
        name: 'Black Cumin',
        benefits: 'Promotes digestion, provides critical iron content, and assists with glycemic control.',
        aroma: 'Nutty · Smoky · Rich warmth',
        healthBoost: 'Digestion & Iron Enrichment',
        renderSvg: () => <CuminSeedsSvg />,
        xOffset: -120,
        yOffset: -100,
      },
      {
        name: 'Mint Leaves',
        benefits: 'Relieves symptoms of indigestion, improves breathing, and offers cooling herbal enzymes.',
        aroma: 'Cool · Herbal · Refreshing mint',
        healthBoost: 'Respiratory & Cooling relief',
        renderSvg: () => <MintSvg />,
        xOffset: 120,
        yOffset: -100,
      },
      {
        name: 'Knobby Ginger',
        benefits: 'Alleviates muscle soreness, reduces chronic nausea, and boosts core thermal energy.',
        aroma: 'Sharp · Zesty · Pungent fire',
        healthBoost: 'Muscle Recovery & Anti-Nausea',
        renderSvg: () => <GingerSvg />,
        xOffset: -120,
        yOffset: 100,
      },
      {
        name: 'Pink Black Salt',
        benefits: 'Treats heartburn, reduces abdominal flatulence, and is rich in essential mineral trace elements.',
        aroma: 'Sulphurous · Mineral-rich · Tangy salt',
        healthBoost: 'Heartburn & Gut Comfort',
        renderSvg: () => <BlackSaltSvg />,
        xOffset: 120,
        yOffset: 100,
      },
    ],
  },
  {
    name: 'Biryani Masala',
    description: 'A royal, exotic blend engineered to deliver majestic taste layers, converting simple rice into a banquet core.',
    color: '#F5A623',
    ingredients: [
      {
        name: 'Star Anise',
        benefits: 'Rich in shikimic acid (antiviral precursor), boosts general immunity, and eases breathing.',
        aroma: 'Licorice · Fennel-like · Aniseed sweet',
        healthBoost: 'Immunity & Antiviral barrier',
        renderSvg: () => <StarAniseSvg />,
        xOffset: -120,
        yOffset: -100,
      },
      {
        name: 'Nutmeg Mace',
        benefits: 'Improves cardiovascular circulation, mitigates joint pain, and stimulates digestive secretions.',
        aroma: 'Warm · Nutty · Fragrant lace',
        healthBoost: 'Circulation & Pain Relief',
        renderSvg: () => <MaceSvg />,
        xOffset: 120,
        yOffset: -100,
      },
      {
        name: 'Coriander Seeds',
        benefits: 'Lowers blood sugar, fights foodborne infections, and supports general heart health.',
        aroma: 'Mild · Citrusy · Sage-like',
        healthBoost: 'Heart Vitality & Glycemia',
        renderSvg: () => <CorianderSeedsSvg />,
        xOffset: -120,
        yOffset: 100,
      },
      {
        name: 'Fennel Seeds',
        benefits: 'Reduces fluid retention, purifies blood supply, and provides high levels of dietary fiber.',
        aroma: 'Anise-sweet · Fresh · Grassy warmth',
        healthBoost: 'Detox & Fluid Balance',
        renderSvg: () => <FennelSvg />,
        xOffset: 120,
        yOffset: 100,
      },
    ],
  },
];

export const SpiceJar3D = () => {
  const [activeMasalaIdx, setActiveMasalaIdx] = useState(0);
  const [selectedIngredientIdx, setSelectedIngredientIdx] = useState<number | null>(null);

  const activeMasala = MASALAS[activeMasalaIdx];

  const handleMasalaChange = (idx: number) => {
    setActiveMasalaIdx(idx);
    setSelectedIngredientIdx(null); // Reset active ingredient popover
  };

  return (
    <section className="relative w-full py-24 bg-[#0A0502] overflow-hidden border-t border-white/5 text-white">
      {/* Background visual element */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none spice-pattern" 
        aria-hidden="true" 
      />

      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-black tracking-[0.25em] uppercase text-[#D63220] block mb-2">
            Masala Anatomy
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-black text-white mb-4">
            3D Explore Ingredients
          </h2>
          <p className="text-white/40 text-sm max-w-md mx-auto">
            Select a heritage blend. Click any floating raw ingredient to discover its benefits.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center gap-2 mb-16 flex-wrap" role="tablist" aria-label="Explore Masalas">
          {MASALAS.map((masala, idx) => (
            <button
              key={masala.name}
              role="tab"
              aria-selected={activeMasalaIdx === idx}
              onClick={() => handleMasalaChange(idx)}
              className={`px-6 py-2.5 rounded-full text-xs font-bold border transition-all duration-300 ${
                activeMasalaIdx === idx
                  ? 'bg-white text-black border-transparent shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                  : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {masala.name}
            </button>
          ))}
        </div>

        {/* Main 3D Stage & details */}
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          
          {/* ━━━━ 3D SCENE CONTAINER (3 cols) ━━━━ */}
          <div className="lg:col-span-3 flex justify-center items-center h-[380px] md:h-[450px] relative">
            
            {/* Center Bowl/Masala Plate */}
            <div className="relative z-10 flex flex-col items-center">
              {/* Radial heat glow */}
              <div 
                className="absolute inset-0 rounded-full blur-2xl opacity-25 scale-150 transition-all duration-700" 
                style={{ backgroundColor: activeMasala.color }}
              />
              <div 
                className="w-40 h-40 rounded-full flex flex-col items-center justify-center relative shadow-[0_20px_50px_rgba(0,0,0,0.8)] border"
                style={{
                  background: 'linear-gradient(135deg, #1C0F0A 0%, #0A0502 100%)',
                  borderColor: `${activeMasala.color}33`,
                }}
              >
                {/* Spiced Heap Illustration */}
                <div 
                  className="w-24 h-24 rounded-full opacity-80 blur-sm scale-90 transition-all duration-700"
                  style={{
                    background: `radial-gradient(circle, ${activeMasala.color}ee 10%, ${activeMasala.color}33 70%)`
                  }}
                />
                <span className="absolute z-10 text-[10px] font-black tracking-widest text-white/60 uppercase">
                  {activeMasala.name}
                </span>
              </div>
            </div>

            {/* Floating 3D Ingredients */}
            {activeMasala.ingredients.map((ing, idx) => {
              const isSelected = selectedIngredientIdx === idx;
              
              return (
                <div
                  key={ing.name}
                  className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{
                    left: `calc(50% + ${ing.xOffset}px)`,
                    top: `calc(50% + ${ing.yOffset}px)`,
                  }}
                  onClick={() => setSelectedIngredientIdx(isSelected ? null : idx)}
                >
                  {/* Gentle Floating Motion */}
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 3 + idx * 0.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="flex flex-col items-center"
                  >
                    {/* Infinite Axis Rotation */}
                    <motion.div
                      animate={{
                        rotateY: 360,
                      }}
                      transition={{
                        duration: 8 + idx * 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="origin-center"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {ing.renderSvg()}
                    </motion.div>
                    
                    {/* Ingredient label */}
                    <div 
                      className={`mt-2 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wide transition-all ${
                        isSelected 
                          ? 'bg-white text-black border-transparent shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                          : 'bg-black/40 border-white/10 text-white/70 hover:bg-black/60'
                      }`}
                    >
                      {ing.name}
                    </div>
                  </motion.div>
                </div>
              );
            })}

          </div>

          {/* ━━━━ INGREDIENT DETAIL SIDEBAR (2 cols) ━━━━ */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedIngredientIdx !== null ? (
                <motion.div
                  key={selectedIngredientIdx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm relative"
                >
                  <button
                    onClick={() => setSelectedIngredientIdx(null)}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition"
                    aria-label="Close details"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2 mb-4 text-[#F5A623]">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-xs font-black tracking-widest uppercase">Ingredient Focus</span>
                  </div>

                  <h3 className="font-serif text-2xl font-black text-white mb-2">
                    {activeMasala.ingredients[selectedIngredientIdx].name}
                  </h3>
                  
                  <p className="text-white/40 text-xs font-bold tracking-wider uppercase mb-5">
                    Aroma: {activeMasala.ingredients[selectedIngredientIdx].aroma}
                  </p>

                  <p className="text-white/75 text-sm leading-relaxed mb-6 font-medium">
                    {activeMasala.ingredients[selectedIngredientIdx].benefits}
                  </p>

                  <div className="flex items-start gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <Heart className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-wider">Health Advantage</p>
                      <p className="text-xs text-white/55 mt-1 font-medium">
                        {activeMasala.ingredients[selectedIngredientIdx].healthBoost}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                // Hint state when no ingredient is selected
                <motion.div
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-[#D63220]/5 border border-[#D63220]/10 p-8 rounded-3xl backdrop-blur-sm text-center py-16"
                >
                  <AlertCircle className="w-10 h-10 text-[#D63220] mx-auto mb-4" />
                  <h3 className="font-serif text-xl font-bold text-white mb-2">No Ingredient Selected</h3>
                  <p className="text-white/50 text-sm max-w-xs mx-auto leading-relaxed">
                    Click any of the rotating spices floating around the plate on the left to learn about its nutritional value and medicinal benefits.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
};

export default SpiceJar3D;
