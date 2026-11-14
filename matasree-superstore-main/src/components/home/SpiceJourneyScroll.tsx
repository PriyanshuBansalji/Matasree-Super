/**
 * SpiceJourneyScroll
 *
 * On-theme brand story section. Stays on the cream #FDFBF9 palette.
 * 4 chapters with scroll-reveal, matching OurProcess and WhyChooseUsSection style.
 */
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, Sprout, Wind, Package, UtensilsCrossed } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Chapter {
  number: string;
  stage: string;
  headline: string;
  body: string;
  img: string;
  accent: string;
  Icon: LucideIcon;
}

const CHAPTERS: Chapter[] = [
  {
    number: '01',
    stage: 'Raw Ingredients',
    headline: 'Hand-Picked at Peak Ripeness',
    body: 'We work directly with farmers across Rajasthan, Kerala, and the North-East. Every batch is harvested at the precise moment — when flavour compounds are at their absolute peak.',
    img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80&auto=format&fit=crop',
    accent: '#27AE60',
    Icon: Sprout,
  },
  {
    number: '02',
    stage: 'Grinding Process',
    headline: 'Cold-Ground the Old Way',
    body: 'Our traditional stone mills run at low speeds to prevent heat build-up. Heat destroys volatile oils. Our slow grind locks in aroma, colour, and potency that modern machinery cannot replicate.',
    img: 'https://images.unsplash.com/photo-1612204103590-b8ec9b4f4e7e?w=800&q=80&auto=format&fit=crop',
    accent: '#E65C19',
    Icon: Wind,
  },
  {
    number: '03',
    stage: 'Packaging',
    headline: 'Nitrogen-Flushed. Sealed. Delivered.',
    body: 'Freshly ground masala is flushed with nitrogen and heat-sealed within hours of grinding. What reaches you still smells of the grinding room — because it should.',
    img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80&auto=format&fit=crop',
    accent: '#2980B9',
    Icon: Package,
  },
  {
    number: '04',
    stage: 'Customer Kitchen',
    headline: 'From Our Grinders to Your Handi',
    body: 'That first pinch that perfumes the whole kitchen is why we exist. Matasree Super. Elevating Indian culinary heritage, one meal at a time, since 2008.',
    img: 'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=800&q=80&auto=format&fit=crop',
    accent: '#D63220',
    Icon: UtensilsCrossed,
  },
];

const ChapterCard = ({ chapter, index }: { chapter: Chapter; index: number }) => {
  const isEven = index % 2 === 0;
  const Icon = chapter.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${isEven ? '' : 'lg:direction-rtl'}`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden rounded-[2rem] shadow-[0_20px_60px_rgba(62,35,20,0.1)] ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
        <div className="aspect-[4/3]">
          <motion.img
            src={chapter.img}
            alt={chapter.headline}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            loading="lazy"
          />
        </div>
        {/* Corner accent */}
        <div
          className="absolute top-5 left-5 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: chapter.accent }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Text */}
      <div className={`${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
        <div className="inline-flex items-center gap-3 mb-6">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-md"
            style={{ background: chapter.accent }}
          >
            {chapter.number}
          </span>
          <span
            className="text-xs font-black tracking-[0.2em] uppercase"
            style={{ color: chapter.accent }}
          >
            {chapter.stage}
          </span>
        </div>

        <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl font-black text-[#3E2314] leading-tight mb-5">
          {chapter.headline}
        </h3>

        <p className="text-[#3E2314]/60 text-lg leading-relaxed mb-8 max-w-md">
          {chapter.body}
        </p>

        {index === CHAPTERS.length - 1 && (
          <Link to="/products">
            <button className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#D63220] to-[#E65C19] text-white px-8 py-3.5 rounded-full font-bold text-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_12px_32px_rgba(214,50,32,0.3)]">
              Shop Now
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        )}
      </div>
    </motion.div>
  );
};

export const SpiceJourneyScroll = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const titleY = useTransform(scrollYProgress, [0, 0.3], ['30%', '0%']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  return (
    <section
      ref={sectionRef}
      className="py-28 lg:py-44 bg-[#FDFBF9] relative overflow-hidden"
      aria-label="The Matasree Journey"
    >
      {/* Ambient glows */}
      <div className="absolute top-[-8%] right-[-4%] w-[600px] h-[600px] bg-[#E65C19]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-8%] left-[-4%] w-[600px] h-[600px] bg-[#D63220]/4 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* Header */}
        <motion.div
          style={{ y: titleY, opacity: titleOpacity }}
          className="text-center mb-20 lg:mb-28"
        >
          <span className="text-[#D63220] font-black tracking-[0.3em] uppercase text-sm mb-6 block">
            Farm to Table
          </span>
          <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl font-black text-[#3E2314] mb-6 tracking-tight leading-[1.05]">
            The Matasree{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#8B4513] italic">
              Journey
            </span>
          </h2>
          <p className="text-xl text-[#3E2314]/55 max-w-2xl mx-auto font-medium leading-relaxed">
            Every packet tells a story — from the farm where it's grown to the kitchen where it's cooked.
          </p>
        </motion.div>

        {/* Chapters */}
        <div className="flex flex-col gap-20 lg:gap-28">
          {CHAPTERS.map((chapter, i) => (
            <ChapterCard key={chapter.number} chapter={chapter} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};
