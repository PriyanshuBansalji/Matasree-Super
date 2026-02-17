import { TrendingUp, Package, Users, MapPin } from 'lucide-react';

const stats = [
  { icon: TrendingUp, value: '40+', label: 'Years of Excellence', suffix: '' },
  { icon: Package, value: '50', label: 'Premium Products', suffix: '+' },
  { icon: Users, value: '10', label: 'Lakh Happy Customers', suffix: 'L+' },
  { icon: MapPin, value: '500', label: 'Cities Served', suffix: '+' },
];

const StatsSection = () => {
  return (
    <section className="py-16 bg-gradient-spice relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-black/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="text-center group animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              <p className="font-serif text-4xl md:text-5xl font-bold text-white mb-1">
                {stat.value}<span className="text-white/80">{stat.suffix}</span>
              </p>
              <p className="text-white/70 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;