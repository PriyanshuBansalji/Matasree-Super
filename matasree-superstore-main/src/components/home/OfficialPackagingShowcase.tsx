import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, ShieldCheck, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PackagingItem {
  id: string;
  name: string;
  weight: string;
  image: string;
  badge: string;
  features: string[];
  description: string;
}

const PACKAGING_GALLERY: PackagingItem[] = [
  {
    id: 'box-garam',
    name: 'Garam Masala (100g Box)',
    weight: '100g Net Wt.',
    image: '/official-products/Garam Masala.png',
    badge: '16 Whole Spices Blend',
    features: ['Artisanal Mortar Ground', 'Zero Artificial Colors', 'High Essential Oils'],
    description: 'Blended using 16 rare whole spices including mace, nutmeg, and green cardamom for royal Mughlai aroma.',
  },
  {
    id: 'box-super-lal',
    name: 'Super Lal Tadka Red Chilli (100g Box)',
    weight: '100g Net Wt.',
    image: '/official-products/Super Lal Tadka 1.png',
    badge: 'Vibrant Natural Color',
    features: ['Stemless Whole Red Chilli', 'Cold Ground Flavor Lock', 'Rich Capsaicin Oil'],
    description: 'Ultra-vibrant red chilli powder for signature color and balanced pungent heat in every tadka.',
  },
  {
    id: 'box-kitchen-king',
    name: 'Kitchen King All-Purpose Masala (100g Box)',
    weight: '100g Net Wt.',
    image: '/official-products/Kitchen King 4.png',
    badge: 'Chef Favorite',
    features: ['Balanced Gravy Flavor', 'Rich Golden Color', 'Aroma Lock Technology'],
    description: 'The master kitchen seasoning for curries, dal, and gravies. Stone-ground at slow speeds for maximum flavor.',
  },
  {
    id: 'box-sampuran',
    name: 'Sampuran Masala (100g Box)',
    weight: '100g Net Wt.',
    image: '/official-products/Sampuran Masala 6.png',
    badge: 'All-in-One Secret Blend',
    features: ['Authentic Himalayan Recipe', 'Zero Fillers', 'Rich Aromatic Oils'],
    description: 'Our proprietary master blend perfected over decades to elevate everyday dishes with traditional aroma.',
  },
  {
    id: 'box-chaat',
    name: 'Chaat Masala (100g Box)',
    weight: '100g Net Wt.',
    image: '/official-products/Chaat Masala 6.png',
    badge: 'Zesty & Tangy',
    features: ['Black Salt & Hing', 'Dry Mango Punch', 'Digestive Spice Profile'],
    description: 'Crisp, tangy seasoning with roasted cumin, black salt, and dried mango for snacks and salads.',
  },
  {
    id: 'box-meat',
    name: 'Meat Masala (100g Box)',
    weight: '100g Net Wt.',
    image: '/official-products/Meat Masala 1.png',
    badge: 'Rich Gravy Master',
    features: ['Coarse Ground Spices', 'Deep Aroma & Color', 'Authentic Recipe'],
    description: 'Bold, robust spice blend specially crafted for deep, slow-cooked gravy and rich flavor infusion.',
  },
];

export const OfficialPackagingShowcase = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const activeItem = PACKAGING_GALLERY[selectedIdx];

  return (
    <section className="py-20 bg-gradient-to-b from-[#F8F3EC] via-[#FFFDF9] to-[#FAF6F0] relative overflow-hidden border-b border-[#3E2314]/5">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-200/15 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#FAF6F0] border border-[#C89B3C]/50 text-[#3E2314] text-xs font-bold uppercase tracking-widest mb-4 shadow-sm"
          >
            <span className="text-amber-700">✦</span>
            <span>Matasree Super Masale • Original Box Packaging</span>
            <span className="text-amber-700">✦</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl font-serif font-black text-[#3E2314] tracking-tight mb-4"
          >
            Original Factory Box Designs
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm sm:text-base font-serif text-[#3E2314]/80 font-medium"
          >
            Sourced directly from Himalayan foothills &amp; sealed in our Dehradun facility with aroma-lock technology.
          </motion.p>
        </div>

        {/* Packaging Selector Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {PACKAGING_GALLERY.map((item, idx) => {
            const isActive = idx === selectedIdx;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedIdx(idx)}
                className={`px-5 py-3 rounded-full text-xs font-bold transition-all duration-300 shadow-sm ${
                  isActive
                    ? 'bg-gradient-to-r from-red-700 to-amber-700 text-white shadow-md scale-105 border border-amber-400'
                    : 'bg-white/90 hover:bg-white text-[#3E2314] border border-amber-200/80 hover:border-amber-400'
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>

        {/* Active Packaging Spotlight Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="max-w-5xl mx-auto bg-white/90 backdrop-blur-md rounded-3xl border border-[#C89B3C]/40 p-6 sm:p-10 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
          >
            {/* Visual Box Render Frame */}
            <div className="relative flex items-center justify-center p-6 bg-gradient-to-br from-[#FAF6F0] to-[#F5EBE0] rounded-2xl border border-amber-200/60 shadow-inner group min-h-[320px]">
              <span className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-700 text-white shadow-sm">
                {activeItem.badge}
              </span>

              <img
                src={activeItem.image}
                alt={activeItem.name}
                className="max-h-80 w-auto object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Packaging Details Column */}
            <div>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-widest block mb-1">
                Authentic Product Packaging
              </span>

              <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#3E2314] mb-3 leading-tight">
                {activeItem.name}
              </h3>

              <p className="text-sm text-[#3E2314]/80 leading-relaxed mb-6 font-serif">
                "{activeItem.description}"
              </p>

              {/* Feature Highlights */}
              <div className="space-y-2.5 mb-8">
                {activeItem.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-2.5 text-xs font-bold text-[#3E2314]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-4 items-center">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#3E2314] text-amber-100 font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-red-700 transition-all hover:scale-105 active:scale-95"
                >
                  <span>Explore Product Range</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
