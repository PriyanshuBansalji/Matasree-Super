/**
 * SpiceGuidePage
 *
 * Interactive spice guide where visitors can browse spices by region,
 * flavor profile, and culinary use. Each spice card links to associated
 * products via product tags.
 *
 * Requirements: 16.2, 16.5
 */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, MapPin, Flame, UtensilsCrossed, Tag, Search, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHelmet from '@/components/PageHelmet';
import CartDrawer from '@/components/CartDrawer';
import { Button } from '@/components/ui/button';

// ── Types ────────────────────────────────────────────────────

type SpiceRegion = 'North Indian' | 'South Indian' | 'Bengali' | 'Rajasthani' | 'Other';
type FlavorProfile = 'spicy' | 'tangy' | 'aromatic' | 'earthy' | 'bitter' | 'sweet' | 'pungent';
type CulinaryUse = 'curries' | 'rice dishes' | 'marinades' | 'tempering' | 'pickling' | 'desserts' | 'bread & rotis';

interface Spice {
  id: string;
  name: string;
  region: SpiceRegion;
  flavorProfiles: FlavorProfile[];
  culinaryUses: CulinaryUse[];
  description: string;
  image: string;
  productTags: string[];
}

// ── Spice Data ───────────────────────────────────────────────

// ── Spice Data with Original Local Photos ───────────────────

const SPICES: Spice[] = [
  {
    id: 'turmeric',
    name: 'Turmeric (Haldi)',
    region: 'North Indian',
    flavorProfiles: ['earthy', 'bitter'],
    culinaryUses: ['curries', 'rice dishes', 'marinades'],
    description:
      'The golden spice of India, turmeric imparts a warm, earthy flavor and vibrant yellow hue. Cold-ground from high-curcumin roots to preserve natural essential oils.',
    image: '/Whole Spice/—Pngtree—bowl of turmeric powder with_16791150.png',
    productTags: ['turmeric', 'haldi', 'golden spice'],
  },
  {
    id: 'cumin',
    name: 'Cumin (Jeera)',
    region: 'North Indian',
    flavorProfiles: ['earthy', 'aromatic'],
    culinaryUses: ['curries', 'rice dishes', 'tempering'],
    description:
      'Cumin seeds are the backbone of North Indian cooking. Their warm, nutty, slightly peppery flavor forms the base of countless spice blends and tadkas.',
    image: '/Whole Spice/vecteezy_ai-generated-dried-cumin-seeds-in-wooden-spoon-png_41167200.png',
    productTags: ['cumin', 'jeera', 'cumin seeds'],
  },
  {
    id: 'black-pepper',
    name: 'Black Pepper (Kali Mirch)',
    region: 'South Indian',
    flavorProfiles: ['spicy', 'aromatic', 'pungent'],
    culinaryUses: ['curries', 'marinades', 'tempering'],
    description:
      'Known as the "King of Spices," black pepper delivers sharp heat and complex aroma. Essential in royal garam masala, Chettinad cuisine, and curry marinades.',
    image: '/Whole Spice/vecteezy_ai-generated-black-pepper-png-isolated-on-transparent_37280071.png',
    productTags: ['black pepper', 'kali mirch', 'pepper'],
  },
  {
    id: 'cardamom',
    name: 'Green Cardamom (Elaichi)',
    region: 'North Indian',
    flavorProfiles: ['aromatic', 'sweet'],
    culinaryUses: ['rice dishes', 'desserts', 'curries'],
    description:
      'The "Queen of Spices," green cardamom lends a unique floral sweetness to biryanis, kheer, and chai. Cool, minty notes make it indispensable in Mughlai cuisine.',
    image: '/Whole Spice/vecteezy_fresh-cardamom-pods-in-a-wooden-bowl_55395910.png',
    productTags: ['cardamom', 'elaichi', 'green cardamom'],
  },
  {
    id: 'coriander',
    name: 'Coriander (Dhaniya)',
    region: 'North Indian',
    flavorProfiles: ['aromatic', 'earthy'],
    culinaryUses: ['curries', 'marinades', 'bread & rotis'],
    description:
      'Coriander seeds and powder provide a citrusy, mildly sweet base note to curries, chutneys, and spice blends. Ground dhaniya is among the highest-used spices.',
    image: '/Whole Spice/vecteezy_coriander-seeds-displayed-in-a-wooden-bowl-on-a-transparent_57176801.png',
    productTags: ['coriander', 'dhaniya', 'coriander powder'],
  },
  {
    id: 'cloves',
    name: 'Cloves (Laung)',
    region: 'North Indian',
    flavorProfiles: ['aromatic', 'spicy', 'sweet'],
    culinaryUses: ['rice dishes', 'curries', 'tempering'],
    description:
      'Intensely aromatic cloves are a key whole spice in biryanis and pulao. Their warm, sweet-pungent flavor is fundamental to royal garam masala.',
    image: '/Whole Spice/vecteezy_ai-generated-dried-cloves-in-the-wooden-spoon-isolated-on_37924336.png',
    productTags: ['cloves', 'laung', 'whole cloves'],
  },
  {
    id: 'star-anise',
    name: 'Star Anise (Chakra Phool)',
    region: 'Bengali',
    flavorProfiles: ['aromatic', 'sweet'],
    culinaryUses: ['rice dishes', 'curries', 'tempering'],
    description:
      'Star anise brings a distinctive liquorice-like sweetness to Bengali biryani and Mughlai curries. Its star shape is as striking visually as its flavor.',
    image: '/Whole Spice/vecteezy_a-white-ceramic-bowl-filled-with-numerous-star-anise-pods_67847656.png',
    productTags: ['star anise', 'chakra phool', 'anise'],
  },
  {
    id: 'garam-masala',
    name: 'Royal Shahi Garam Masala',
    region: 'North Indian',
    flavorProfiles: ['aromatic', 'spicy', 'sweet'],
    culinaryUses: ['curries', 'rice dishes', 'marinades'],
    description:
      'Heritage blend of 16 whole spices including Mace & Pippali, stone-ground in Clement Town, Dehradun to preserve essential oils.',
    image: '/transparent-products/garam-masala.png',
    productTags: ['garam masala', 'shahi masala', 'royal blend'],
  },
  {
    id: 'red-chili',
    name: 'Super Lal Tadka Red Chili',
    region: 'Rajasthani',
    flavorProfiles: ['spicy', 'pungent'],
    culinaryUses: ['curries', 'marinades', 'tempering'],
    description:
      '100% pure cold-ground fiery red chilli powder from sun-dried select whole chillies. Delivers rich crimson red color and traditional tadka heat.',
    image: '/transparent-products/super-lal-tadka.png',
    productTags: ['red chili', 'lal mirch', 'tadka mirch'],
  },
  {
    id: 'kasuri-methi',
    name: 'Sun-Dried Kasoori Methi',
    region: 'North Indian',
    flavorProfiles: ['bitter', 'aromatic'],
    culinaryUses: ['curries', 'bread & rotis', 'marinades'],
    description:
      'Fragrant fenugreek leaves harvested from Himalayan foothill farms and gently sun-dried to lock in essential oils.',
    image: '/transparent-products/kasoori-methi.png',
    productTags: ['kasoori methi', 'fenugreek leaves', 'methi'],
  },
  {
    id: 'kitchen-king',
    name: 'Kitchen King All-Purpose Masala',
    region: 'North Indian',
    flavorProfiles: ['aromatic', 'earthy', 'tangy'],
    culinaryUses: ['curries', 'tempering', 'bread & rotis'],
    description:
      'The supreme all-in-one seasoning blend designed to elevate everyday vegetables, lentils, and gravies with Hing & Amchur.',
    image: '/transparent-products/kitchen-king.png',
    productTags: ['kitchen king', 'all-purpose', 'curry seasoning'],
  },
  {
    id: 'meat-masala',
    name: 'Meat Masala Special (with Bairki & Kachri)',
    region: 'North Indian',
    flavorProfiles: ['spicy', 'earthy', 'tangy'],
    culinaryUses: ['curries', 'marinades'],
    description:
      'Robust non-veg spice mix enriched with authentic Himalayan Bairki spice, tenderizing Kachri powder, and Rock Salt.',
    image: '/transparent-products/meat-masala.png',
    productTags: ['meat masala', 'non-veg', 'bairki'],
  },
  {
    id: 'sampuran-masala',
    name: 'Sampuran Masala (with Himalayan Jakhiya)',
    region: 'North Indian',
    flavorProfiles: ['aromatic', 'pungent', 'earthy'],
    culinaryUses: ['curries', 'tempering'],
    description:
      'Our signature complete spice formulation featuring rare Himalayan Jakhiya wild mustard seeds, garlic, and onion.',
    image: '/transparent-products/sampuran-masala.png',
    productTags: ['sampuran', 'jakhiya', 'pahari masala'],
  },
  {
    id: 'mango-achar',
    name: 'Mango Achar Masala',
    region: 'Rajasthani',
    flavorProfiles: ['tangy', 'spicy', 'aromatic'],
    culinaryUses: ['pickling', 'tempering'],
    description:
      'Authentic Indian grandmother recipe pickle seasoning with coarse Methi Kuti, Saunf, Kalonji, and pure mustard oil infusion.',
    image: '/transparent-products/mango-achar-masala.png',
    productTags: ['mango achar', 'pickle masala', 'mustard oil'],
  },
  {
    id: 'mix-achar',
    name: 'Mix Achar Masala',
    region: 'Rajasthani',
    flavorProfiles: ['tangy', 'pungent'],
    culinaryUses: ['pickling', 'tempering'],
    description:
      'Multi-use pickle spice mix for instant and aged pickles. Ground coarse to allow spice oils to penetrate lemon and chilli pickles.',
    image: '/transparent-products/mix-achar-masala.png',
    productTags: ['mix achar', 'pickle spice', 'rai saunf'],
  },
  {
    id: 'chaat-masala',
    name: 'Chaat Masala Special',
    region: 'North Indian',
    flavorProfiles: ['tangy', 'pungent', 'salty' as FlavorProfile],
    culinaryUses: ['marinades', 'bread & rotis', 'tempering'],
    description:
      'Zesty and chatpata masala crafted with dry mango powder, black salt, and roasted carom seeds.',
    image: '/transparent-products/chaat-masala.png',
    productTags: ['chaat masala', 'amchur', 'tangy spice'],
  },
];

// ── Filter Options ────────────────────────────────────────────

const REGIONS: Array<'All' | SpiceRegion> = [
  'All',
  'North Indian',
  'South Indian',
  'Bengali',
  'Rajasthani',
  'Other',
];

const FLAVOR_PROFILES: Array<'All' | FlavorProfile> = [
  'All',
  'spicy',
  'tangy',
  'aromatic',
  'earthy',
  'bitter',
  'sweet',
  'pungent',
];

const CULINARY_USES: Array<'All' | CulinaryUse> = [
  'All',
  'curries',
  'rice dishes',
  'marinades',
  'tempering',
  'pickling',
  'desserts',
  'bread & rotis',
];

// ── Color Maps ────────────────────────────────────────────────

const REGION_COLORS: Record<SpiceRegion, string> = {
  'North Indian': 'bg-amber-100/90 text-amber-900 border-amber-300',
  'South Indian': 'bg-emerald-100/90 text-emerald-900 border-emerald-300',
  Bengali: 'bg-yellow-100/90 text-yellow-900 border-yellow-300',
  Rajasthani: 'bg-rose-100/90 text-rose-900 border-rose-300',
  Other: 'bg-slate-100/90 text-slate-800 border-slate-300',
};

const FLAVOR_COLORS: Record<FlavorProfile, string> = {
  spicy: 'bg-red-50 text-red-700 border-red-200',
  tangy: 'bg-lime-50 text-lime-700 border-lime-200',
  aromatic: 'bg-purple-50 text-purple-700 border-purple-200',
  earthy: 'bg-amber-50 text-amber-700 border-amber-200',
  bitter: 'bg-slate-50 text-slate-700 border-slate-200',
  sweet: 'bg-pink-50 text-pink-700 border-pink-200',
  pungent: 'bg-orange-50 text-orange-700 border-orange-200',
};

// ── Filter Pill Component ─────────────────────────────────────

interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const FilterPill = ({ label, active, onClick }: FilterPillProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all duration-200 capitalize ${
      active
        ? 'bg-gradient-to-r from-[#D63220] via-amber-600 to-[#E65C19] text-white border-transparent shadow-md scale-105'
        : 'bg-white text-[#3E2314] border-[#3E2314]/15 hover:border-[#D63220]/30 hover:bg-[#D63220]/5'
    }`}
  >
    {label}
  </button>
);

// ── Spice Card Component ──────────────────────────────────────

interface SpiceCardProps {
  spice: Spice;
  index: number;
  onSelect: (spice: Spice) => void;
}

const SpiceCard = ({ spice, index, onSelect }: SpiceCardProps) => (
  <motion.article
    initial={{ opacity: 0, y: 32 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    onClick={() => onSelect(spice)}
    className="bg-white rounded-3xl border-2 border-amber-200/50 shadow-[0_10px_30px_rgba(62,35,20,0.05)] hover:shadow-[0_20px_45px_rgba(62,35,20,0.12)] transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer relative"
  >
    {/* Product Image Stage */}
    <div className="relative aspect-[4/3] bg-gradient-to-b from-[#FAF6F0] via-[#F7EFE5] to-[#F5EBE0] overflow-hidden flex items-center justify-center p-6">
      <div className="absolute w-40 h-40 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
      
      <img
        src={spice.image}
        alt={spice.name}
        className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.2)] group-hover:scale-110 group-hover:-rotate-2 transition-transform duration-500 ease-out z-10"
        loading="lazy"
      />

      {/* Region badge overlay */}
      <span
        className={`absolute top-3 right-3 text-[10px] sm:text-xs font-black tracking-wider uppercase px-3 py-1 rounded-full border shadow-sm backdrop-blur-md z-20 ${REGION_COLORS[spice.region]}`}
      >
        {spice.region}
      </span>
    </div>

    <div className="p-5 flex flex-col flex-1 gap-3">
      {/* Name */}
      <h3 className="font-serif text-lg sm:text-xl font-black text-[#3E2314] leading-snug group-hover:text-[#D63220] transition-colors">
        {spice.name}
      </h3>

      {/* Description */}
      <p className="text-[#3E2314]/75 text-xs sm:text-sm leading-relaxed line-clamp-2 font-medium">
        {spice.description}
      </p>

      {/* Flavor profiles */}
      <div className="flex flex-wrap gap-1.5" aria-label="Flavor profiles">
        {spice.flavorProfiles.map((flavor) => (
          <span
            key={flavor}
            className={`inline-flex items-center gap-1 text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border font-bold capitalize ${FLAVOR_COLORS[flavor]}`}
          >
            <Flame className="w-3 h-3" aria-hidden="true" />
            {flavor}
          </span>
        ))}
      </div>

      {/* Product tag links */}
      <div className="flex flex-wrap gap-2 pt-2 mt-auto border-t border-amber-100" aria-label="Shop associated products">
        {spice.productTags.map((tag) => (
          <Link
            key={tag}
            to={`/products?tag=${encodeURIComponent(tag)}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-amber-50 text-[#D63220] border border-amber-300/80 px-2.5 py-1 rounded-full font-bold hover:bg-[#D63220] hover:text-white transition-colors"
          >
            <Tag className="w-3 h-3" />
            {tag}
          </Link>
        ))}
      </div>
    </div>
  </motion.article>
);

// ── Interactive Detail Modal ───────────────────────────────────

function SpiceDetailModal({ spice, onClose }: { spice: Spice | null; onClose: () => void }) {
  if (!spice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border-2 border-amber-300 p-6 sm:p-8 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-amber-100 text-amber-900 hover:bg-red-100 hover:text-red-700 transition">
          <X className="w-5 h-5" />
        </button>

        <div className="grid sm:grid-cols-12 gap-6 items-center">
          <div className="sm:col-span-5 bg-gradient-to-b from-[#FAF6F0] to-[#F5EBE0] p-6 rounded-2xl border border-amber-200 flex items-center justify-center min-h-[220px]">
            <img src={spice.image} alt={spice.name} className="max-h-48 max-w-full object-contain filter drop-shadow-[0_16px_30px_rgba(0,0,0,0.25)]" />
          </div>

          <div className="sm:col-span-7 space-y-4">
            <span className="text-[10px] font-black text-amber-800 tracking-widest uppercase bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
              {spice.region} Origin
            </span>

            <h3 className="font-serif text-2xl sm:text-3xl font-black text-[#3E2314]">
              {spice.name}
            </h3>

            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-medium">
              {spice.description}
            </p>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Recommended Culinary Uses</span>
              <div className="flex flex-wrap gap-1.5">
                {spice.culinaryUses.map((use) => (
                  <span key={use} className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs font-bold capitalize">
                    {use}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3">
              <Button asChild size="lg" className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-[#D63220] text-white font-serif font-black py-4 rounded-xl shadow-lg">
                <Link to={`/products?tag=${encodeURIComponent(spice.productTags[0] || '')}`}>
                  Shop Authentic {spice.name.split(' ')[0]} Products
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

const SpiceGuidePage = () => {
  const [selectedRegion, setSelectedRegion] = useState<'All' | SpiceRegion>('All');
  const [selectedFlavor, setSelectedFlavor] = useState<'All' | FlavorProfile>('All');
  const [selectedUse, setSelectedUse] = useState<'All' | CulinaryUse>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalSpice, setActiveModalSpice] = useState<Spice | null>(null);

  const filteredSpices = useMemo(() => {
    return SPICES.filter((spice) => {
      const regionMatch = selectedRegion === 'All' || spice.region === selectedRegion;
      const flavorMatch =
        selectedFlavor === 'All' || spice.flavorProfiles.includes(selectedFlavor as FlavorProfile);
      const useMatch =
        selectedUse === 'All' || spice.culinaryUses.includes(selectedUse as CulinaryUse);
      const searchMatch =
        searchQuery.trim() === '' ||
        spice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spice.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spice.productTags.some((t) =>
          t.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return regionMatch && flavorMatch && useMatch && searchMatch;
    });
  }, [selectedRegion, selectedFlavor, selectedUse, searchQuery]);

  const hasActiveFilters =
    selectedRegion !== 'All' ||
    selectedFlavor !== 'All' ||
    selectedUse !== 'All' ||
    searchQuery.trim() !== '';

  const clearFilters = () => {
    setSelectedRegion('All');
    setSelectedFlavor('All');
    setSelectedUse('All');
    setSearchQuery('');
  };

  return (
    <div className="bg-[#FAF5EE] min-h-screen text-[#3E2314] font-sans">
      <PageHelmet
        title="Spice Guide | Matasree Super Masale"
        description="Explore our interactive spice guide — learn about Indian spices by region, flavour profile, and culinary use with Matasree Super Masale."
        canonicalUrl="https://matasreesuper.com/spice-guide"
        ogType="website"
      />
      <Navbar />

      <main role="main" className="pt-24 pb-24">
        {/* ── Hero Header ── */}
        <section className="container mx-auto px-4 max-w-6xl mb-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-[#D63220]/10 border border-[#D63220]/20 text-[#D63220] px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-4 shadow-sm">
              <Leaf className="w-4 h-4" aria-hidden="true" />
              OFFICIAL SPICE ENCYCLOPEDIA
            </div>
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-black text-[#3E2314] mb-4 tracking-tight leading-tight">
              The Master{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#C89B3C] italic">
                Spice Guide
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[#3E2314]/75 max-w-2xl mx-auto font-semibold leading-relaxed">
              Explore India's rich spice heritage — browse by region, flavor profile, and culinary
              use, then shop 100% stone-ground spices directly from Clement Town, Dehradun.
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-8">
              {[
                { icon: Leaf, value: `${SPICES.length} Spices`, label: 'catalogued' },
                { icon: MapPin, value: '4 Regions', label: 'of India' },
                { icon: Flame, value: '7 Flavor Profiles', label: 'identified' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={value} className="flex items-center gap-2 bg-white/80 border border-amber-200/80 px-4 py-2 rounded-2xl shadow-sm">
                  <Icon className="w-4 h-4 text-[#D63220]" aria-hidden="true" />
                  <span className="font-bold text-[#3E2314] text-xs sm:text-sm">{value}</span>
                  <span className="text-xs text-slate-500">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Filters ── */}
        <section
          className="container mx-auto px-4 max-w-6xl mb-10"
          aria-label="Spice filters"
        >
          <div className="bg-white rounded-3xl border-2 border-amber-200/60 shadow-lg p-5 sm:p-8 space-y-6">
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3E2314]/40"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search spices by name, tag, or usage..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search spices"
                className="w-full pl-11 pr-4 py-3 rounded-full border border-amber-300 bg-[#FAF6F0] text-xs sm:text-sm text-[#3E2314] font-semibold placeholder:text-[#3E2314]/40 focus:outline-none focus:border-[#D63220] focus:ring-2 focus:ring-[#D63220]/20 transition shadow-inner"
              />
            </div>

            {/* Region filter */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <MapPin className="w-4 h-4 text-[#D63220]" aria-hidden="true" />
                <span className="text-xs font-black text-[#3E2314] uppercase tracking-wider">
                  Region of Origin
                </span>
              </div>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Filter by region"
              >
                {REGIONS.map((region) => (
                  <FilterPill
                    key={region}
                    label={region}
                    active={selectedRegion === region}
                    onClick={() => setSelectedRegion(region as 'All' | SpiceRegion)}
                  />
                ))}
              </div>
            </div>

            {/* Flavor profile filter */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Flame className="w-4 h-4 text-[#D63220]" aria-hidden="true" />
                <span className="text-xs font-black text-[#3E2314] uppercase tracking-wider">
                  Flavor Profile
                </span>
              </div>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Filter by flavor profile"
              >
                {FLAVOR_PROFILES.map((flavor) => (
                  <FilterPill
                    key={flavor}
                    label={flavor}
                    active={selectedFlavor === flavor}
                    onClick={() =>
                      setSelectedFlavor(flavor as 'All' | FlavorProfile)
                    }
                  />
                ))}
              </div>
            </div>

            {/* Culinary use filter */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <UtensilsCrossed className="w-4 h-4 text-[#D63220]" aria-hidden="true" />
                <span className="text-xs font-black text-[#3E2314] uppercase tracking-wider">
                  Culinary Application
                </span>
              </div>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Filter by culinary use"
              >
                {CULINARY_USES.map((use) => (
                  <FilterPill
                    key={use}
                    label={use}
                    active={selectedUse === use}
                    onClick={() => setSelectedUse(use as 'All' | CulinaryUse)}
                  />
                ))}
              </div>
            </div>

            {/* Clear filters */}
            <AnimatePresence>
              {hasActiveFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="pt-2 border-t border-amber-100"
                >
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 text-xs text-[#D63220] font-black hover:underline"
                    aria-label="Clear all filters"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                    Reset All Filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ── Results summary ── */}
        <div
          className="container mx-auto px-4 max-w-6xl mb-6 flex items-center justify-between"
        >
          <p className="text-xs sm:text-sm text-[#3E2314]/60 font-bold">
            Showing{' '}
            <span className="text-[#D63220] font-black">{filteredSpices.length}</span>{' '}
            {filteredSpices.length === 1 ? 'Spice' : 'Spices'} in Encyclopedia
          </p>
        </div>

        {/* ── Spice Grid ── */}
        <div className="container mx-auto px-4 max-w-6xl">
          <AnimatePresence mode="wait">
            {filteredSpices.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20 text-[#3E2314]/50 bg-white rounded-3xl border border-amber-200"
                role="alert"
              >
                <Leaf className="w-16 h-16 mx-auto mb-4 text-amber-600/40" aria-hidden="true" />
                <p className="text-lg font-bold text-[#3E2314]">
                  No spices matched your selected criteria.
                </p>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Try clearing search keywords or region filters.</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#D63220] to-[#E65C19] text-white text-xs font-black shadow hover:scale-105 transition-transform"
                >
                  Reset Search
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredSpices.map((spice, idx) => (
                  <SpiceCard key={spice.id} spice={spice} index={idx} onSelect={(s) => setActiveModalSpice(s)} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Interactive Detail Modal */}
      <SpiceDetailModal spice={activeModalSpice} onClose={() => setActiveModalSpice(null)} />

      <Footer />
      <CartDrawer />
    </div>
  );
};

export default SpiceGuidePage;
