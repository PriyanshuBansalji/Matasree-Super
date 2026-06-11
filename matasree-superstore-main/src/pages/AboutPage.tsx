import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
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
} from 'lucide-react';
import heroImage from '@/assets/hero-spices.jpg';
import logo from '@/assets/matasree-logo.png';
import posterImage from '@/assets/matasree-poster.jpg';
import PageHelmet from '@/components/PageHelmet';
import JsonLd, {
  buildOrganizationSchema,
  buildLocalBusinessSchema,
} from '@/components/JsonLd';

// ─── Data ───────────────────────────────────────────────────────────────────

const stats = [
  { icon: Award, value: '20+', label: 'Years of Excellence' },
  { icon: Users, value: '50K+', label: 'Happy Customers' },
  { icon: Leaf, value: '15+', label: 'Premium Products' },
  { icon: TrendingUp, value: '100+', label: 'Partner Stores' },
];

interface ProcessStep {
  number: string;
  title: string;
  description: string;
  icon: React.ElementType;
  accent: string;
}

const processSteps: ProcessStep[] = [
  {
    number: '01',
    title: 'Farm Sourcing',
    description: "Hand-picked from India's finest spice gardens by trusted partner farmers.",
    icon: Sprout,
    accent: '#D63220',
  },
  {
    number: '02',
    title: 'Quality Testing',
    description: 'Every raw material is lab-tested for purity, potency, and food safety.',
    icon: Microscope,
    accent: '#E65C19',
  },
  {
    number: '03',
    title: 'Traditional Grinding',
    description: 'Stone-ground in small batches at low temperature to preserve essential oils.',
    icon: Wind,
    accent: '#8B4513',
  },
  {
    number: '04',
    title: 'Vacuum Packaging',
    description: 'Triple-sealed vacuum packs lock in freshness, aroma, and colour.',
    icon: Package,
    accent: '#D63220',
  },
  {
    number: '05',
    title: 'Safe Delivery',
    description: 'Temperature-controlled dispatch to your doorstep, anywhere in India.',
    icon: Truck,
    accent: '#E65C19',
  },
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
  },
  {
    icon: Sparkles,
    title: 'ISO-Aligned Processes',
    body: 'Our manufacturing unit follows ISO-aligned SOPs for hygiene, temperature control, and packaging integrity.',
    accent: '#D63220',
  },
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

interface ProcessStepCardProps {
  step: ProcessStep;
  index: number;
  scrollProgress: ReturnType<typeof useScroll>['scrollYProgress'];
}

const ProcessStepCard = ({ step, index, scrollProgress }: ProcessStepCardProps) => {
  const Icon = step.icon;
  const smoothProgress = useSpring(scrollProgress, { damping: 30, stiffness: 80 });
  const yOffsets: [string, string][] = [
    ['8%', '-8%'],
    ['-12%', '12%'],
    ['10%', '-10%'],
    ['-8%', '8%'],
    ['6%', '-6%'],
  ];
  const parallaxY = useTransform(
    smoothProgress,
    [0, 1],
    yOffsets[index % yOffsets.length],
  );

  return (
    <motion.div style={{ y: parallaxY }} className="group relative text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 60 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative mx-auto mb-8">
          <div
            className="w-[5.5rem] h-[5.5rem] rounded-[1.5rem] flex items-center justify-center mx-auto bg-white border-2 border-[#3E2314]/5 group-hover:border-[#3E2314]/15 shadow-[0_8px_30px_rgba(62,35,20,0.06)] group-hover:shadow-[0_20px_50px_rgba(62,35,20,0.12)] transition-all duration-700 group-hover:scale-110 group-hover:-rotate-6 relative overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `radial-gradient(circle, ${step.accent}10, transparent)` }}
            />
            <Icon className="w-9 h-9 relative z-10 transition-colors duration-300" style={{ color: step.accent }} />
          </div>
          <div
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg z-10"
            style={{ backgroundColor: step.accent }}
          >
            {step.number}
          </div>
        </div>
        <h3 className="font-serif text-xl font-black text-[#3E2314] mb-3 group-hover:text-[#D63220] transition-colors">
          {step.title}
        </h3>
        <p className="text-[#3E2314]/50 text-sm leading-relaxed font-medium max-w-[200px] mx-auto">
          {step.description}
        </p>
      </motion.div>
    </motion.div>
  );
};

interface ValueCardProps {
  vp: ValueProp;
  index: number;
}

const ValueCard = ({ vp, index }: ValueCardProps) => {
  const Icon = vp.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="group relative h-full"
    >
      <div
        className="absolute -inset-1 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${vp.accent}20, transparent)` }}
      />
      <div className="relative p-10 bg-white border border-[#3E2314]/5 rounded-[2rem] hover:border-[#3E2314]/15 transition-all duration-700 shadow-[0_8px_30px_rgba(62,35,20,0.04)] hover:shadow-[0_25px_60px_rgba(62,35,20,0.1)] h-full">
        <div
          className="absolute top-0 left-8 right-8 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(90deg, transparent, ${vp.accent}, transparent)` }}
        />
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6"
          style={{ backgroundColor: `${vp.accent}10` }}
        >
          <Icon className="w-8 h-8 transition-colors duration-300" style={{ color: vp.accent }} />
        </div>
        <h3 className="font-serif text-2xl font-black text-[#3E2314] mb-4 group-hover:text-[#D63220] transition-colors leading-tight">
          {vp.title}
        </h3>
        <p className="text-[#3E2314]/60 text-base leading-relaxed font-medium">{vp.description}</p>
      </div>
    </motion.div>
  );
};

interface TestimonialCardProps {
  t: Testimonial;
  index: number;
}

const TestimonialCard = ({ t, index }: TestimonialCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    className="group relative bg-white border border-[#3E2314]/5 rounded-[2rem] p-8 shadow-[0_8px_30px_rgba(62,35,20,0.04)] hover:shadow-[0_25px_60px_rgba(62,35,20,0.1)] hover:border-[#3E2314]/15 transition-all duration-700"
  >
    <Quote className="w-10 h-10 text-[#D63220]/20 mb-4" />
    <p className="text-[#3E2314]/70 text-base leading-relaxed font-medium mb-6 italic">
      "{t.quote}"
    </p>
    <div className="flex items-center gap-1 mb-4">
      {Array.from({ length: t.rating }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-[#D63220] text-[#D63220]" />
      ))}
    </div>
    <div className="border-t border-[#3E2314]/5 pt-4">
      <p className="font-serif font-black text-[#3E2314] text-lg">{t.name}</p>
      <p className="text-[#3E2314]/40 text-sm font-medium">
        {t.role} · {t.location}
      </p>
    </div>
  </motion.div>
);

// ─── Page ────────────────────────────────────────────────────────────────────

const AboutPage = () => {
  const processRef = useRef<HTMLElement>(null);
  const { scrollYProgress: processScroll } = useScroll({
    target: processRef,
    offset: ['start end', 'end start'],
  });
  const lineScaleX = useTransform(processScroll, [0.15, 0.55], [0, 1]);

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
      {/* ── Skip Navigation (accessibility) ── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-[#D63220] focus:font-bold"
      >
        Skip to main content
      </a>

      {/* ── Global nav provided by Navbar (role="banner" / <header>) ── */}
      <Navbar />

      {/* ── Main content ── */}
      <main id="main-content" role="main">

        {/* ── Hero ── */}
        <section aria-labelledby="hero-heading" className="relative py-28 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-gradient-hero" />
          </div>
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" aria-hidden="true" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl" aria-hidden="true" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-background/10 backdrop-blur-md border border-background/20 px-4 py-2 rounded-full mb-6">
                <Star className="w-4 h-4 text-primary" aria-hidden="true" />
                <span className="text-background text-sm font-medium">Our Story</span>
              </div>
              <h1
                id="hero-heading"
                className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-background mt-2 mb-6"
              >
                A Legacy of <span className="text-primary">Authentic</span> Flavors
              </h1>
              <p className="text-lg text-background/80 leading-relaxed max-w-2xl mx-auto">
                For 20+ years, Matasree Super has been bringing the finest, most authentic spices
                from across India to discerning kitchens and businesses worldwide.
              </p>
            </div>
          </div>
        </section>

        {/* ── Brand Story ── */}
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
                <div className="space-y-5 text-[#3E2314]/60 leading-relaxed font-medium">
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
                <div className="relative bg-white rounded-3xl p-8 shadow-[0_30px_80px_rgba(62,35,20,0.1)] border border-[#3E2314]/5">
                  <img
                    src={posterImage}
                    alt="Matasree Super — The King of Spices promotional poster"
                    className="w-full rounded-2xl drop-shadow-xl"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section
          aria-labelledby="impact-heading"
          className="py-28 bg-gradient-to-r from-[#D63220]/5 via-[#E65C19]/5 to-[#D63220]/5 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-30" aria-hidden="true" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#D63220]/10 rounded-full blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#E65C19]/10 rounded-full blur-3xl" aria-hidden="true" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
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
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.7, delay: index * 0.1 }}
                  className="text-center group bg-white/70 backdrop-blur-sm border border-[#D63220]/10 rounded-3xl p-8 hover:bg-white hover:border-[#D63220]/30 transition-all duration-300 shadow-[0_4px_20px_rgba(62,35,20,0.06)] hover:shadow-[0_20px_50px_rgba(62,35,20,0.1)]"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D63220]/15 to-[#E65C19]/15 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300">
                    <stat.icon className="w-10 h-10 text-[#D63220]" aria-hidden="true" />
                  </div>
                  <p className="font-serif text-5xl md:text-6xl font-black text-[#D63220] mb-3">{stat.value}</p>
                  <p className="text-[#3E2314]/50 text-sm font-medium uppercase tracking-wide">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Manufacturing Process ── */}
        <section
          ref={processRef}
          aria-labelledby="process-heading"
          className="relative py-32 lg:py-48 bg-[#FDFBF9] overflow-hidden"
        >
          <div className="absolute top-[-10%] right-0 w-[500px] h-[500px] bg-[#E65C19]/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-[-10%] left-0 w-[500px] h-[500px] bg-[#D63220]/3 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />

          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="text-center mb-24 lg:mb-32"
            >
              <span className="text-[#E65C19] font-black tracking-[0.3em] uppercase text-sm mb-6 block">
                Farm to Table
              </span>
              <h2
                id="process-heading"
                className="font-serif text-5xl md:text-7xl lg:text-8xl font-black text-[#3E2314] mb-8 tracking-tight leading-[1.1]"
              >
                Our Premium{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#8B4513] italic">
                  Process
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-[#3E2314]/60 max-w-3xl mx-auto font-medium leading-relaxed">
                Every step is crafted to ensure you receive the finest quality masalas with an
                authentic taste — no shortcuts, ever.
              </p>
            </motion.div>

            <div className="relative">
              {/* Scroll-animated connecting line (desktop) */}
              <motion.div
                className="hidden lg:block absolute top-[4.5rem] left-[10%] right-[10%] h-[2px] origin-left"
                style={{
                  scaleX: lineScaleX,
                  background: 'linear-gradient(90deg, #D63220, #E65C19, #8B4513)',
                }}
                aria-hidden="true"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-6 relative">
                {processSteps.map((step, index) => (
                  <ProcessStepCard
                    key={step.number}
                    step={step}
                    index={index}
                    scrollProgress={processScroll}
                  />
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-center mt-20 pt-10 border-t border-[#3E2314]/5"
            >
              <p className="text-[#3E2314]/40 max-w-2xl mx-auto text-base leading-relaxed font-medium">
                From farm to table, every masala undergoes rigorous quality checks to ensure you
                receive nothing but the most authentic flavours India has to offer.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── Quality Assurance ── */}
        <section
          aria-labelledby="quality-heading"
          className="py-24 md:py-32 bg-gradient-to-br from-[#3E2314] via-[#5A2D0E] to-[#8B4513] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#F4D03F]/30 to-transparent" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#F4D03F]/20 to-transparent" aria-hidden="true" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#D63220]/10 rounded-full blur-[100px]" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#E65C19]/10 rounded-full blur-[100px]" aria-hidden="true" />

          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9 }}
              className="text-center mb-20"
            >
              <span className="text-[#F4D03F] font-black tracking-[0.3em] uppercase text-sm mb-6 block">
                Our Standards
              </span>
              <h2
                id="quality-heading"
                className="font-serif text-5xl md:text-6xl font-black text-white mb-6 tracking-tight"
              >
                Quality{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4D03F] to-[#E65C19]">
                  Assurance
                </span>
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
                Every packet of Matasree masala is the result of relentless quality control —
                from the field to your kitchen shelf.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {qualityPillars.map((pillar, index) => {
                const Icon = pillar.icon;
                return (
                  <motion.div
                    key={pillar.title}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2rem] p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300"
                      style={{ backgroundColor: `${pillar.accent}20` }}
                    >
                      <Icon
                        className="w-7 h-7"
                        style={{ color: pillar.accent === '#8B4513' ? '#F4D03F' : pillar.accent }}
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="font-serif text-xl font-black text-white mb-3 group-hover:text-[#F4D03F] transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-white/50 text-base leading-relaxed font-medium">{pillar.body}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Logo showcase */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="mt-20 flex justify-center"
            >
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2.5rem] p-10 max-w-xs w-full text-center">
                <img
                  src={logo}
                  alt="Matasree Super logo"
                  className="w-40 mx-auto drop-shadow-[0_20px_40px_rgba(244,208,63,0.2)]"
                />
                <p className="text-white/40 text-sm font-medium mt-6">
                  Matasree Super Industries Pvt. Ltd. · Est. 2008
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Why Choose Us ── */}
        <section
          aria-labelledby="why-choose-heading"
          className="py-32 lg:py-48 bg-[#FDFBF9] relative overflow-hidden"
        >
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#E65C19]/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#D63220]/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />

          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9 }}
              className="text-center mb-20"
            >
              <span className="text-[#D63220] font-black tracking-[0.3em] uppercase text-sm mb-6 block">
                Why Choose Us
              </span>
              <h2
                id="why-choose-heading"
                className="font-serif text-5xl md:text-7xl lg:text-8xl font-black text-[#3E2314] mb-8 tracking-tight leading-[1.05]"
              >
                The Matasree{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#8B4513] italic">
                  Difference.
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-[#3E2314]/60 max-w-3xl mx-auto font-medium leading-relaxed">
                For over two decades we have been committed to bringing you the purest, most
                flavourful spices — crafted with care, rooted in tradition.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {valuePropositions.map((vp, index) => (
                <ValueCard key={vp.title} vp={vp} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Customer Success Stories ── */}
        <aside
          aria-labelledby="testimonials-heading"
          className="py-24 md:py-32 bg-gradient-to-br from-[#FFF8F5] via-[#FDFBF9] to-[#FFF5F0] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-80 h-80 bg-[#D63220]/5 rounded-full blur-[100px]" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#E65C19]/5 rounded-full blur-[100px]" aria-hidden="true" />

          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9 }}
              className="text-center mb-20"
            >
              <span className="text-[#D63220] font-black tracking-[0.3em] uppercase text-sm mb-6 block">
                Real Stories
              </span>
              <h2
                id="testimonials-heading"
                className="font-serif text-5xl md:text-6xl font-black text-[#3E2314] mb-6 tracking-tight"
              >
                Customer{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#8B4513] italic">
                  Success Stories
                </span>
              </h2>
              <p className="text-[#3E2314]/60 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
                Thousands of kitchens and food businesses across India trust Matasree every day.
                Here is what some of them have to say.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {testimonials.map((t, index) => (
                <TestimonialCard key={t.name} t={t} index={index} />
              ))}
            </div>
          </div>
        </aside>

        {/* ── Contact & Company Info ── */}
        <section
          aria-labelledby="contact-heading"
          className="py-24 md:py-32 bg-[#FDFBF9] relative overflow-hidden"
        >
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#D63220]/10 rounded-full blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#E65C19]/10 rounded-full blur-3xl" aria-hidden="true" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.9 }}
                className="text-center mb-16"
              >
                <span className="inline-block text-[#D63220] font-black text-sm uppercase tracking-[0.2em] mb-3 bg-[#D63220]/10 px-4 py-2 rounded-full">
                  Get in Touch
                </span>
                <h2
                  id="contact-heading"
                  className="font-serif text-4xl md:text-5xl font-black text-[#3E2314] mb-4"
                >
                  Matasree Super Industries
                </h2>
                <p className="text-[#3E2314]/50 font-medium">Private Limited · Est. 2008</p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Address */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.8, delay: 0 }}
                  className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgba(62,35,20,0.06)] border border-[#3E2314]/5 hover:border-[#3E2314]/10 hover:shadow-[0_20px_50px_rgba(62,35,20,0.1)] transition-all duration-500"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#D63220]/10 flex items-center justify-center mb-6">
                    <MapPin className="w-6 h-6 text-[#D63220]" aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-lg font-black text-[#3E2314] mb-3">Address</h3>
                  <p className="text-[#3E2314]/60 text-sm leading-relaxed font-medium">
                    Clement Town, Dehradun<br />
                    Uttarakhand, India
                  </p>
                </motion.div>

                {/* Phone */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgba(62,35,20,0.06)] border border-[#3E2314]/5 hover:border-[#3E2314]/10 hover:shadow-[0_20px_50px_rgba(62,35,20,0.1)] transition-all duration-500"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#E65C19]/10 flex items-center justify-center mb-6">
                    <Phone className="w-6 h-6 text-[#E65C19]" aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-lg font-black text-[#3E2314] mb-3">Phone</h3>
                  <div className="space-y-2">
                    <a
                      href="tel:+917505675163"
                      className="block text-[#3E2314]/60 text-sm font-medium hover:text-[#D63220] transition-colors"
                    >
                      +91 7505675163
                    </a>
                    <a
                      href="tel:+916937475400"
                      className="block text-[#3E2314]/60 text-sm font-medium hover:text-[#D63220] transition-colors"
                    >
                      +91 6937475400
                    </a>
                  </div>
                </motion.div>

                {/* Business Hours */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgba(62,35,20,0.06)] border border-[#3E2314]/5 hover:border-[#3E2314]/10 hover:shadow-[0_20px_50px_rgba(62,35,20,0.1)] transition-all duration-500"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#8B4513]/10 flex items-center justify-center mb-6">
                    <Clock className="w-6 h-6 text-[#8B4513]" aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-lg font-black text-[#3E2314] mb-3">Business Hours</h3>
                  <div className="space-y-1 text-sm font-medium">
                    <div className="flex justify-between text-[#3E2314]/60">
                      <span>Mon – Fri</span>
                      <span>9:00 AM – 6:00 PM</span>
                    </div>
                    <div className="flex justify-between text-[#3E2314]/60">
                      <span>Saturday</span>
                      <span>10:00 AM – 4:00 PM</span>
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

      {/* ── Site footer ── */}
      <footer role="contentinfo">
        <Footer />
      </footer>

      <CartDrawer />
    </div>
  );
};

export default AboutPage;
