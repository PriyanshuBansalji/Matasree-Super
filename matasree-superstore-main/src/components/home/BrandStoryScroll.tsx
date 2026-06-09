import { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useInView,
} from 'framer-motion';

/* ─── Story Data ─────────────────────────────────────────────── */
const storySteps = [
  {
    title: 'Sourced from\nTrusted Farms',
    description:
      "We partner directly with generations of farmers across India's spice belts to ensure only the finest, sun-dried ingredients reach our facilities.",
    image:
      'https://images.unsplash.com/photo-1605651202774-7d573fd3f12d?auto=format&fit=crop&q=80&w=1200',
    accent: '#D63220',
  },
  {
    title: 'Carefully Cleaned\n& Processed',
    description:
      'Every batch undergoes rigorous quality checks. We meticulously pick, clean, and grade our spices to guarantee absolute purity before blending.',
    image:
      'https://plus.unsplash.com/premium_photo-1669862274482-1dd2df05d045?auto=format&fit=crop&q=80&w=1200',
    accent: '#E65C19',
  },
  {
    title: 'Traditional\nGrinding Methods',
    description:
      'We use low-temperature slow grinding techniques to preserve volatile essential oils, ensuring the aroma bursts to life only when cooked.',
    image:
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200',
    accent: '#C4841D',
  },
  {
    title: 'Packed with\nFreshness',
    description:
      'Our premium multi-layered packaging locks in the rich aromas, vibrant colors, and robust flavors from our facility straight to your kitchen.',
    image:
      'https://images.unsplash.com/photo-1596647936647-1981edcb33a9?auto=format&fit=crop&q=80&w=1200',
    accent: '#8B4513',
  },
];

/* ─── Reusable easing ────────────────────────────────────────── */
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/* ─── Stagger animation variants ─────────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.14, delayChildren: 0.1 },
  },
};

const slideUp = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: EASE_OUT_EXPO },
  },
};

const slideIn = (fromRight: boolean) => ({
  hidden: { opacity: 0, x: fromRight ? 50 : -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: EASE_OUT_EXPO },
  },
});

/* ═══════════════════════════════════════════════════════════════
   STEP CARD — one full section per step
   ═══════════════════════════════════════════════════════════════ */
const StoryStep = ({
  step,
  index,
  total,
}: {
  step: (typeof storySteps)[0];
  index: number;
  total: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isReversed = index % 2 === 1;

  /* Parallax on the image only */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1, 1.08]);

  /* For the timeline dot glow */
  const dotRef = useRef<HTMLDivElement>(null);
  const dotInView = useInView(dotRef, { margin: '-45% 0px -45% 0px' });

  return (
    <div ref={ref} className="relative">
      {/* ── Timeline spine (desktop) ─────────────────────────── */}
      <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-0">
        {/* Vertical line */}
        <div className="absolute inset-0 w-px bg-gradient-to-b from-[#3E2314]/[0.06] via-[#3E2314]/[0.12] to-[#3E2314]/[0.06] mx-auto" />

        {/* Animated dot at centre */}
        <div
          ref={dotRef}
          className="sticky top-1/2 -translate-y-1/2 flex items-center justify-center"
        >
          <motion.div
            animate={dotInView ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0.3 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="relative w-5 h-5 rounded-full border-[2.5px] flex items-center justify-center"
            style={{ borderColor: step.accent }}
          >
            {/* inner pulse */}
            <motion.span
              animate={dotInView ? { scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-full h-full rounded-full"
              style={{ backgroundColor: step.accent, opacity: 0.25 }}
            />
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: step.accent }}
            />
          </motion.div>
        </div>
      </div>

      {/* ── Step Content ──────────────────────────────────────── */}
      <div
        className={`
          relative z-10 flex flex-col gap-8 lg:gap-0
          ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'}
          items-center
          py-14 sm:py-20 lg:py-28
        `}
      >
        {/* ── Image Side ──────────────────────────────────────── */}
        <motion.div
          className={`w-full lg:w-[47%] ${isReversed ? 'lg:pl-12 xl:pl-20' : 'lg:pr-12 xl:pr-20'}`}
          initial={{ opacity: 0, clipPath: 'inset(6% 6% 6% 6% round 1.5rem)' }}
          whileInView={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 1.5rem)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1, ease: EASE_OUT_EXPO }}
        >
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-[0_30px_80px_-15px_rgba(62,35,20,0.22)] group">
            {/* Parallax Image */}
            <motion.img
              src={step.image}
              alt={step.title.replace('\n', ' ')}
              loading="lazy"
              style={{ y: imageY, scale: imageScale }}
              className="absolute inset-0 w-full h-[130%] -top-[15%] object-cover transition-[filter] duration-500 group-hover:brightness-110"
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a0c06]/50 via-transparent to-[#3E2314]/10 pointer-events-none" />

            {/* Large watermark step number */}
            <span className="absolute bottom-4 right-6 font-serif font-black text-white/[0.12] text-[7rem] sm:text-[8rem] lg:text-[9rem] leading-none select-none pointer-events-none">
              0{index + 1}
            </span>

            {/* Hover shimmer */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
          </div>
        </motion.div>

        {/* ── Text Side ───────────────────────────────────────── */}
        <motion.div
          className={`
            w-full lg:w-[47%] flex flex-col
            ${isReversed ? 'lg:pr-12 xl:pr-20 lg:items-end lg:text-right' : 'lg:pl-12 xl:pl-20'}
          `}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {/* Step badge */}
          <motion.div
            variants={slideUp}
            className={`inline-flex items-center gap-3 mb-5 ${isReversed ? 'lg:flex-row-reverse' : ''}`}
          >
            <span
              className="w-10 h-[2px] rounded-full"
              style={{ backgroundColor: step.accent }}
            />
            <span
              className="font-black text-[11px] tracking-[0.35em] uppercase"
              style={{ color: step.accent }}
            >
              Step 0{index + 1}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h3
            variants={slideIn(isReversed)}
            className="text-[2rem] sm:text-4xl lg:text-[2.75rem] xl:text-5xl font-serif font-black text-[#3E2314] leading-[1.12] mb-5 whitespace-pre-line"
          >
            {step.title}
          </motion.h3>

          {/* Description */}
          <motion.p
            variants={slideUp}
            className={`text-base sm:text-lg lg:text-xl text-[#3E2314]/55 leading-relaxed font-medium max-w-md ${isReversed ? 'lg:ml-auto' : ''}`}
          >
            {step.description}
          </motion.p>

          {/* Decorative dots */}
          <motion.div
            variants={slideUp}
            className={`flex items-center gap-1.5 mt-8 ${isReversed ? 'lg:justify-end' : ''}`}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <span
                key={i}
                className="rounded-full"
                style={{
                  width: i === 0 ? 20 : 6,
                  height: 6,
                  backgroundColor: step.accent,
                  opacity: 1 - i * 0.2,
                  borderRadius: i === 0 ? 999 : '50%',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ── Mobile step connector ─────────────────────────────── */}
      {index < total - 1 && (
        <div className="flex lg:hidden justify-center">
          <div
            className="w-px h-16"
            style={{
              background: `linear-gradient(to bottom, ${step.accent}30, transparent)`,
            }}
          />
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════════════════════════ */
const SectionHeader = () => (
  <motion.div
    className="text-center pt-24 sm:pt-32 lg:pt-40 pb-10 lg:pb-16"
    initial={{ opacity: 0, y: 44 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
  >
    {/* Kicker */}
    <p className="text-[#D63220] font-black text-[11px] tracking-[0.4em] uppercase mb-5 inline-flex items-center gap-4">
      <span className="w-8 h-[2px] bg-[#D63220] rounded-full" />
      Our Journey
      <span className="w-8 h-[2px] bg-[#D63220] rounded-full" />
    </p>

    {/* Heading */}
    <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-serif font-black text-[#3E2314] leading-[1.08]">
      From Farm to{' '}
      <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#D63220] via-[#E65C19] to-[#C4841D]">
        Your Kitchen
      </span>
    </h2>

    {/* Subtitle */}
    <p className="mt-6 text-base sm:text-lg lg:text-xl text-[#3E2314]/45 max-w-2xl mx-auto font-medium leading-relaxed">
      Every Matasree product tells a story of tradition, purity, and passion —
      a journey that begins in the sun-drenched spice fields of India.
    </p>

    {/* Decorative divider */}
    <div className="flex items-center justify-center gap-2 mt-10">
      <span className="w-16 h-[1px] bg-[#3E2314]/10" />
      <span className="w-2 h-2 rounded-full bg-[#D63220]/30" />
      <span className="w-16 h-[1px] bg-[#3E2314]/10" />
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════ */
export const BrandStoryScroll = () => {
  return (
    <section className="relative bg-[#FDFBF9] w-full border-t border-[#3E2314]/5">
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.018]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #3E2314 0.8px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative">
        <SectionHeader />

        {storySteps.map((step, index) => (
          <StoryStep
            key={index}
            step={step}
            index={index}
            total={storySteps.length}
          />
        ))}

        {/* Bottom padding */}
        <div className="pb-16 lg:pb-28" />
      </div>
    </section>
  );
};
