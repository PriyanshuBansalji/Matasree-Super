import { useRef } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { Users, Package, Award, Leaf } from 'lucide-react';
import { useEffect } from 'react';

function Counter({ from, to, delay }: { from: number; to: number; delay: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(nodeRef, { once: true, margin: '-50px' });

  useEffect(() => {
    if (isInView && nodeRef.current) {
      const controls = animate(from, to, {
        duration: 2.5,
        delay,
        ease: [0.16, 1, 0.3, 1],
        onUpdate(value) {
          if (nodeRef.current) {
            nodeRef.current.textContent = Math.round(value).toString();
          }
        },
      });
      return () => controls.stop();
    }
  }, [from, to, isInView, delay]);

  return <span ref={nodeRef} />;
}

const stats = [
  { id: 1, icon: Users, value: 5000, suffix: '+', label: 'Connoisseur Clients', color: 'text-brand-chili' },
  { id: 2, icon: Package, value: 25, suffix: '+', label: 'Premium Blends', color: 'text-brand-turmeric' },
  { id: 3, icon: Award, value: 10, suffix: '+', label: 'Years Legacy', color: 'text-brand-spice' },
  { id: 4, icon: Leaf, value: 100, suffix: '%', label: 'Organic Purity', color: 'text-[#81C784]' },
];

export const TrustStatsSection = () => {
  return (
    <section className="relative pt-32 pb-16 md:pt-48 md:pb-20 bg-brand-cream overflow-hidden border-t border-brand-cinnamon/10">
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-brand-cinnamon/5 rounded-full blur-[200px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-brand-spice/5 rounded-full blur-[200px] pointer-events-none mix-blend-multiply" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        
        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 rounded-[2rem] bg-white border border-brand-cinnamon/10 flex items-center justify-center mb-8 group-hover:bg-brand-cream group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-xl">
                  <Icon className={`w-10 h-10 ${stat.color} drop-shadow-sm`} />
                </div>
                <h3 className="text-6xl md:text-7xl font-bold font-sans tracking-tight text-brand-cinnamon mb-2 flex items-baseline drop-shadow-sm">
                  <Counter from={0} to={stat.value} delay={index * 0.15} />
                  <span className={`${stat.color} ml-1`}>{stat.suffix}</span>
                </h3>
                <p className="text-brand-cinnamon/50 font-bold uppercase tracking-[0.2em] text-sm mt-4">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
