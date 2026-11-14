import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles, ShoppingBag, Star, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/use-toast';

interface SpiceItem {
  id: string;
  name: string;
  weight: string;
  price: number;
  rating: number;
  reviews: number;
  heatLevel: 1 | 2 | 3 | 0; // 0: Aromatic, 1: Mild, 2: Medium, 3: Fiery Hot
  heatLabel: string;
  description: string;
  image: string;
  color: string;
}

const SPICE_CATALOG: SpiceItem[] = [
  {
    id: 'kasuri-methi-01',
    name: 'Kashmiri Red Chilli Powder',
    weight: '500g',
    price: 250,
    rating: 4.9,
    reviews: 142,
    heatLevel: 2,
    heatLabel: 'Medium Spicy 🌶️🌶️',
    description: 'Vibrant natural ruby red color with mild-medium pungency. Cold-ground for maximum essential oils.',
    image: '/Whole Spice/—Pngtree—bowl of turmeric powder with_16791150.png',
    color: 'from-amber-500 to-red-600',
  },
  {
    id: 'turmeric-premium-02',
    name: 'Lakadong Turmeric Powder (5%+ Curcumin)',
    weight: '250g',
    price: 180,
    rating: 5.0,
    reviews: 98,
    heatLevel: 0,
    heatLabel: 'Aromatic & Golden 🌿',
    description: 'High curcumin content harvested from Meghalaya. Deep golden yellow with powerful immunity benefits.',
    image: '/Whole Spice/—Pngtree—bowl of turmeric powder with_16791150.png',
    color: 'from-amber-400 to-yellow-600',
  },
  {
    id: 'teja-chilli-03',
    name: 'Guntur Teja Fiery Chilli Powder',
    weight: '250g',
    price: 210,
    rating: 4.8,
    reviews: 84,
    heatLevel: 3,
    heatLabel: 'Fiery Hot 🌶️🌶️🌶️',
    description: 'For spice lovers who demand authentic fiery heat and rich aroma in traditional curries.',
    image: '/Whole Spice/vecteezy_ai-generated-black-pepper-png-isolated-on-transparent_37280071.png',
    color: 'from-red-600 to-rose-900',
  },
  {
    id: 'garam-masala-04',
    name: 'Royal Shahi Garam Masala',
    weight: '100g',
    price: 160,
    rating: 4.9,
    reviews: 215,
    heatLevel: 1,
    heatLabel: 'Warm & Fragrant 🌶️',
    description: 'Artisanal blend of 16 hand-picked whole spices including mace, nutmeg, and black cardamom.',
    image: '/Whole Spice/vecteezy_coriander-seeds-displayed-in-a-wooden-bowl-on-a-transparent_57176801.png',
    color: 'from-amber-700 to-amber-900',
  },
];

export const SpiceHeatMeterSection = () => {
  const [selectedHeat, setSelectedHeat] = useState<number | 'all'>('all');
  const addItem = useCartStore((state) => state.addItem);
  const { toast } = useToast();

  const filteredSpices = selectedHeat === 'all'
    ? SPICE_CATALOG
    : SPICE_CATALOG.filter((item) => item.heatLevel === selectedHeat);

  const handleAddToCart = (spice: SpiceItem) => {
    addItem({
      productId: spice.id,
      name: spice.name,
      price: spice.price,
      quantity: 1,
      image: spice.image,
      weight: spice.weight,
    });

    toast({
      title: 'Added to Cart! 🌶️',
      description: `${spice.name} (${spice.weight}) added to your basket.`,
    });
  };

  return (
    <section className="py-20 bg-gradient-to-b from-[#F8F3EC] via-[#FFFDF9] to-[#F8F3EC] relative overflow-hidden">
      {/* Background Decorative Ambient Orbs */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#FAF6F0] border border-[#C89B3C]/50 text-[#3E2314] text-xs font-bold uppercase tracking-widest mb-4 shadow-sm"
          >
            <span className="text-amber-700">✦</span>
            <span>Traditional Indian Masala Craft &amp; Heat Scale</span>
            <span className="text-amber-700">✦</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl font-serif font-black text-[#3E2314] tracking-tight mb-4"
          >
            Choose Your Preferred Pungency
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm sm:text-base font-serif text-[#3E2314]/80 font-medium"
          >
            Every batch is stone-ground at low temperatures to preserve natural essential oils and authentic Indian heat.
          </motion.p>
        </div>

        {/* Heat Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {[
            { id: 'all', label: 'All Spices ✨' },
            { id: 0, label: 'Aromatic & Golden 🌿' },
            { id: 1, label: 'Mild 🌶️' },
            { id: 2, label: 'Medium 🌶️🌶️' },
            { id: 3, label: 'Fiery Hot 🌶️🌶️🌶️' },
          ].map((tab) => {
            const isActive = selectedHeat === tab.id;
            return (
              <button
                key={tab.id.toString()}
                onClick={() => setSelectedHeat(tab.id as any)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 shadow-sm ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md scale-105'
                    : 'bg-white/80 hover:bg-white text-[#3E2314] border border-amber-200/80 hover:border-amber-400'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Spice Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredSpices.map((spice) => (
              <motion.div
                key={spice.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="group relative bg-white/90 backdrop-blur-md rounded-2xl border border-amber-100 p-5 shadow-card hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Heat Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-red-700 border border-red-200 shadow-sm">
                    {spice.heatLabel}
                  </span>
                </div>

                {/* Rating Badge */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm border border-amber-200 text-xs font-bold text-amber-900 shadow-sm">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{spice.rating}</span>
                </div>

                {/* Image */}
                <div className="w-full h-44 flex items-center justify-center p-4 my-2 relative">
                  <img
                    src={spice.image}
                    alt={spice.name}
                    className="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                </div>

                {/* Info */}
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#3E2314] leading-snug group-hover:text-red-600 transition-colors line-clamp-1 mb-1">
                    {spice.name}
                  </h3>
                  <p className="text-xs text-amber-900/60 font-medium line-clamp-2 mb-3">
                    {spice.description}
                  </p>
                </div>

                {/* Price & Action */}
                <div className="pt-3 border-t border-amber-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-amber-900/50 block font-medium">{spice.weight} Pack</span>
                    <span className="text-xl font-serif font-black text-red-600">₹{spice.price}</span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(spice)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* View All CTA */}
        <div className="text-center mt-12">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#3E2314] text-amber-100 font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-red-700 transition-all hover:scale-105 active:scale-95"
          >
            <span>Explore Entire Spice Store</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
