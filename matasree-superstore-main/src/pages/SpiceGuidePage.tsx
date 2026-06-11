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

const SPICES: Spice[] = [
  {
    id: 'turmeric',
    name: 'Turmeric (Haldi)',
    region: 'North Indian',
    flavorProfiles: ['earthy', 'bitter'],
    culinaryUses: ['curries', 'rice dishes', 'marinades'],
    description:
      'The golden spice of India, turmeric imparts a warm, earthy flavor and vibrant yellow hue. Used in virtually every Indian kitchen, it has powerful anti-inflammatory properties and is central to curries, dals, and rice dishes.',
    image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&q=80',
    productTags: ['turmeric', 'haldi', 'golden spice'],
  },
  {
    id: 'cumin',
    name: 'Cumin (Jeera)',
    region: 'North Indian',
    flavorProfiles: ['earthy', 'aromatic'],
    culinaryUses: ['curries', 'rice dishes', 'tempering'],
    description:
      'Cumin seeds are the backbone of North Indian cooking. Their warm, nutty, slightly peppery flavor forms the base of countless spice blends and tadkas. Whole seeds are tempered in hot oil to release their essential oils.',
    image: 'https://images.unsplash.com/photo-1612204103590-b8ec9b4f4e7e?w=600&q=80',
    productTags: ['cumin', 'jeera', 'cumin seeds'],
  },
  {
    id: 'mustard-seeds',
    name: 'Mustard Seeds (Sarson)',
    region: 'South Indian',
    flavorProfiles: ['pungent', 'earthy'],
    culinaryUses: ['tempering', 'pickling', 'curries'],
    description:
      'A cornerstone of South Indian and Bengali cooking, mustard seeds are popped in hot oil to unlock a nutty, pungent aroma. They feature prominently in fish curries, sambar, chutneys, and traditional pickles.',
    image: 'https://images.unsplash.com/photo-1609501676725-7186f017a4b0?w=600&q=80',
    productTags: ['mustard seeds', 'sarson', 'rai'],
  },
  {
    id: 'black-pepper',
    name: 'Black Pepper (Kali Mirch)',
    region: 'South Indian',
    flavorProfiles: ['spicy', 'aromatic', 'pungent'],
    culinaryUses: ['curries', 'marinades', 'tempering'],
    description:
      'Known as the "King of Spices," black pepper from Kerala\'s misty hills delivers sharp heat and complex aroma. Essential in garam masala, Chettinad cuisine, and rubs for tandoori meats.',
    image: 'https://images.unsplash.com/photo-1598511726623-d2e9996e7cb5?w=600&q=80',
    productTags: ['black pepper', 'kali mirch', 'pepper'],
  },
  {
    id: 'cardamom',
    name: 'Green Cardamom (Elaichi)',
    region: 'North Indian',
    flavorProfiles: ['aromatic', 'sweet'],
    culinaryUses: ['rice dishes', 'desserts', 'curries'],
    description:
      'The "Queen of Spices," green cardamom lends a unique floral sweetness to biryanis, kheer, and chai. Its cool, minty notes make it indispensable in Mughal-inspired cuisine and Indian sweets.',
    image: 'https://images.unsplash.com/photo-1599909144696-3b8e55d9eba0?w=600&q=80',
    productTags: ['cardamom', 'elaichi', 'green cardamom'],
  },
  {
    id: 'coriander',
    name: 'Coriander (Dhaniya)',
    region: 'North Indian',
    flavorProfiles: ['aromatic', 'earthy'],
    culinaryUses: ['curries', 'marinades', 'bread & rotis'],
    description:
      'Coriander seeds and powder provide a citrusy, mildly sweet base note to curries, chutneys, and spice blends. Ground dhaniya is among the highest-used spices in Indian home cooking.',
    image: 'https://images.unsplash.com/photo-1561155707-57a80c9e1975?w=600&q=80',
    productTags: ['coriander', 'dhaniya', 'coriander powder'],
  },
  {
    id: 'fenugreek',
    name: 'Fenugreek (Methi)',
    region: 'Rajasthani',
    flavorProfiles: ['bitter', 'earthy'],
    culinaryUses: ['curries', 'bread & rotis', 'pickling'],
    description:
      'Fenugreek seeds and leaves contribute a distinctive bittersweet, maple-like undertone to Rajasthani curries, methi parathas, and achaar. A staple in dal and lamb dishes of the desert kitchens.',
    image: 'https://images.unsplash.com/photo-1571753088049-56714ded5b7a?w=600&q=80',
    productTags: ['fenugreek', 'methi', 'methi seeds'],
  },
  {
    id: 'cloves',
    name: 'Cloves (Laung)',
    region: 'North Indian',
    flavorProfiles: ['aromatic', 'spicy', 'sweet'],
    culinaryUses: ['rice dishes', 'curries', 'tempering'],
    description:
      'Intensely aromatic cloves are a key whole spice in biryanis and pulao. Their warm, sweet-pungent flavor is fundamental to garam masala and slow-cooked Mughlai gravies.',
    image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=600&q=80',
    productTags: ['cloves', 'laung', 'whole cloves'],
  },
  {
    id: 'red-chili',
    name: 'Red Chili (Lal Mirch)',
    region: 'Rajasthani',
    flavorProfiles: ['spicy'],
    culinaryUses: ['curries', 'marinades', 'tempering'],
    description:
      'The fiery soul of Indian cuisine. Rajasthani lal mirch is celebrated for its vibrant crimson color and intense heat. Used in everything from laal maas to everyday tadkas and marinades.',
    image: 'https://images.unsplash.com/photo-1599020792689-8c53e5ff9571?w=600&q=80',
    productTags: ['red chili', 'lal mirch', 'chili powder', 'red chili powder'],
  },
  {
    id: 'amchur',
    name: 'Dry Mango Powder (Amchur)',
    region: 'North Indian',
    flavorProfiles: ['tangy', 'sweet'],
    culinaryUses: ['curries', 'marinades', 'bread & rotis'],
    description:
      'Made from sun-dried raw mangoes, amchur adds a fruity tanginess and gentle sourness to chaat, aloo sabzi, and tikkas. It brightens flavors without adding moisture.',
    image: 'https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=600&q=80',
    productTags: ['amchur', 'dry mango powder', 'mango powder'],
  },
  {
    id: 'panch-phoron',
    name: 'Panch Phoron',
    region: 'Bengali',
    flavorProfiles: ['aromatic', 'pungent', 'earthy'],
    culinaryUses: ['tempering', 'curries', 'pickling'],
    description:
      'The iconic Bengali five-spice blend — cumin, nigella, fenugreek, fennel, and mustard seeds in equal measure. A single tempering of panch phoron in mustard oil transforms any vegetable or fish dish.',
    image: 'https://images.unsplash.com/photo-1464699908537-0954e50791ee?w=600&q=80',
    productTags: ['panch phoron', 'five spice', 'bengali spice blend'],
  },
  {
    id: 'kasuri-methi',
    name: 'Kasuri Methi (Dried Fenugreek Leaves)',
    region: 'North Indian',
    flavorProfiles: ['bitter', 'aromatic'],
    culinaryUses: ['curries', 'bread & rotis', 'marinades'],
    description:
      'Sun-dried fenugreek leaves from Kasur, Pakistan. Crushed and sprinkled into butter chicken, paneer tikka masala, or parathas, they add a restaurant-quality depth that sets dishes apart.',
    image: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&q=80',
    productTags: ['kasuri methi', 'dried fenugreek leaves', 'methi leaves'],
  },
  {
    id: 'star-anise',
    name: 'Star Anise (Chakra Phool)',
    region: 'Bengali',
    flavorProfiles: ['aromatic', 'sweet'],
    culinaryUses: ['rice dishes', 'curries', 'tempering'],
    description:
      'Star anise brings a distinctive liquorice-like sweetness to Bengali biryani and Mughlai curries. Its beautiful star shape is as striking visually as its flavor is in slow-braised meat dishes.',
    image: 'https://images.unsplash.com/photo-1575217111835-e0dbf0de02b7?w=600&q=80',
    productTags: ['star anise', 'chakra phool', 'anise'],
  },
  {
    id: 'ajwain',
    name: 'Carom Seeds (Ajwain)',
    region: 'Rajasthani',
    flavorProfiles: ['pungent', 'bitter', 'aromatic'],
    culinaryUses: ['bread & rotis', 'curries', 'tempering'],
    description:
      'Ajwain has a sharp, thyme-like aroma with a slightly bitter bite. Essential in Rajasthani mathri, ajwain parathas, and fish fry. Also renowned for its digestive properties.',
    image: 'https://images.unsplash.com/photo-1591819897706-e1af0a8f8cb5?w=600&q=80',
    productTags: ['ajwain', 'carom seeds', 'bishop weed'],
  },
  {
    id: 'curry-leaves',
    name: 'Curry Leaves (Kadi Patta)',
    region: 'South Indian',
    flavorProfiles: ['aromatic', 'earthy'],
    culinaryUses: ['tempering', 'curries', 'rice dishes'],
    description:
      'Fresh and dried curry leaves are the heartbeat of South Indian cooking. A handful sizzled in coconut oil releases an irreplaceable nutty, citrusy fragrance essential to sambar, rasam, and coconut chutneys.',
    image: 'https://images.unsplash.com/photo-1574690610869-eeb6c3741c68?w=600&q=80',
    productTags: ['curry leaves', 'kadi patta', 'meetha neem'],
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
  'North Indian': 'bg-orange-100 text-orange-800 border-orange-200',
  'South Indian': 'bg-green-100 text-green-800 border-green-200',
  Bengali: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Rajasthani: 'bg-red-100 text-red-800 border-red-200',
  Other: 'bg-gray-100 text-gray-700 border-gray-200',
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
    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 capitalize ${
      active
        ? 'bg-gradient-to-r from-[#D63220] to-[#E65C19] text-white border-transparent shadow-md'
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
}

const SpiceCard = ({ spice, index }: SpiceCardProps) => (
  <motion.article
    initial={{ opacity: 0, y: 32 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
    className="bg-[#FDFBF9] rounded-2xl border border-[#3E2314]/8 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group"
    aria-label={`Spice card for ${spice.name}`}
  >
    {/* Image */}
    <div className="aspect-[4/3] overflow-hidden relative">
      <img
        src={spice.image}
        alt={spice.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80';
        }}
      />
      {/* Region badge overlay */}
      <span
        className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm ${REGION_COLORS[spice.region]}`}
      >
        {spice.region}
      </span>
    </div>

    <div className="p-5 flex flex-col flex-1 gap-3">
      {/* Name */}
      <h3 className="font-serif text-xl font-bold text-[#3E2314] leading-snug">
        {spice.name}
      </h3>

      {/* Description */}
      <p className="text-[#3E2314]/65 text-sm leading-relaxed line-clamp-3">
        {spice.description}
      </p>

      {/* Flavor profiles */}
      <div className="flex flex-wrap gap-1.5" aria-label="Flavor profiles">
        {spice.flavorProfiles.map((flavor) => (
          <span
            key={flavor}
            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${FLAVOR_COLORS[flavor]}`}
          >
            <Flame className="w-2.5 h-2.5" aria-hidden="true" />
            {flavor}
          </span>
        ))}
      </div>

      {/* Culinary uses */}
      <div className="flex flex-wrap gap-1.5" aria-label="Culinary uses">
        {spice.culinaryUses.map((use) => (
          <span
            key={use}
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-[#3E2314]/5 text-[#3E2314]/70 border-[#3E2314]/10 font-medium capitalize"
          >
            <UtensilsCrossed className="w-2.5 h-2.5" aria-hidden="true" />
            {use}
          </span>
        ))}
      </div>

      {/* Product tag links */}
      <div className="flex flex-wrap gap-2 pt-1 mt-auto" aria-label="Shop associated products">
        {spice.productTags.map((tag) => (
          <Link
            key={tag}
            to={`/products?tag=${encodeURIComponent(tag)}`}
            className="inline-flex items-center gap-1 text-xs bg-[#E65C19]/10 text-[#E65C19] border border-[#E65C19]/25 px-2.5 py-1 rounded-full font-semibold hover:bg-[#E65C19]/20 hover:border-[#E65C19]/50 transition-colors duration-200"
            aria-label={`Shop products tagged with ${tag}`}
          >
            <Tag className="w-3 h-3" aria-hidden="true" />
            {tag}
          </Link>
        ))}
      </div>
    </div>
  </motion.article>
);

// ── Main Page ─────────────────────────────────────────────────

const SpiceGuidePage = () => {
  const [selectedRegion, setSelectedRegion] = useState<'All' | SpiceRegion>('All');
  const [selectedFlavor, setSelectedFlavor] = useState<'All' | FlavorProfile>('All');
  const [selectedUse, setSelectedUse] = useState<'All' | CulinaryUse>('All');
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="bg-brand-cream min-h-screen text-brand-cinnamon font-sans">
      <PageHelmet
        title="Spice Guide | Matasree Super Masale"
        description="Explore our interactive spice guide — learn about Indian spices by region, flavour profile, and culinary use with Matasree Super Masale."
        canonicalUrl="https://matasreesuper.com/spice-guide"
        ogType="website"
      />
      <Navbar />

      <main role="main" className="pt-24 pb-24">
        {/* ── Hero Header ── */}
        <section className="container mx-auto px-4 max-w-6xl mb-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-[#D63220]/10 text-[#D63220] px-4 py-1.5 rounded-full text-sm font-bold mb-6">
              <Leaf className="w-4 h-4" aria-hidden="true" />
              Spice Encyclopedia
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-black text-[#3E2314] mb-4 tracking-tight leading-tight">
              The{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#8B4513] italic">
                Spice Guide
              </span>
            </h1>
            <p className="text-lg text-[#3E2314]/60 max-w-2xl mx-auto">
              Explore India's rich spice heritage — browse by region, flavor profile, and culinary
              use, then shop the spices you love directly.
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
              {[
                { icon: Leaf, value: `${SPICES.length} Spices`, label: 'in our guide' },
                { icon: MapPin, value: '4 Regions', label: 'of India' },
                { icon: Flame, value: '7 Flavor Profiles', label: 'catalogued' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={value} className="flex items-center gap-2 text-[#3E2314]/70">
                  <Icon className="w-4 h-4 text-[#D63220]" aria-hidden="true" />
                  <span className="font-bold text-[#3E2314]">{value}</span>
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Filters ── */}
        <section
          className="container mx-auto px-4 max-w-6xl mb-12"
          aria-label="Spice filters"
        >
          <div className="bg-white rounded-2xl border border-[#3E2314]/8 shadow-sm p-6 space-y-5">
            {/* Search */}
            <div className="relative max-w-sm">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3E2314]/40"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search spices, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search spices"
                className="w-full pl-9 pr-4 py-2.5 rounded-full border border-[#3E2314]/15 bg-[#FDFBF9] text-sm text-[#3E2314] placeholder:text-[#3E2314]/40 focus:outline-none focus:border-[#D63220]/40 focus:ring-2 focus:ring-[#D63220]/10 transition"
              />
            </div>

            {/* Region filter */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-[#D63220]" aria-hidden="true" />
                <span className="text-sm font-bold text-[#3E2314] uppercase tracking-wide">
                  Region
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
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-[#D63220]" aria-hidden="true" />
                <span className="text-sm font-bold text-[#3E2314] uppercase tracking-wide">
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
              <div className="flex items-center gap-2 mb-3">
                <UtensilsCrossed className="w-4 h-4 text-[#D63220]" aria-hidden="true" />
                <span className="text-sm font-bold text-[#3E2314] uppercase tracking-wide">
                  Culinary Use
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
                >
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 text-sm text-[#D63220] font-semibold hover:underline"
                    aria-label="Clear all filters"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                    Clear all filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ── Results summary ── */}
        <div
          className="container mx-auto px-4 max-w-6xl mb-6"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="text-sm text-[#3E2314]/50 font-medium">
            Showing{' '}
            <span className="text-[#3E2314] font-bold">{filteredSpices.length}</span>{' '}
            {filteredSpices.length === 1 ? 'spice' : 'spices'}
            {hasActiveFilters && ' matching your filters'}
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
                className="text-center py-24 text-[#3E2314]/50"
                role="alert"
              >
                <Leaf className="w-16 h-16 mx-auto mb-4 opacity-25" aria-hidden="true" />
                <p className="text-lg font-semibold text-[#3E2314]/70">
                  No spices found for the selected filters.
                </p>
                <p className="text-sm mt-1">Try adjusting or clearing your filters.</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#D63220] to-[#E65C19] text-white text-sm font-semibold shadow hover:opacity-90 transition-opacity"
                >
                  Clear Filters
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
                  <SpiceCard key={spice.id} spice={spice} index={idx} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
};

export default SpiceGuidePage;
