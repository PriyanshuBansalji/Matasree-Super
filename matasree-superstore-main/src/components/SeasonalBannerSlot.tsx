/**
 * SeasonalBannerSlot
 *
 * Fetches all seasonal banners from the API and renders the first banner
 * whose activeFrom/activeTo window includes the current date.
 *
 * Requirements: 9.4, 9.5, 17.1
 */
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiClient } from '@/services/api';

interface SeasonalBanner {
  _id: string;
  image: string;
  title: string;
  subtitle?: string;
  ctaLink: string;
  ctaText: string;
  activeFrom: string;
  activeTo: string;
}

const SeasonalBannerSlot = () => {
  const { data } = useQuery({
    queryKey: ['seasonal-banners'],
    queryFn: () => apiClient.getSeasonalBanners(),
    staleTime: 5 * 60 * 1000,
  });

  const now = new Date();
  const banners: SeasonalBanner[] = (data as any)?.data || (data as any) || [];
  const activeBanners = Array.isArray(banners)
    ? banners.filter(
        (b) => now >= new Date(b.activeFrom) && now <= new Date(b.activeTo)
      )
    : [];

  if (activeBanners.length === 0) return null;

  const banner = activeBanners[0];

  return (
    <section
      aria-label={`Promotional banner: ${banner.title}`}
      className="relative w-full overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative min-h-[320px] md:min-h-[420px] flex items-center justify-center"
      >
        {/* Background Image */}
        <img
          src={banner.image}
          alt={banner.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />

        {/* Content */}
        <div className="relative z-10 text-center text-white px-6 max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-4xl md:text-6xl font-black mb-4 leading-tight tracking-tight"
          >
            {banner.title}
          </motion.h2>

          {banner.subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg md:text-2xl text-white/80 mb-8 font-medium"
            >
              {banner.subtitle}
            </motion.p>
          )}

          <motion.a
            href={banner.ctaLink}
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.97 }}
            className="inline-block bg-gradient-to-r from-[#D63220] to-[#E65C19] text-white font-bold px-10 py-4 rounded-full shadow-[0_8px_30px_rgba(214,50,32,0.4)] hover:shadow-[0_12px_40px_rgba(214,50,32,0.5)] transition-shadow text-lg"
          >
            {banner.ctaText}
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
};

export default SeasonalBannerSlot;
