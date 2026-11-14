import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Sparkles, ChevronLeft, ChevronRight, Leaf, ShieldCheck, Info, Eye, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/useApi';

interface ProductShowcaseItem {
  id: string;
  name: string;
  hindiName: string;
  category: string;
  weight: string;
  price: number;
  originalPrice: number;
  rating: number;
  image: string;
  accentColor: string;
  tagline: string;
  description: string;
  ingredients: string[];
  keyBenefits: string[];
  recommendedFor: string;
  fssaiNo: string;
}

const SHOWCASE_PRODUCTS: ProductShowcaseItem[] = [
  {
    id: '6a6889ca4efaee4fd2fbfe0a',
    name: 'Premium Garam Masala',
    hindiName: 'गरम मसाला',
    category: 'Signature Blends',
    weight: '100g',
    price: 160,
    originalPrice: 190,
    rating: 4.9,
    image: '/transparent-products/garam-masala.png',
    accentColor: '#D63220',
    tagline: '16 Whole Spice Royal Blend with Mace & Pippali',
    description: 'Stone-ground heritage blend formulated with 16 hand-selected spices from Kerala & Himalayan foothills. Adds rich depth, warm aroma, and authentic Royal Shahi taste to curries.',
    ingredients: [
      'Cumin Seeds', 'Coriander Seeds', 'Black Pepper', 'Dry Ginger (Sonth)',
      'Cinnamon', 'Fennel Seeds (Saunf)', 'Black Cardamom (Badi Elaichi)',
      'Mace (Javitri)', 'Star Anise (Chakra Phool)', 'Red Chilli',
      'Nutmeg (Jaiphal)', 'Green Cardamom (Chhoti Elaichi)', 'Bay Leaf (Tejpatta)',
      'Cloves (Laung)', 'Long Pepper (Pippali)'
    ],
    keyBenefits: ['Cold-Ground Volatile Oil Lock', 'No Added Artificial Aromas', 'Micro-Batch Crafted in Dehradun'],
    recommendedFor: 'Shahi Paneer, Dal Makhani, Chicken Gravy, Biryani & Rich Curries',
    fssaiNo: '22626030001734'
  },
  {
    id: '6a6889ca4efaee4fd2fbfe0b',
    name: 'Premium Kitchen King',
    hindiName: 'किचन किंग मसाला',
    category: 'All-Purpose Seasoning',
    weight: '100g',
    price: 150,
    originalPrice: 180,
    rating: 4.8,
    image: '/transparent-products/kitchen-king.png',
    accentColor: '#E65C19',
    tagline: 'Master Curry Seasoning with Hing & Amchur',
    description: 'The supreme all-in-one seasoning blend designed to elevate everyday vegetables, lentils, and gravies. Perfectly balanced spices ground at low temperatures.',
    ingredients: [
      'Coriander Seeds', 'Cumin Seeds', 'Yellow Mustard Seeds', 'Poppy Seeds (Khas Khas)',
      'Black Pepper', 'Fennel Seeds', 'Black Salt', 'Turmeric (Haldi)',
      'Nutmeg', 'Red Chilli', 'Badi Elaichi Husk', 'Bay Leaves',
      'Mace', 'Star Anise', 'Green Cardamom', 'Cinnamon',
      'Garlic', 'Fenugreek Seeds', 'Dry Mango Powder (Amchur)', 'Asafoetida (Hing)'
    ],
    keyBenefits: ['Versatile Everyday Spice', 'Rich Gravy Thickening Blend', '100% Pure Sourced'],
    recommendedFor: 'Mix Veg, Aloo Gobi, Chole, Paneer Gravy & Daily Sabzi',
    fssaiNo: '22626030001734'
  },
  {
    id: '6a6889ca4efaee4fd2fbfe0c',
    name: 'Premium Chaat Masala',
    hindiName: 'चाट मसाला',
    category: 'Tangy Snacks Seasoning',
    weight: '100g',
    price: 130,
    originalPrice: 150,
    rating: 4.9,
    image: '/transparent-products/chaat-masala.png',
    accentColor: '#C89B3C',
    tagline: 'Chatpata Tangy Blend with Ajwain & Satrik',
    description: 'Zesty and mouth-watering chatpata masala crafted with dry mango powder, black salt, and roasted carom seeds. Adds instantaneous tanginess to street foods and snacks.',
    ingredients: [
      'Black Salt (Kala Namak)', 'Iodised Salt', 'Coriander Seeds', 'Cumin Seeds',
      'Black Pepper', 'Dry Mango Powder (Amchur)', 'Red Chilli', 'Citric Acid (Satrik)',
      'Dry Ginger (Sonth)', 'Carom Seeds (Ajwain)', 'Sugar', 'Kasuri Methi',
      'Asafoetida (Hing)', 'Fennel Seeds'
    ],
    keyBenefits: ['Instant Chatpata Zing', 'Digestive Ajwain & Hing', 'Salad & Snack Enhancer'],
    recommendedFor: 'Pani Puri, Fruit Salads, Dahi Bhalla, Samosa & Grilled Snacks',
    fssaiNo: '22626030001734'
  },
  {
    id: '6a6889ca4efaee4fd2fbfe0d',
    name: 'Premium Meat Masala',
    hindiName: 'मीट मसाला',
    category: 'Rich Non-Veg Masalas',
    weight: '100g',
    price: 170,
    originalPrice: 200,
    rating: 4.8,
    image: '/transparent-products/meat-masala.png',
    accentColor: '#B22222',
    tagline: 'Infused with Bairki Himalayan Spice & Kachri',
    description: 'Robust non-veg spice mix enriched with authentic Himalayan Bairki spice, tenderizing Kachri powder, and Rock Salt (Sendha Namak) for succulent, flavorful meat curries.',
    ingredients: [
      'Cumin Seeds', 'Bay Leaf', 'Green Cardamom', 'Red Chilli',
      'Bairki (Himalayan Spice)', 'Turmeric', 'Dry Ginger', 'Black Cardamom',
      'Black Pepper', 'Cloves', 'Garlic', 'Rock Salt (Sendha Namak)',
      'Black Salt', 'Fennel Seeds', 'Nutmeg', 'Poppy Seeds',
      'Kachri Powder', 'Mace', 'Cinnamon', 'Fenugreek Seeds',
      'Kasuri Methi', 'Dry Mango Powder', 'Coriander Seeds'
    ],
    keyBenefits: ['Natural Meat Tenderizing Kachri', 'Authentic Himalayan Bairki Spice', 'Deep Rich Color'],
    recommendedFor: 'Mutton Curry, Chicken Korma, Keema & Slow-Cooked Gravies',
    fssaiNo: '22626030001734'
  },
  {
    id: '6a6889ca4efaee4fd2fbfe0e',
    name: 'Premium Sampuran Masala',
    hindiName: 'संपूर्ण मसाला',
    category: 'Heritage All-In-One',
    weight: '100g',
    price: 160,
    originalPrice: 190,
    rating: 4.9,
    image: '/transparent-products/sampuran-masala.png',
    accentColor: '#8B4513',
    tagline: 'Crafted with Himalayan Jakhiya Wild Mustard',
    description: 'Our signature complete spice formulation featuring rare Himalayan Jakhiya seeds (Wild Mustard), garlic, and onion. A complete single-spoon solution for authentic Uttarakhand curries.',
    ingredients: [
      'Turmeric', 'Red Chilli', 'Coriander Seeds', 'Cumin Seeds',
      'Black Pepper', 'Dry Ginger', 'Bay Leaves', 'Cloves',
      'Cinnamon', 'Nutmeg', 'Cardamom', 'Garlic',
      'Onion', 'Kasuri Methi', 'Jakhiya Seeds (Wild Himalayan Mustard)'
    ],
    keyBenefits: ['Rare Jakhiya Wild Mustard Flavor', 'Complete All-In-One Blend', 'No Other Spices Needed'],
    recommendedFor: 'Pahari Curries, Rajma, Chana Masala & Special Family Gravies',
    fssaiNo: '22626030001734'
  },
  {
    id: '6a6889ca4efaee4fd2fbfe0f',
    name: 'Premium Super Lal Tadka',
    hindiName: 'सुपर लाल तड़का',
    category: 'Pure Ground Spices',
    weight: '100g',
    price: 180,
    originalPrice: 210,
    rating: 4.9,
    image: '/transparent-products/super-lal-tadka.png',
    accentColor: '#DC143C',
    tagline: '100% Pure Cold-Ground Fiery Red Chilli',
    description: 'Vibrant ruby red chilli powder ground from sun-dried select whole red chillies. Provides deep natural red color and a fiery traditional tadka heat.',
    ingredients: ['100% Pure Whole Red Chilli'],
    keyBenefits: ['Natural Ruby Red Color', 'Cold-Milled Flavor Preservation', 'Zero Added Color or Solvents'],
    recommendedFor: 'Dal Tadka, Curry Gravies, Marinades & Spicy Chutneys',
    fssaiNo: '22626030001734'
  },
  {
    id: '6a6889ca4efaee4fd2fbfe10',
    name: 'Premium Kasoori Methi',
    hindiName: 'कस्तूरी मेथी',
    category: 'Himalayan Herbs',
    weight: '25g',
    price: 90,
    originalPrice: 110,
    rating: 5.0,
    image: '/transparent-products/kasoori-methi.png',
    accentColor: '#2E8B57',
    tagline: 'Aromatic Sun-Dried Himalayan Fenugreek Leaves',
    description: 'Fragrant fenugreek leaves harvested from Himalayan foothill farms and gently sun-dried to lock in essential oils. Crush over hot dishes for restaurant-style aroma.',
    ingredients: ['100% Pure Sun-Dried Kasoori Methi Leaves'],
    keyBenefits: ['Intense Natural Aroma', 'Clean Hand-Picked Leaves', 'Restaurant Style Finish'],
    recommendedFor: 'Paneer Butter Masala, Malai Kofta, Parathas & Dal Makhani',
    fssaiNo: '22626030001734'
  },
  {
    id: '6a6889ca4efaee4fd2fbfe11',
    name: 'Premium Mango Achar Masala (200g Box)',
    hindiName: 'आम का अचार मसाला',
    category: 'Pickle & Seasoning',
    weight: '200g',
    price: 140,
    originalPrice: 170,
    rating: 4.8,
    image: '/transparent-products/mango-achar-masala.png',
    accentColor: '#D2691E',
    tagline: 'Traditional Recipe with Mustard Oil & Kalonji',
    description: 'Authentic Indian grandmother recipe pickle seasoning with coarse Methi Kuti, Saunf, Kalonji, and pure mustard oil infusion for mouthwatering home-made mango pickles.',
    ingredients: [
      'Iodised Salt', 'Aniseed (Saunf)', 'Kuti Fenugreek (Methi Kuti)',
      'Red Chilli Kuti', 'Red Chilli Powder', 'Haldi Powder',
      'Mustard Oil', 'Kalonji (Nigella)', 'Yellow Mustard'
    ],
    keyBenefits: ['Traditional Grandma Recipe', 'Mustard Oil Pre-Infused', 'Perfect Pickle Fermentation'],
    recommendedFor: 'Raw Mango Pickles, Stuffed Red Chilli & Mix Veg Pickle',
    fssaiNo: '22626030001734'
  },
  {
    id: '6a6889ca4efaee4fd2fbfe12',
    name: 'Premium  Mix Achar Masala (100g Box)',
    hindiName: 'मिक्स अचार मसाला',
    category: 'Pickle & Seasoning',
    weight: '100g',
    price: 130,
    originalPrice: 150,
    rating: 4.7,
    image: '/transparent-products/mix-achar-masala.png',
    accentColor: '#DAA520',
    tagline: 'Coarse Ground Rai, Saunf & Hing Blend',
    description: 'Multi-use pickle spice mix for instant and aged pickles. Ground coarse to allow spice oils to penetrate lemon, green chilli, and seasonal vegetable pickles.',
    ingredients: [
      'Yellow Mustard Seeds', 'Coriander Seeds', 'Black Mustard (Rai)',
      'Fennel Seeds', 'Fenugreek Seeds', 'Red Chilli Powder',
      'Turmeric Powder', 'Asafoetida (Hing)', 'Kalonji', 'Black Pepper', 'Mustard Oil'
    ],
    keyBenefits: ['Multi-Vegetable Compatibility', 'Coarse Oil-Absorbing Texture', 'Long Lasting Freshness'],
    recommendedFor: 'Lemon Pickle, Green Chilli Pickle, Gobi-Shalgam & Amla Pickle',
    fssaiNo: '22626030001734'
  }
];

export const InteractiveSpiceShowcase = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);

  // Fetch live products from backend to get live price & originalPrice set in Admin
  const { data: apiResponse } = useProducts();

  const liveProductsMap = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(apiResponse)) {
      list = apiResponse;
    } else if (Array.isArray((apiResponse as any)?.data?.data)) {
      list = (apiResponse as any).data.data;
    } else if (Array.isArray((apiResponse as any)?.data)) {
      list = (apiResponse as any).data;
    }

    const map = new Map<string, any>();
    if (Array.isArray(list)) {
      list.forEach((p) => {
        if (p && p.name) {
          const cleanKey = String(p.name).toLowerCase().trim();
          map.set(cleanKey, p);
        }
      });
    }
    return map;
  }, [apiResponse]);

  // Dynamically merge live admin price & originalPrice with showcase items
  const dynamicShowcaseProducts = useMemo(() => {
    const rawList: any[] = Array.isArray(apiResponse)
      ? apiResponse
      : Array.isArray((apiResponse as any)?.data?.data)
      ? (apiResponse as any).data.data
      : Array.isArray((apiResponse as any)?.data)
      ? (apiResponse as any).data
      : [];

    return SHOWCASE_PRODUCTS.map((item) => {
      // Fuzzy match product by ID or title key from live MongoDB database
      const matched = rawList.find(
        (p: any) =>
          p._id === item.id ||
          (p.name && p.name.toLowerCase().includes(item.name.toLowerCase().split(' ')[0])) ||
          (p.name && item.name.toLowerCase().includes(p.name.toLowerCase()))
      );

      if (matched && typeof matched.price === 'number' && matched.price > 0) {
        return {
          ...item,
          id: matched._id || item.id,
          price: matched.price,
          originalPrice: typeof matched.originalPrice === 'number' && matched.originalPrice > 0 ? matched.originalPrice : null,
          weight: matched.weight || item.weight,
          hasLivePrice: true,
        };
      }
      return {
        ...item,
        price: null,
        originalPrice: null,
        hasLivePrice: false,
      };
    });
  }, [apiResponse]);

  const current = dynamicShowcaseProducts[activeIndex] || SHOWCASE_PRODUCTS[0];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % dynamicShowcaseProducts.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + dynamicShowcaseProducts.length) % dynamicShowcaseProducts.length);
  };

  return (
    <section className="py-24 bg-gradient-to-b from-[#FFFDF9] via-[#FAF5EE] to-[#FFFDF9] relative overflow-hidden border-y border-amber-200/40">
      {/* Decorative Golden Rays Backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle,rgba(214,50,32,0.05)_0%,rgba(200,155,60,0.03)_50%,transparent_70%)] pointer-events-none -z-10" />

      <div className="container mx-auto px-4 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 via-red-500/10 to-amber-500/10 border border-amber-400/40 px-5 py-2 rounded-full shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-700 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-amber-900 text-xs font-black tracking-widest uppercase">OFFICIAL PACKAGING CATALOG</span>
          </div>

          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-black text-[#3E2314] leading-tight">
            Crafted for <span className="text-[#D63220] italic bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#C89B3C] bg-clip-text text-transparent">Culinary Royalty</span>
          </h2>
          
          <p className="text-slate-700 text-base md:text-lg font-semibold leading-relaxed">
            Explore our 100% stone-ground spice range with full ingredient transparency, sourced directly from Clement Town, Dehradun.
          </p>

          <div className="w-24 h-1 bg-gradient-to-r from-[#D63220] via-amber-500 to-[#C89B3C] rounded-full mx-auto" />
        </div>

        {/* Master Showcase Grid (3D Spotlight + Data Panel) */}
        <div className="grid lg:grid-cols-12 gap-8 items-center bg-white rounded-[2.5rem] border-2 border-[#C89B3C]/30 p-6 md:p-10 shadow-[0_25px_70px_rgba(62,35,20,0.08)] relative">
          
          {/* LEFT 5 COLS: 3D Transparent Floating Pack Spotlight */}
          <div className="lg:col-span-5 relative flex flex-col items-center justify-center min-h-[420px] bg-gradient-to-b from-[#FAF6F0] via-[#F7EFE5] to-[#F5EBE0] rounded-3xl border border-[#C89B3C]/30 p-8 overflow-hidden group">
            
            {/* Background Glow Orb */}
            <motion.div 
              className="absolute w-72 h-72 rounded-full blur-3xl opacity-40 pointer-events-none"
              style={{ backgroundColor: current.accentColor }}
              animate={{ scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* FSSAI Badge */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-200 shadow-sm flex items-center gap-1.5 z-20">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-black text-slate-800 tracking-wider uppercase">FSSAI LIC. 22626030001734</span>
            </div>

            {/* Discount Tag */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-red-600 to-amber-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-md z-20">
              SAVE 15% OFF
            </div>

            {/* 3D Floating Pack Image with AnimatePresence */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 30, scale: 0.85, rotate: -5 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, y: -30, scale: 0.85, rotate: 5 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-[280px] aspect-square flex items-center justify-center cursor-pointer"
              >
                <Link to={`/product/${current.id}`} className="w-full h-full flex items-center justify-center" title={`View ${current.name} details`}>
                  <img
                    src={current.image}
                    alt={current.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.25)] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-2 cursor-pointer"
                  />
                </Link>
              </motion.div>
            </AnimatePresence>

            {/* Pack Shadow */}
            <div className="w-44 h-5 bg-black/15 rounded-full blur-md mt-4 pointer-events-none" />

            {/* Controls Prev/Next */}
            <div className="flex items-center justify-between w-full mt-6 z-20">
              <button
                onClick={handlePrev}
                className="w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-800 border border-amber-200 shadow-md flex items-center justify-center hover:scale-110 transition-all duration-300"
                aria-label="Previous product"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="text-center">
                <span className="text-xs font-black text-amber-900 uppercase tracking-widest block">
                  {activeIndex + 1} / {SHOWCASE_PRODUCTS.length}
                </span>
                <span className="text-[10px] font-bold text-slate-500">Dehradun Micro-Batch</span>
              </div>

              <button
                onClick={handleNext}
                className="w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-800 border border-amber-200 shadow-md flex items-center justify-center hover:scale-110 transition-all duration-300"
                aria-label="Next product"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* RIGHT 7 COLS: Detailed Official Product Information & Ingredients Breakdown */}
          <div className="lg:col-span-7 space-y-6">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* Title & Category Row */}
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <Badge className="bg-[#3E2314] text-amber-300 text-xs px-3 py-1 font-bold tracking-wider uppercase">
                      {current.category}
                    </Badge>
                    <span className="text-xs font-serif font-black text-amber-800">
                      {current.hindiName}
                    </span>
                    <div className="flex items-center gap-1 bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full ml-auto">
                      <Star className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
                      <span>{current.rating} Rating</span>
                    </div>
                  </div>

                  <h3 className="font-serif text-3xl md:text-4xl font-black text-[#3E2314] leading-tight">
                    {current.name}
                  </h3>
                  
                  <p className="text-sm font-bold text-amber-800 mt-1">
                    ✦ {current.tagline}
                  </p>
                </div>

                {/* Description */}
                <p className="text-slate-700 text-sm leading-relaxed font-medium bg-amber-50/50 border-l-4 border-[#C89B3C] p-3.5 rounded-r-xl">
                  {current.description}
                </p>

                {/* Price & Weight Box */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#FAF6F0] rounded-2xl border border-amber-200/60">
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Official Pack Weight</span>
                    <span className="text-base font-black text-[#3E2314]">{current.weight} Sealed Box</span>
                  </div>

                  {current.hasLivePrice && current.price ? (
                    <div className="text-right">
                      <div className="flex items-baseline gap-2">
                        <span className="font-serif text-3xl font-black text-[#D63220]">₹{current.price}</span>
                        {current.originalPrice && current.originalPrice > current.price && (
                          <span className="text-sm text-slate-400 line-through font-semibold">₹{current.originalPrice}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 block">Live Price • Free Delivery</span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3.5 py-1.5 rounded-full block">
                        Dehradun Factory Direct
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 block mt-1">Check Live Price in Product Details</span>
                    </div>
                  )}
                </div>

                {/* Ingredients Accordion / List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-sm font-bold text-[#3E2314] uppercase tracking-wider flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-emerald-600" />
                      Official Ingredients Composition (From Pack):
                    </h4>
                    <button
                      onClick={() => setShowIngredients(!showIngredients)}
                      className="text-xs text-[#D63220] font-bold hover:underline"
                    >
                      {showIngredients ? 'Show Less' : `View All (${current.ingredients.length})`}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(showIngredients ? current.ingredients : current.ingredients.slice(0, 8)).map((ing, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-white border border-amber-200/80 rounded-lg text-xs font-semibold text-slate-800 shadow-sm flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D63220]" />
                        {ing}
                      </span>
                    ))}
                    {!showIngredients && current.ingredients.length > 8 && (
                      <span className="px-3 py-1 bg-amber-100/80 text-amber-900 rounded-lg text-xs font-bold">
                        +{current.ingredients.length - 8} More Spices
                      </span>
                    )}
                  </div>
                </div>

                {/* Recommended Culinary Usage */}
                <div className="flex items-start gap-2 bg-emerald-50/70 border border-emerald-200/60 p-3 rounded-xl text-xs font-semibold text-emerald-950">
                  <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-emerald-900">Recommended Culinary Usage:</span>
                    <span>{current.recommendedFor}</span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="pt-2">
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-[#D63220] hover:from-amber-700 hover:to-red-700 text-white font-serif font-black tracking-wide py-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Link to={`/product/${current.id}`}>
                      <Eye className="w-5 h-5" />
                      View Product &amp; Order Details ({current.weight})
                      <ArrowRight className="w-5 h-5 ml-1" />
                    </Link>
                  </Button>
                </div>

              </motion.div>
            </AnimatePresence>

          </div>
        </div>

        {/* Thumbnails Quick Switcher Strip */}
        <div className="mt-12 overflow-x-auto pb-4 scrollbar-none">
          <div className="flex justify-start md:justify-center items-center gap-4 min-w-max px-4">
            {dynamicShowcaseProducts.map((prod, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={prod.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`flex items-center gap-3 p-2.5 pr-5 rounded-2xl border transition-all duration-300 ${
                    isSelected
                      ? 'bg-white border-2 border-[#D63220] shadow-lg scale-105'
                      : 'bg-white/70 border-amber-200/60 hover:bg-white hover:border-amber-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-50 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img src={prod.image} alt={prod.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="text-left">
                    <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-[#D63220]' : 'text-slate-800'}`}>
                      {prod.name}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500">
                      {prod.hasLivePrice && prod.price ? `₹${prod.price} • ` : ''}{prod.weight}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

export default InteractiveSpiceShowcase;
