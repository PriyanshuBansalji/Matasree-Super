import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import {
  Award,
  Leaf,
  Users,
  TrendingUp,
  Heart,
  Star,
  Sprout,
  Microscope,
  Wind,
  Package,
  Truck,
  FlaskConical,
  BadgeCheck,
  Sparkles,
  ShieldCheck,
  Quote,
  MapPin,
  Phone,
  Clock,
  ChevronRight
} from 'lucide-react';
import heroImage from '@/assets/hero-spices.jpg';
import logo from '@/assets/matasree-logo.png';
import posterImage from '@/assets/matasree-poster.jpg';
import PageHelmet from '@/components/PageHelmet';
import JsonLd, {
  buildOrganizationSchema,
  buildLocalBusinessSchema,
} from '@/components/JsonLd';

// Import spice category assets for Spice Library
import turmericImg from '@/assets/turmeric-category.jpg';
import chilliImg from '@/assets/chilli-category.jpg';
import corianderImg from '@/assets/coriander-category.jpg';
import garamMasalaImg from '@/assets/garam-masala-category.jpg';

// ─── Data ───────────────────────────────────────────────────────────────────

const stats = [
  { icon: Award, value: '20+', label: 'Years of Excellence' },
  { icon: Users, value: '50K+', label: 'Happy Customers' },
  { icon: Leaf, value: '15+', label: 'Premium Products' },
  { icon: TrendingUp, value: '100+', label: 'Partner Stores' },
];

interface Milestone {
  year: string;
  title: string;
  description: string;
}

const milestones: Milestone[] = [
  { year: '2008', title: 'The Genesis', description: 'Shri Sanjay Bansal establishes Matasree Super Industries in Clement Town, Dehradun, blending authentic family recipes.' },
  { year: '2012', title: 'Stone-Grinding Tech', description: 'Upgraded to premium stone-grinding machinery that operates at low speeds, preventing volatile oils from evaporating.' },
  { year: '2017', title: 'QA Lab & Certification', description: 'Constructed our clean-room laboratory, implementing batch-testing and achieving full FSSAI certification.' },
  { year: '2022', title: 'Going Digital', description: 'Launched the online store, allowing spice lovers across all Indian states to order directly from our factory.' },
  { year: '2026', title: 'Modern Legacy', description: 'Now trusted by 50,000+ households and 100+ gourmet restaurant partners nationwide.' }
];

interface ProcessStep {
  number: string;
  title: string;
  description: string;
  extendedDescription: string;
  checks: string[];
  icon: React.ElementType;
  accent: string;
}

const processSteps: ProcessStep[] = [
  {
    number: '01',
    title: 'Farm Sourcing',
    description: "Hand-picked from India's finest spice gardens by trusted partner farmers.",
    extendedDescription: "We partner directly with farmers in regions famous for specific spices—such as Guntur for chillies and Sangli for turmeric. This allows us to cut middlemen, ensure sustainable farming, and get the absolute freshest harvest.",
    checks: ['Direct Trade Sourcing', 'Sustainable Agriculture', 'Size & Color Grading at Source'],
    icon: Sprout,
    accent: '#D63220',
  },
  {
    number: '02',
    title: 'Quality Testing',
    description: 'Every raw material is lab-tested for purity, potency, and food safety.',
    extendedDescription: "Before any spice enters our grinding mills, it undergoes testing in our in-house facility. We test for moisture levels, pesticide residues, heavy metals, and essential oil content to guarantee absolute purity.",
    checks: ['Zero Pesticides Guarantee', 'Moisture Content Optimization', 'Aflatoxin & Heavy Metal Screenings'],
    icon: Microscope,
    accent: '#E65C19',
  },
  {
    number: '03',
    title: 'Traditional Grinding',
    description: 'Stone-ground in small batches at low temperature to preserve essential oils.',
    extendedDescription: "High-speed industrial grinders generate high temperatures that scorch the spices and vaporize their natural oils. We utilize slow, water-cooled stone grinders that preserve the volatile compounds, keeping the aroma intact.",
    checks: ['Cold-grinding Stone Tech', 'Micro-batch Operations', 'Volatile Oil Preservation'],
    icon: Wind,
    accent: '#8B4513',
  },
  {
    number: '04',
    title: 'Vacuum Packaging',
    description: 'Triple-sealed vacuum packs lock in freshness, aroma, and colour.',
    extendedDescription: "Air and moisture are the enemies of spice shelf life. Our state-of-the-art packaging machine uses nitrogen flushing and triple-layer vacuum sealing to lock in the intense aroma, color, and flavor for months.",
    checks: ['Nitrogen Flushing', 'Triple-barrier Material', 'Tamper-evident Seals'],
    icon: Package,
    accent: '#D63220',
  },
  {
    number: '05',
    title: 'Safe Delivery',
    description: 'Temperature-controlled dispatch to your doorstep, anywhere in India.',
    extendedDescription: "We dispatch packages in temperature-stable shipping crates to our courier partners. We track every box from our warehouse to your kitchen to ensure delivery within 3-4 days.",
    checks: ['Real-time Shipment Tracking', 'Eco-friendly Delivery Cartons', 'Pan-India Logistic Network'],
    icon: Truck,
    accent: '#E65C19',
  },
];

const spiceLibrary = [
  {
    key: 'turmeric',
    title: 'Premium Turmeric Powder',
    scientific: 'Curcuma longa',
    sourcing: 'Sangli, Maharashtra',
    highlight: '4.5% - 5.5% Curcumin Content',
    profile: 'Earthy, warm, woody aroma with a slightly bitter, peppery flavor.',
    benefits: 'High curcumin concentration offers powerful anti-inflammatory and cellular antioxidant actions.',
    processing: 'Slow sun-drying followed by low-temperature milling to preserve the vibrant yellow hue.',
    img: turmericImg,
    color: '#F5B041'
  },
  {
    key: 'chili',
    title: 'Guntur Chili Powder',
    scientific: 'Capsicum annuum',
    sourcing: 'Guntur, Andhra Pradesh',
    highlight: 'Pure Stemless Chili Seeds',
    profile: 'Sharp, fiery pungency accompanied by rich smoky undertones.',
    benefits: 'Boosts digestion, stimulates metabolism, and provides natural thermogenic properties.',
    processing: 'De-stemmed by hand and stone-ground to guarantee uniform color release without artificial dyes.',
    img: chilliImg,
    color: '#E74C3C'
  },
  {
    key: 'coriander',
    title: 'Rajasthani Dhaniya Powder',
    scientific: 'Coriandrum sativum',
    sourcing: 'Kota, Rajasthan',
    highlight: 'Double-Sifted Quality',
    profile: 'Sweet, citrus-like fragrance with a warm, mild herbaceous finish.',
    benefits: 'Aids digestive health, balances blood lipid profiles, and acts as a cooling spice.',
    processing: 'Slow ground at low speeds to prevent the delicate citrusy volatile oils from vaporizing.',
    img: corianderImg,
    color: '#27AE60'
  },
  {
    key: 'garamMasala',
    title: 'Authentic Garam Masala',
    scientific: '12-Spice Traditional Blend',
    sourcing: 'Direct Sourced Indian Spices',
    highlight: 'Sanjay Bansal\'s Secret Blend',
    profile: 'Extremely rich, complex, sweet-savory warming aroma.',
    benefits: 'Stimulates digestive enzymes, warms the body, and elevates curry flavors instantly.',
    processing: 'Each of the 12 spices is dry-roasted at 45°C individually before uniform grinding.',
    img: garamMasalaImg,
    color: '#A0522D'
  }
];

interface QualityPillar {
  icon: React.ElementType;
  title: string;
  body: string;
  accent: string;
}

const qualityPillars: QualityPillar[] = [
  {
    icon: FlaskConical,
    title: 'FSSAI Certified',
    body: 'All products are manufactured under FSSAI-certified conditions meeting the highest Indian food safety standards.',
    accent: '#D63220',
  },
  {
    icon: BadgeCheck,
    title: 'Zero Adulterants',
    body: 'Independent lab tests confirm zero artificial colours, flavours, or preservatives in every batch we ship.',
    accent: '#E65C19',
  },
  {
    icon: ShieldCheck,
    title: 'Batch Traceability',
    body: 'Every packet carries a batch code traceable back to the source farm, harvest date, and quality report.',
    accent: '#8B4513',
  }
];

interface ValueProp {
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
}

const valuePropositions: ValueProp[] = [
  {
    icon: Leaf,
    title: '100% Pure & Natural',
    description:
      'No additives, no preservatives, no artificial colors. Just pure spices sourced directly from trusted Indian farms.',
    accent: '#D63220',
  },
  {
    icon: ShieldCheck,
    title: 'Lab Tested Quality',
    description:
      'Every batch undergoes rigorous third-party lab testing for purity, safety, and authenticity before it leaves our facility.',
    accent: '#E65C19',
  },
  {
    icon: Award,
    title: '20+ Years of Legacy',
    description:
      'A family heritage of excellence trusted by thousands of households and food businesses across India since 2008.',
    accent: '#8B4513',
  },
  {
    icon: Heart,
    title: 'Traditional Methods',
    description:
      'Stone grinding at low temperatures preserves volatile essential oils, keeping every masala intensely aromatic and flavourful.',
    accent: '#D63220',
  },
  {
    icon: Sparkles,
    title: 'Small-Batch Freshness',
    description:
      'Spices are ground fresh in small batches rather than in bulk, guaranteeing maximum aroma and potency in every packet.',
    accent: '#E65C19',
  },
  {
    icon: BadgeCheck,
    title: 'FSSAI Certified',
    description:
      'All our products meet FSSAI standards — the highest food safety benchmark in India — so you can cook with complete confidence.',
    accent: '#8B4513',
  },
];

interface Testimonial {
  name: string;
  location: string;
  quote: string;
  rating: number;
  role: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Priya Sharma',
    location: 'Delhi',
    role: 'Home Cook',
    rating: 5,
    quote:
      'Matasree masalas have completely transformed my cooking. The aroma is unmatched — I can smell the difference the moment I open the packet.',
  },
  {
    name: 'Chef Ramesh Gupta',
    location: 'Dehradun',
    role: 'Restaurant Owner',
    rating: 5,
    quote:
      'We switched our entire restaurant supply to Matasree two years ago. Our customers notice the authentic flavour instantly. Never going back.',
  },
  {
    name: 'Anita Joshi',
    location: 'Jaipur',
    role: 'Food Blogger',
    rating: 5,
    quote:
      'The purity is real. I have tested multiple brands and Matasree consistently comes out on top for aroma, colour, and taste. Highly recommended.',
  },
  {
    name: 'Vikram Nair',
    location: 'Bangalore',
    role: 'Catering Business Owner',
    rating: 5,
    quote:
      'Bulk orders are delivered on time and quality is perfectly consistent batch after batch. That reliability is invaluable for catering operations.',
  },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

const ValueCard = ({ vp, index }: { vp: ValueProp; index: number }) => {
  const Icon = vp.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.8, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="group relative h-full"
    >
      <div
        className="absolute -inset-1 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${vp.accent}20, transparent)` }}
      />
      <div className="relative p-8 bg-white border border-[#3E2314]/5 rounded-[2rem] hover:border-[#3E2314]/15 transition-all duration-500 shadow-[0_8px_30px_rgba(62,35,20,0.04)] hover:shadow-[0_25px_60px_rgba(62,35,20,0.1)] h-full">
        <div
          className="absolute top-0 left-8 right-8 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(90deg, transparent, ${vp.accent}, transparent)` }}
        />
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6"
          style={{ backgroundColor: `${vp.accent}10` }}
        >
          <Icon className="w-7 h-7" style={{ color: vp.accent }} />
        </div>
        <h3 className="font-serif text-xl font-bold text-[#3E2314] mb-3 group-hover:text-[#D63220] transition-colors leading-tight">
          {vp.title}
        </h3>
        <p className="text-[#3E2314]/65 text-sm leading-relaxed font-semibold">{vp.description}</p>
      </div>
    </motion.div>
  );
};

const Counter = ({ value }: { value: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [count, setCount] = useState(0);

  const match = value.match(/^(\d+)(.*)$/);
  const targetNumber = match ? parseInt(match[1], 10) : 0;
  const suffix = match ? match[2] : '';

  useEffect(() => {
    if (isInView && targetNumber > 0) {
      const duration = 1.2;
      const startTime = performance.now();

      const step = (now: number) => {
        const progress = Math.min((now - startTime) / (duration * 1000), 1);
        const easeProgress = progress * (2 - progress);
        const currentCount = Math.floor(easeProgress * targetNumber);
        setCount(currentCount);

        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };

      window.requestAnimationFrame(step);
    }
  }, [isInView, targetNumber]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
};

const TestimonialCard = ({ t }: { t: Testimonial; index: number }) => (
  <div
    className="group relative bg-white border border-[#3E2314]/5 rounded-[2rem] p-8 shadow-[0_8px_30px_rgba(62,35,20,0.04)] hover:shadow-[0_25px_60px_rgba(62,35,20,0.1)] hover:border-[#3E2314]/15 transition-all duration-500 h-full flex flex-col justify-between"
  >
    <div>
      <Quote className="w-8 h-8 text-[#D63220]/20 mb-4" />
      <p className="text-[#3E2314]/75 text-sm leading-relaxed font-semibold mb-6 italic">
        "{t.quote}"
      </p>
    </div>
    <div>
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: t.rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-[#D63220] text-[#D63220]" />
        ))}
      </div>
      <div className="border-t border-[#3E2314]/5 pt-4">
        <p className="font-serif font-bold text-[#3E2314] text-base">{t.name}</p>
        <p className="text-[#3E2314]/40 text-xs font-semibold">
          {t.role} · {t.location}
        </p>
      </div>
    </div>
  </div>
);

// ─── Page ────────────────────────────────────────────────────────────────────

const AboutPage = () => {
  const { scrollY } = useScroll();
  const heroBgY = useTransform(scrollY, [0, 400], ['0%', '15%']);
  const heroBlob1Y = useTransform(scrollY, [0, 400], [0, 80]);
  const heroBlob2Y = useTransform(scrollY, [0, 400], [0, -60]);

  // Spice Library State
  const [activeSpiceKey, setActiveSpiceKey] = useState<string>('turmeric');
  const activeSpice = spiceLibrary.find((s) => s.key === activeSpiceKey) || spiceLibrary[0];

  // Process Dashboard State
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const currentStep = processSteps[activeStepIdx];
  const StepIcon = currentStep.icon;

  return (
    <div className="min-h-screen bg-[#FDFBF9]">
      <PageHelmet
        title="About Us | Matasree Super Masale"
        description="Learn about Matasree Super Masale — our story, our commitment to authentic Indian flavours, and the people behind India's finest spice brand."
        canonicalUrl="https://matasreesuper.com/about"
        ogType="website"
      />
      {/* Organization JSON-LD structured data (Req 27.2) */}
      <JsonLd schema={buildOrganizationSchema()} />
      {/* LocalBusiness JSON-LD structured data (Req 27.4) */}
      <JsonLd schema={buildLocalBusinessSchema()} />
      
      {/* Skip Navigation (accessibility) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-[#D63220] focus:font-bold"
      >
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content" role="main">

        {/* Hero Section - Warm Saffron Canopy & Parallax Spices */}
        <section aria-labelledby="hero-heading" className="relative py-28 md:py-36 overflow-hidden bg-gradient-to-br from-amber-50/70 via-orange-50/60 to-amber-100/40 border-b border-amber-200/30">
          {/* Animated decorative rotating Mandala in background */}
          <div className="absolute inset-y-0 right-[-10%] lg:right-[5%] w-[500px] h-[500px] my-auto flex items-center justify-center opacity-[0.06] pointer-events-none -z-10">
            <motion.svg
              width="500"
              height="500"
              viewBox="0 0 100 100"
              animate={{ rotate: 360 }}
              transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
              className="text-[#3E2314] fill-none stroke-current"
            >
              <circle cx="50" cy="50" r="46" strokeWidth="0.3" />
              <circle cx="50" cy="50" r="38" strokeWidth="0.3" />
              <circle cx="50" cy="50" r="30" strokeWidth="0.3" />
              <circle cx="50" cy="50" r="20" strokeWidth="0.3" />
              {[...Array(24)].map((_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="50"
                  x2={50 + 46 * Math.cos((i * 15 * Math.PI) / 180)}
                  y2={50 + 46 * Math.sin((i * 15 * Math.PI) / 180)}
                  strokeWidth="0.1"
                />
              ))}
            </motion.svg>
          </div>

          {/* Slow-pulsing warm aura blobs */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-amber-200/25 rounded-full blur-3xl animate-pulse pointer-events-none -z-10" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-orange-200/25 rounded-full blur-3xl animate-pulse pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column Content - occupies 7 cols */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="lg:col-span-7 space-y-6 text-left"
              >
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 px-4 py-2 rounded-full shadow-sm">
                  <Star className="w-4 h-4 text-amber-700" aria-hidden="true" />
                  <span className="text-amber-800 text-xs font-black tracking-widest uppercase">OUR HERITAGE</span>
                </div>
                
                <h1
                  id="hero-heading"
                  className="font-serif text-5xl md:text-6xl lg:text-7xl font-black text-[#3E2314] leading-tight"
                >
                  A Legacy of <span className="text-[#D63220] italic bg-gradient-to-r from-[#D63220] to-[#E65C19] bg-clip-text text-transparent">Authentic</span> Indian Flavors
                </h1>

                {/* Decorative short divider line */}
                <div className="w-20 h-1 bg-gradient-to-r from-[#D63220] to-amber-500 rounded-full" />

                <p className="text-base md:text-lg text-slate-700 leading-relaxed font-semibold max-w-xl">
                  For over two decades, Matasree Super has been bringing the finest, pure, stone-ground spices from India's most fertile fields directly to gourmet home kitchens and culinary businesses nationwide.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <a
                    href="#process-heading"
                    className="px-6 py-3.5 bg-gradient-to-r from-amber-600 via-orange-600 to-[#D63220] hover:from-amber-700 hover:via-orange-700 hover:to-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
                  >
                    Our Process
                  </a>
                  <a
                    href="#testimonials-heading"
                    className="px-6 py-3.5 bg-white border-2 border-amber-100 hover:border-amber-300 text-amber-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:scale-105 transition-all duration-300 cursor-pointer"
                  >
                    Reviews
                  </a>
                </div>
              </motion.div>

              {/* Right Column Layered Image Showcase - occupies 5 cols */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="lg:col-span-5 flex justify-center lg:justify-end relative mt-8 lg:mt-0"
              >
                {/* Main Base Card with Official Matasree Brand Logo Emblem */}
                <div className="relative w-full max-w-[340px] aspect-[4/5] bg-gradient-to-b from-[#FAF6F0] via-white to-[#F5EBE0] rounded-3xl p-6 border-2 border-[#C89B3C]/40 shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden group flex flex-col justify-between items-center text-center">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,155,60,0.1),transparent)] pointer-events-none" />
                  
                  {/* Official Logo Frame */}
                  <div className="w-full h-[65%] rounded-2xl bg-white border border-[#C89B3C]/30 flex items-center justify-center p-6 relative shadow-inner group-hover:scale-105 transition-transform duration-500">
                    <img 
                      src={logo} 
                      alt="Matasree Super Masale Official Brand Logo" 
                      className="max-h-full max-w-full object-contain drop-shadow-xl"
                    />
                  </div>

                  {/* Details inside the card */}
                  <div className="mt-4 space-y-1.5 z-10">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
                      <span className="text-[11px] font-black text-[#3E2314] uppercase tracking-widest">ESTD 2008 • DEHRADUN</span>
                    </div>
                    <h3 className="font-serif text-lg font-black text-[#3E2314] leading-tight">MATASREE SUPER MASALE</h3>
                    <p className="text-[#3E2314]/70 text-xs font-serif font-medium">
                      100% Pure Himalayan Stone-Ground Spices
                    </p>
                  </div>
                </div>

                {/* Overlapping Glassmorphic Badge Card (Floats bottom-left) */}
                <motion.div
                  className="absolute bottom-6 -left-4 md:-left-8 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-amber-200/80 shadow-xl max-w-[180px] pointer-events-none"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <BadgeCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-900 uppercase tracking-wider">FSSAI Certified</p>
                      <p className="text-[9px] font-bold text-slate-600">Lic. 22626030001734</p>
                    </div>
                  </div>
                </motion.div>

                {/* Second Floating Ornament Badge (Floats top-right) */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-amber-200/80 shadow-lg pointer-events-none flex items-center gap-2"
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <Award className="w-5 h-5 text-amber-600" />
                  <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider">20+ YRS LEGACY</span>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Brand Story */}
        <section aria-labelledby="brand-story-heading" className="py-20 md:py-28 bg-[#FDFBF9]">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="inline-block text-[#D63220] font-black text-sm uppercase tracking-[0.2em] mb-4 bg-[#D63220]/10 px-3 py-1 rounded-full">
                  Since 2008
                </span>
                <h2
                  id="brand-story-heading"
                  className="font-serif text-3xl md:text-4xl lg:text-5xl font-black text-[#3E2314] mb-8 leading-tight"
                >
                  From Humble Beginnings to National Pride
                </h2>
                <div className="space-y-5 text-[#3E2314]/65 leading-relaxed font-semibold">
                  <p>
                    In 2008, our founder Shri Sanjay Bansal started Matasree Super Industries with a
                    vision to provide families with premium, pure spices that enhance the taste of every
                    dish. What began as a small operation in Clement Town, Dehradun, has grown into a
                    trusted name across India.
                  </p>
                  <p>
                    Over the past 20 years, Matasree Super products have reached millions of households,
                    restaurants, and food businesses across the country. We built our reputation on three
                    uncompromising pillars — quality, authenticity, and customer trust.
                  </p>
                  <p>
                    Our commitment remains unchanged: source the finest raw materials, use traditional
                    grinding techniques, and maintain the highest quality standards in every packet we
                    produce. Every product is lab-tested for purity and safety before it reaches your kitchen.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-br from-[#D63220]/10 to-[#8B4513]/10 rounded-3xl opacity-30 blur-2xl" aria-hidden="true" />
                <div className="relative bg-gradient-to-b from-[#FAF6F0] via-white to-[#F5EBE0] rounded-3xl p-6 border-2 border-[#C89B3C]/40 shadow-[0_30px_80px_rgba(62,35,20,0.12)] text-center flex flex-col items-center justify-center">
                  <div className="w-full h-80 rounded-2xl bg-white border border-[#C89B3C]/30 flex items-center justify-center p-4 shadow-inner mb-4 overflow-hidden group">
                    <img
                      src="/official-products/all6.png"
                      alt="Matasree Super Masale 100g Official Signature Box Packaging Collection"
                      className="max-h-full max-w-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest block mb-1">
                    ✦ Authentic Factory Packaging ✦
                  </span>
                  <h3 className="font-serif font-black text-lg text-[#3E2314]">
                    Matasree 100g Signature Spice Series
                  </h3>
                  <p className="text-[#3E2314]/70 text-xs font-serif font-medium mt-1">
                    Sealed in Dehradun with tamper-proof aroma-lock pouches &amp; FSSAI batch certification.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Ornate Founder Callout */}
        <section className="py-12 bg-[#FDFBF9]">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="card-ornate-fancy relative p-10 md:p-12 text-center overflow-hidden"
            >
              <div className="absolute -right-16 -top-16 w-36 h-36 bg-amber-100/40 rounded-full blur-2xl" />
              <Quote className="w-12 h-12 text-[#D63220]/25 mx-auto mb-6" />
              <p className="font-serif text-xl md:text-2xl text-amber-950/85 italic leading-relaxed max-w-3xl mx-auto font-bold">
                "Spices are not just cooking ingredients; they are the heart of Indian heritage and the thread that binds families together at the dinner table. Our mission is to keep this thread pure, fragrant, and true."
              </p>
              <div className="h-0.5 w-16 bg-[#D63220]/30 mx-auto my-6" />
              <p className="font-bold text-amber-900 text-lg">Shri Sanjay Bansal</p>
              <p className="text-amber-800/60 text-xs uppercase tracking-widest font-black mt-1">Founder, Matasree Super Industries</p>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section
          aria-labelledby="impact-heading"
          className="py-24 bg-gradient-to-r from-[#D63220]/5 via-[#E65C19]/5 to-[#D63220]/5 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-30" aria-hidden="true" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#D63220]/10 rounded-full blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#E65C19]/10 rounded-full blur-3xl" aria-hidden="true" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <h2
                id="impact-heading"
                className="font-serif text-3xl md:text-4xl font-black text-[#3E2314]"
              >
                Our Impact in Numbers
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                  className="text-center group bg-white/75 backdrop-blur-sm border border-[#D63220]/10 rounded-3xl p-6 hover:bg-white hover:border-[#D63220]/30 transition-all duration-300 shadow-[0_4px_20px_rgba(62,35,20,0.04)] hover:shadow-[0_20px_50px_rgba(62,35,20,0.08)]"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D63220]/15 to-[#E65C19]/15 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-all duration-300">
                    <stat.icon className="w-8 h-8 text-[#D63220]" aria-hidden="true" />
                  </div>
                  <p className="font-serif text-4xl md:text-5xl font-black text-[#D63220] mb-2">
                    <Counter value={stat.value} />
                  </p>
                  <p className="text-[#3E2314]/50 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Milestone Timeline */}
        <section className="py-24 bg-[#FDFBF9] relative overflow-hidden">
          <div className="container mx-auto px-4 max-w-5xl relative z-10">
            <div className="text-center mb-16">
              <span className="text-[#D63220] font-black tracking-[0.25em] uppercase text-xs mb-3 block">Our Heritage</span>
              <h2 className="font-serif text-4xl md:text-5xl font-black text-[#3E2314]">Chronology of Growth</h2>
              <div className="h-1 w-20 bg-gradient-to-r from-transparent via-[#D63220] to-transparent rounded-full mx-auto mt-4" />
            </div>

            <div className="relative">
              {/* Central Line */}
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#D63220] via-[#E65C19] to-[#8B4513] -translate-x-1/2" />

              <div className="space-y-12">
                {milestones.map((ms, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <div key={idx} className="relative flex flex-col md:flex-row items-stretch md:justify-between group">
                      {/* Point */}
                      <div className="absolute left-4 md:left-1/2 top-6 w-8 h-8 rounded-full bg-white border-4 border-[#D63220] -translate-x-1/2 z-10 flex items-center justify-center shadow-lg group-hover:scale-125 transition-transform duration-300">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#D63220] animate-pulse" />
                      </div>

                      {/* Content Card */}
                      <div className={`pl-12 md:pl-0 w-full md:w-[45%] ${isEven ? 'md:text-right' : 'md:order-last'}`}>
                        <motion.div
                          initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, margin: "-100px" }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          className="bg-white rounded-2xl p-6 border-2 border-amber-100 hover:border-amber-300 shadow-md hover:shadow-xl transition-all duration-500"
                        >
                          <span className="inline-block text-xl font-black text-[#D63220] mb-2">{ms.year}</span>
                          <h3 className="font-serif text-lg font-bold text-[#3E2314] mb-2">{ms.title}</h3>
                          <p className="text-[#3E2314]/65 text-xs md:text-sm font-semibold leading-relaxed">{ms.description}</p>
                        </motion.div>
                      </div>

                      {/* Spacer for desktop alignment */}
                      <div className="hidden md:block w-[45%]" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Spice & Flavor Library Explorer */}
        <section className="py-24 bg-[#FFFBF7] border-t border-b border-amber-100/50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <span className="text-[#D63220] font-black tracking-[0.25em] uppercase text-xs mb-3 block">Spice Library</span>
              <h2 className="font-serif text-4xl md:text-5xl font-black text-[#3E2314]">Explore Our Signature Ingredients</h2>
              <div className="h-1 w-20 bg-gradient-to-r from-transparent via-[#D63220] to-transparent rounded-full mx-auto mt-4" />
            </div>

            {/* Tab switchers */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {spiceLibrary.map((spice) => (
                <button
                  key={spice.key}
                  type="button"
                  onClick={() => setActiveSpiceKey(spice.key)}
                  className={`px-6 py-3 rounded-full text-xs font-black tracking-wider transition-all duration-300 border-2 ${
                    activeSpiceKey === spice.key
                      ? 'text-white border-transparent shadow-md'
                      : 'bg-white border-amber-100 text-[#3E2314]/80 hover:border-amber-300'
                  }`}
                  style={{ backgroundColor: activeSpiceKey === spice.key ? spice.color : undefined }}
                >
                  {spice.title.toUpperCase().replace(' POWDER', '')}
                </button>
              ))}
            </div>

            {/* Active Display Panel */}
            <div className="bg-white rounded-3xl border border-amber-100 shadow-xl overflow-hidden min-h-[420px] flex flex-col lg:flex-row items-stretch">
              {/* Left description */}
              <div className="flex-1 p-8 md:p-12 flex flex-col justify-between relative">
                <div className="space-y-6">
                  <div>
                    <span 
                      className="inline-block text-[10px] font-black tracking-widest text-white px-3 py-1.5 rounded-md"
                      style={{ backgroundColor: activeSpice.color }}
                    >
                      {activeSpice.scientific.toUpperCase()}
                    </span>
                    <h3 className="font-serif text-3xl font-black text-[#3E2314] mt-3">{activeSpice.title}</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] uppercase text-[#3E2314]/40 font-bold mb-1">Origin Sourcing</p>
                      <p className="text-[#3E2314]">{activeSpice.sourcing}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] uppercase text-[#3E2314]/40 font-bold mb-1">Chemical Specification</p>
                      <p className="text-[#3E2314]">{activeSpice.highlight}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 text-sm leading-relaxed text-[#3E2314]/75">
                    <p><strong>Aroma & Flavor:</strong> {activeSpice.profile}</p>
                    <p><strong>Health & Wellness:</strong> {activeSpice.benefits}</p>
                    <p><strong>Craft Grinding:</strong> {activeSpice.processing}</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-amber-50 text-[10px] font-black text-amber-900/60 uppercase tracking-widest">
                  ★ Matasree Super Quality Standard
                </div>
              </div>

              {/* Right Image */}
              <div className="w-full lg:w-[40%] min-h-[300px] lg:min-h-full relative overflow-hidden bg-amber-50 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeSpiceKey}
                    src={activeSpice.img}
                    alt={activeSpice.title}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* Manufacturing Process Interactive Dashboard */}
        <section
          aria-labelledby="process-heading"
          className="relative py-24 md:py-28 bg-[#FDFBF9] overflow-hidden"
        >
          <div className="absolute top-[-10%] right-0 w-[500px] h-[500px] bg-[#E65C19]/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-[-10%] left-0 w-[500px] h-[500px] bg-[#D63220]/3 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />

          <div className="container mx-auto px-4 max-w-5xl relative z-10">
            <div className="text-center mb-16">
              <span className="text-[#E65C19] font-black tracking-[0.3em] uppercase text-xs mb-3 block">
                Farm to Table
              </span>
              <h2
                id="process-heading"
                className="font-serif text-4xl md:text-5xl font-black text-[#3E2314] tracking-tight"
              >
                Our Premium{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#8B4513] italic">
                  Manufacturing Process
                </span>
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-transparent via-[#E65C19] to-transparent rounded-full mx-auto mt-4" />
            </div>

            {/* Dashboard Container */}
            <div className="bg-white rounded-3xl border border-amber-100/70 shadow-xl overflow-hidden p-6 md:p-10 flex flex-col md:flex-row items-stretch gap-8">
              <div className="md:w-1/3 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 border-b md:border-b-0 md:border-r border-amber-100 pr-0 md:pr-6 flex-shrink-0">
                {processSteps.map((step, idx) => (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => setActiveStepIdx(idx)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-300 flex-shrink-0 md:w-full ${
                      activeStepIdx === idx
                        ? 'bg-amber-50 text-amber-900 border border-amber-200 shadow-sm'
                        : 'hover:bg-amber-50/50 text-[#3E2314]/65 border border-transparent'
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
                      style={{ backgroundColor: step.accent }}
                    >
                      {step.number}
                    </div>
                    <span className="font-serif font-black text-sm hidden md:inline">{step.title}</span>
                  </button>
                ))}
              </div>

              {/* Right Detail Panel */}
              <div className="flex-1 flex flex-col justify-between min-h-[300px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStepIdx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: `${currentStep.accent}15` }}
                      >
                        <StepIcon className="w-6 h-6" style={{ color: currentStep.accent }} />
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Step {currentStep.number}</span>
                        <h3 className="font-serif text-2xl font-black text-[#3E2314] leading-tight">{currentStep.title}</h3>
                      </div>
                    </div>

                    <p className="text-[#3E2314]/70 text-sm leading-relaxed font-semibold">
                      {currentStep.extendedDescription}
                    </p>

                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-black uppercase tracking-wider text-[#3E2314]/40">Process Quality Checkpoints:</p>
                      <div className="grid md:grid-cols-2 gap-2">
                        {currentStep.checks.map((chk, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                            <span 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: currentStep.accent }}
                            />
                            <span>{chk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Dashboard Navigator */}
                <div className="mt-8 pt-6 border-t border-amber-50 flex justify-between items-center">
                  <span className="text-[10px] font-black tracking-widest text-[#3E2314]/40">ACTIVE STEP: {currentStep.number}/05</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={activeStepIdx === 0}
                      onClick={() => setActiveStepIdx(prev => Math.max(0, prev - 1))}
                      className="px-4 py-2 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 text-amber-900 text-xs font-black rounded-lg border border-amber-200 transition-colors disabled:cursor-not-allowed"
                    >
                      PREV
                    </button>
                    <button
                      type="button"
                      disabled={activeStepIdx === processSteps.length - 1}
                      onClick={() => setActiveStepIdx(prev => Math.min(processSteps.length - 1, prev + 1))}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-black rounded-lg border border-amber-600 transition-colors disabled:cursor-not-allowed"
                    >
                      NEXT
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ━━━━ OFFICIAL PACKAGING & PRODUCT BOX SHOWCASE ━━━━ */}
        <section aria-label="Official Packaging Showcase" className="py-20 bg-gradient-to-b from-[#F9F5EE] to-[#FFFDF9] border-y border-[#3E2314]/5">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="inline-block text-[11px] font-bold tracking-[0.24em] uppercase text-[#D63220] mb-3">
                ✦ Authentic 100g Box Packaging ✦
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-black text-[#3E2314] tracking-tight mb-4">
                Original Matasree Box Designs
              </h2>
              <p className="text-base text-[#3E2314]/70 font-medium">
                Our signature 100g, 200g, and 500g spice boxes featuring tamper-evident foil seals, nutritional specs, and FSSAI certified batch tracking.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Garam Masala (100g)', img: '/official-products/Garam Masala 1.png', tag: 'Signature Blend' },
                { title: 'Super Lal Tadka Red Chilli (100g)', img: '/official-products/Super Lal Tadka 1.png', tag: 'Fiery Heat' },
                { title: 'Kitchen King All-Purpose (100g)', img: '/official-products/Kitchen King 4.png', tag: 'Best Seller' },
                { title: 'Sampuran Spice Box Series', img: '/official-products/Sampuran Masala 6.png', tag: 'Heritage Range' },
                { title: 'Chaat Masala (100g)', img: '/official-products/Chaat Masala 6.png', tag: 'Tangy Flavor' },
                { title: 'Meat Masala (100g)', img: '/official-products/Meat Masala 1.png', tag: 'Rich & Aromatic' },
              ].map((box, idx) => (
                <motion.div
                  key={box.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="group bg-white rounded-3xl p-5 border border-[#C89B3C]/30 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="w-full h-56 flex items-center justify-center p-3 relative overflow-hidden rounded-2xl bg-[#FAF6F0]">
                    <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                      {box.tag}
                    </span>
                    <img
                      src={box.img}
                      alt={box.title}
                      className="max-h-full max-w-full object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="font-serif font-bold text-lg text-[#3E2314] leading-snug group-hover:text-[#D63220] transition-colors">
                      {box.title}
                    </h3>
                    <p className="text-xs text-[#3E2314]/60 font-semibold mt-1">
                      100% Pure Stone-Ground • Sealed Fresh
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Quality Assurance */}
        <section
          aria-labelledby="quality-heading"
          className="py-24 bg-gradient-to-br from-[#3E2314] via-[#5A2D0E] to-[#8B4513] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#F4D03F]/30 to-transparent" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#F4D03F]/20 to-transparent" aria-hidden="true" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#D63220]/10 rounded-full blur-[100px]" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#E65C19]/10 rounded-full blur-[100px]" aria-hidden="true" />

          <div className="container mx-auto px-4 max-w-5xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <span className="text-[#F4D03F] font-black tracking-[0.3em] uppercase text-xs mb-3 block">
                Our Standards
              </span>
              <h2
                id="quality-heading"
                className="font-serif text-4xl md:text-5xl font-black text-white mb-4 tracking-tight"
              >
                Quality{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4D03F] to-[#E65C19]">
                  Assurance
                </span>
              </h2>
              <p className="text-white/60 max-w-xl mx-auto text-base font-medium">
                Every packet of Matasree masala is the result of relentless quality control —
                from the field to your kitchen shelf.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {qualityPillars.map((pillar, index) => {
                const Icon = pillar.icon;
                const isLastOddItem = index === 2 && qualityPillars.length === 3;
                return (
                  <motion.div
                    key={pillar.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className={`group bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2rem] p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-500 ${
                      isLastOddItem ? 'md:col-span-2 md:max-w-md md:mx-auto w-full' : ''
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-all duration-300"
                      style={{ backgroundColor: `${pillar.accent}20` }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: pillar.accent === '#8B4513' ? '#F4D03F' : pillar.accent }}
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-white mb-2 group-hover:text-[#F4D03F] transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-white/50 text-sm leading-relaxed font-semibold">{pillar.body}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* FSSAI Registration Verification Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-16 flex justify-center"
            >
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2rem] p-8 max-w-lg w-full text-center relative overflow-hidden group hover:border-[#F4D03F]/30 transition-all duration-300">
                {/* Background decorative ring */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8" />
                
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/30">
                    <BadgeCheck className="w-8 h-8 text-emerald-400" />
                  </div>
                  
                  <span className="text-[#F4D03F] text-[10px] font-black tracking-widest uppercase mb-1">
                    OFFICIAL CERTIFICATION
                  </span>
                  <h3 className="font-serif text-xl font-bold text-white mb-2">FSSAI Registered Manufacturer</h3>
                  
                  <div className="h-px w-16 bg-white/20 my-3" />
                  
                  <div className="space-y-2 text-left w-full text-white/70 text-xs font-semibold px-2">
                    <div className="flex justify-between border-b border-white/5 pb-1.5">
                      <span className="text-white/40">Registration No.</span>
                      <span className="text-emerald-400 font-bold">22626030001734 ✓</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1.5">
                      <span className="text-white/40">Business Name</span>
                      <span className="text-white">MATASREE SUPER MASALE</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1.5">
                      <span className="text-white/40">Kind of Business</span>
                      <span className="text-white">Manufacturer / Repacker</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1.5">
                      <span className="text-white/40">State / PIN Code</span>
                      <span className="text-white">Uttarakhand / 248002</span>
                    </div>
                    <div className="flex flex-col pt-1.5">
                      <span className="text-white/40 mb-1">Registered Address:</span>
                      <span className="text-white/80 font-normal leading-relaxed text-[11px]">
                        C-20, Gokul Enclave, Clement Town, Turner Road, Dehradun Nagar Nigam, Dehradun, Uttarakhand – 248002
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section
          aria-labelledby="why-choose-heading"
          className="py-24 md:py-32 bg-[#FDFBF9] relative overflow-hidden"
        >
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#E65C19]/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#D63220]/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />

          <div className="container mx-auto px-4 max-w-5xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <span className="text-[#D63220] font-black tracking-[0.3em] uppercase text-xs mb-3 block">
                Why Choose Us
              </span>
              <h2
                id="why-choose-heading"
                className="font-serif text-4xl md:text-5xl font-black text-[#3E2314] tracking-tight leading-[1.05]"
              >
                The Matasree{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#8B4513] italic">
                  Difference
                </span>
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-transparent via-[#D63220] to-transparent rounded-full mx-auto mt-4" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {valuePropositions.map((vp, index) => (
                <ValueCard key={vp.title} vp={vp} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Customer Success Stories */}
        <aside
          aria-labelledby="testimonials-heading"
          className="py-20 bg-gradient-to-br from-[#FFF8F5] via-[#FDFBF9] to-[#FFF5F0] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-80 h-80 bg-[#D63220]/5 rounded-full blur-[100px]" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#E65C19]/5 rounded-full blur-[100px]" aria-hidden="true" />

          <div className="container mx-auto px-4 max-w-5xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <span className="text-[#D63220] font-black tracking-[0.3em] uppercase text-xs mb-3 block">
                Real Stories
              </span>
              <h2
                id="testimonials-heading"
                className="font-serif text-4xl md:text-5xl font-black text-[#3E2314] tracking-tight"
              >
                Customer{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#8B4513] italic">
                  Success Stories
                </span>
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-transparent via-[#D63220] to-transparent rounded-full mx-auto mt-4" />
            </motion.div>

            <div className="relative w-full overflow-hidden py-2">
              <div className="flex gap-6 marquee-track w-max">
                {[...testimonials, ...testimonials, ...testimonials].map((t, index) => (
                  <div key={`${t.name}-${index}`} className="w-[340px] flex-shrink-0">
                    <TestimonialCard t={t} index={index % testimonials.length} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Contact & Company Info */}
        <section
          aria-labelledby="contact-heading"
          className="py-24 bg-[#FDFBF9] relative overflow-hidden border-t border-amber-100/50"
        >
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#D63220]/10 rounded-full blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#E65C19]/10 rounded-full blur-3xl" aria-hidden="true" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-12"
              >
                <span className="inline-block text-[#D63220] font-black text-xs uppercase tracking-[0.2em] mb-3 bg-[#D63220]/10 px-4 py-2 rounded-full">
                  Get in Touch
                </span>
                <h2
                  id="contact-heading"
                  className="font-serif text-3xl md:text-4xl font-black text-[#3E2314] mb-3"
                >
                  Matasree Super Industries
                </h2>
                <p className="text-[#3E2314]/50 font-bold text-xs uppercase tracking-widest">Private Limited · Est. 2008</p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Address */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.8, delay: 0 }}
                  className="bg-white rounded-[2rem] p-6 border border-[#3E2314]/5 hover:border-[#3E2314]/15 hover:shadow-lg transition-all duration-500"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#D63220]/10 flex items-center justify-center mb-4">
                    <MapPin className="w-5 h-5 text-[#D63220]" aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#3E2314] mb-2">Address</h3>
                  <p className="text-[#3E2314]/60 text-xs leading-relaxed font-semibold">
                    Clement Town, Dehradun<br />
                    Uttarakhand, India
                  </p>
                </motion.div>

                {/* Phone */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.8, delay: 0.08 }}
                  className="bg-white rounded-[2rem] p-6 border border-[#3E2314]/5 hover:border-[#3E2314]/15 hover:shadow-lg transition-all duration-500"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#E65C19]/10 flex items-center justify-center mb-4">
                    <Phone className="w-5 h-5 text-[#E65C19]" aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#3E2314] mb-2">Phone</h3>
                  <div className="space-y-1.5">
                    <a
                      href="tel:+917505675163"
                      className="block text-[#3E2314]/60 text-xs font-semibold hover:text-[#D63220] transition-colors"
                    >
                      +91 7505675163
                    </a>
                    <a
                      href="tel:+916397415400"
                      className="block text-[#3E2314]/60 text-xs font-semibold hover:text-[#D63220] transition-colors"
                    >
                      +91 6397415400
                    </a>
                  </div>
                </motion.div>

                {/* Business Hours */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.8, delay: 0.16 }}
                  className="bg-white rounded-[2rem] p-6 border border-[#3E2314]/5 hover:border-[#3E2314]/15 hover:shadow-lg transition-all duration-500"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#8B4513]/10 flex items-center justify-center mb-4">
                    <Clock className="w-5 h-5 text-[#8B4513]" aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#3E2314] mb-2">Business Hours</h3>
                  <div className="space-y-1 text-xs font-semibold">
                    <div className="flex justify-between text-[#3E2314]/60">
                      <span>Mon – Sat</span>
                      <span>9:00 AM – 6:00 PM</span>
                    </div>
                    <div className="flex justify-between text-[#3E2314]/40">
                      <span>Sunday</span>
                      <span>Closed</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Site footer */}
      <footer role="contentinfo">
        <Footer />
      </footer>

      <CartDrawer />
    </div>
  );
};

export default AboutPage;
