import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Clock, Flame, ShoppingBag, CheckCircle2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface RecipeItem {
  id: string;
  dishName: string;
  cuisine: string;
  prepTime: string;
  spiceRating: string;
  heroImage: string;
  recommendedSpices: Array<{
    id: string;
    name: string;
    price: number;
    weight: string;
  }>;
  instructionsSnippet: string;
}

const RECIPE_LIST: RecipeItem[] = [
  {
    id: 'rec-01',
    dishName: 'Authentic Hyderabadi Dum Biryani',
    cuisine: 'Royal Mughlai',
    prepTime: '45 mins',
    spiceRating: 'Aromatic & Medium Spicy',
    heroImage: '/poster.png',
    recommendedSpices: [
      { id: 'garam-masala-04', name: 'Royal Shahi Garam Masala', price: 160, weight: '100g' },
      { id: 'kasuri-methi-01', name: 'Kashmiri Red Chilli Powder', price: 250, weight: '500g' },
    ],
    instructionsSnippet: 'Layer basmati rice with marinated chicken/veggies and sprinkle Matasree Shahi Garam Masala for unforgettable aroma.',
  },
  {
    id: 'rec-02',
    dishName: 'Dal Tadka Dhaba Style',
    cuisine: 'North Indian Heritage',
    prepTime: '25 mins',
    spiceRating: 'Mild & Golden Aromatic',
    heroImage: '/poster.png',
    recommendedSpices: [
      { id: 'turmeric-premium-02', name: 'Lakadong Turmeric Powder (5%+ Curcumin)', price: 180, weight: '250g' },
      { id: 'cumin-whole', name: 'Whole Cumin Seeds (Jeera)', price: 140, weight: '200g' },
    ],
    instructionsSnippet: 'Tempered in pure ghee with whole cumin and high-curcumin Lakadong turmeric for vibrant color and gut-healing goodness.',
  },
  {
    id: 'rec-03',
    dishName: 'Kashmiri Rajma Masala',
    cuisine: 'Himachal & Kashmir Specialty',
    prepTime: '35 mins',
    spiceRating: 'Rich Gravy & Medium Heat',
    heroImage: '/poster.png',
    recommendedSpices: [
      { id: 'kasuri-methi-01', name: 'Kashmiri Red Chilli Powder', price: 250, weight: '500g' },
      { id: 'garam-masala-04', name: 'Royal Shahi Garam Masala', price: 160, weight: '100g' },
    ],
    instructionsSnippet: 'Slow-cooked kidney beans in a tomato-onion reduction infused with vibrant Kashmiri red chilli and whole cardamom.',
  },
];

export const RecipeDishMatcher = () => {
  const [activeRecipeIndex, setActiveRecipeIndex] = useState(0);
  const addItem = useCartStore((state) => state.addItem);
  const { toast } = useToast();

  const activeRecipe = RECIPE_LIST[activeRecipeIndex];

  const handleAddBundle = () => {
    activeRecipe.recommendedSpices.forEach((spice) => {
      addItem({
        productId: spice.id,
        name: spice.name,
        price: spice.price,
        quantity: 1,
        image: '/Whole Spice/—Pngtree—bowl of turmeric powder with_16791150.png',
        weight: spice.weight,
      });
    });

    toast({
      title: 'Recipe Combo Added! 🍳',
      description: `All ${activeRecipe.recommendedSpices.length} spices for "${activeRecipe.dishName}" added to your cart.`,
    });
  };

  return (
    <section className="py-20 bg-[#3E2314] text-amber-50 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#2A160A] border border-[#C89B3C]/50 text-amber-300 text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
            <span className="text-amber-400">✦</span>
            <span>Heritage Culinary Recipe Pairings</span>
            <span className="text-amber-400">✦</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif font-black text-amber-100 tracking-tight mb-4">
            Traditional Indian Dish &amp; Masala Guide
          </h2>
          <p className="text-sm sm:text-base font-serif text-amber-200/80 font-medium">
            Select a classic Indian dish to discover authentic stone-ground Matasree spice blends perfected over generations.
          </p>
        </div>

        {/* Recipe Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {RECIPE_LIST.map((rec, idx) => {
            const isActive = idx === activeRecipeIndex;
            return (
              <button
                key={rec.id}
                onClick={() => setActiveRecipeIndex(idx)}
                className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg scale-105 border border-red-400'
                    : 'bg-amber-950/50 hover:bg-amber-900/40 text-amber-200/80 border border-amber-800/40'
                }`}
              >
                {rec.dishName}
              </button>
            );
          })}
        </div>

        {/* Active Recipe Display Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRecipe.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto bg-amber-950/40 backdrop-blur-xl border border-amber-800/50 rounded-3xl p-6 sm:p-10 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
          >
            {/* Details Column */}
            <div>
              <div className="flex items-center gap-3 mb-3 text-xs font-bold text-amber-400">
                <span className="flex items-center gap-1 bg-amber-900/80 px-3 py-1 rounded-full border border-amber-700/60">
                  <Clock className="w-3.5 h-3.5" />
                  {activeRecipe.prepTime}
                </span>
                <span className="flex items-center gap-1 bg-amber-900/80 px-3 py-1 rounded-full border border-amber-700/60">
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  {activeRecipe.spiceRating}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-serif font-black text-amber-100 mb-3 leading-tight">
                {activeRecipe.dishName}
              </h3>

              <p className="text-xs sm:text-sm text-amber-200/80 leading-relaxed mb-6 font-medium bg-amber-900/30 p-4 rounded-2xl border border-amber-800/30">
                "{activeRecipe.instructionsSnippet}"
              </p>

              {/* Spices Included */}
              <div className="mb-6">
                <h4 className="text-xs uppercase tracking-widest font-black text-amber-400 mb-3">
                  Essential Matasree Spices Needed:
                </h4>
                <div className="space-y-2">
                  {activeRecipe.recommendedSpices.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-amber-900/50 border border-amber-800/60 text-xs font-bold text-amber-100"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>{s.name} ({s.weight})</span>
                      </div>
                      <span className="text-amber-400 font-serif font-black text-sm">₹{s.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleAddBundle}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-98 transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add Recipe Spice Combo to Cart</span>
              </button>
            </div>

            {/* Visual Column */}
            <div className="relative flex items-center justify-center">
              <div className="w-full h-80 rounded-2xl overflow-hidden border border-amber-700/40 relative shadow-2xl group">
                <img
                  src={activeRecipe.heroImage}
                  alt={activeRecipe.dishName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#3E2314] via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-amber-950/80 backdrop-blur-md border border-amber-700/60 text-center">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-widest block mb-1">
                    Authentic Recipe Pairings
                  </span>
                  <span className="text-sm font-serif font-black text-amber-100">
                    100% Pure Cold Ground Spices
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* View All Recipes Link */}
        <div className="text-center mt-12">
          <Link
            to="/recipes"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-300 hover:text-amber-100 transition-colors"
          >
            <span>View All Culinary Recipes & Guides</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
