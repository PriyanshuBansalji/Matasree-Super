import { Award, Users, MapPin, CheckCircle } from 'lucide-react';

const TrustStrip = () => {
  const trustItems = [
    {
      icon: Award,
      number: '20+',
      label: 'Years Heritage',
    },
    {
      icon: Users,
      number: '5K+',
      label: 'Happy Customers',
    },
    {
      icon: MapPin,
      number: '15+',
      label: 'Cities Served',
    },
    {
      icon: CheckCircle,
      number: 'FSSAI',
      label: 'Certified & Lab Tested',
    },
  ];

  return (
    <section className="relative bg-gradient-to-r from-amber-700 via-orange-700 to-red-700 py-10 md:py-14 shadow-2xl overflow-hidden">
      {/* Premium gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/20" />
      
      {/* Animated pattern overlay */}
      <div className="absolute inset-0 opacity-15" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        animation: 'drift 20s linear infinite'
      }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 place-items-center">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex flex-col items-center gap-2.5 text-white text-center group cursor-default">
                {/* Icon background glow */}
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-16 h-16 bg-white/20 rounded-full blur-xl" />
                
                {/* Icon container */}
                <div className="relative p-2 bg-white/20 rounded-full group-hover:bg-white/30 transition-all duration-300 group-hover:scale-125">
                  <Icon className="w-8 h-8 md:w-10 md:h-10 group-hover:rotate-12 transition-transform duration-300" />
                </div>
                
                {/* Number */}
                <p className="text-2xl md:text-3xl font-bold font-serif group-hover:scale-110 transition-transform duration-300">
                  {item.number}
                </p>
                
                {/* Label */}
                <p className="text-xs md:text-sm font-semibold opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom highlight line */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-40" />
      
      <style>{`
        @keyframes drift {
          0% { transform: translateX(0); }
          100% { transform: translateX(30px); }
        }
      `}</style>
    </section>
  );
};

export default TrustStrip;
