import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import heroImage from '@/assets/hero-spices.jpg';
import logo from '@/assets/matasree-logo.png';

const HeroSection = () => {
  return (
    <section className="relative h-auto flex items-center justify-center overflow-hidden bg-gradient-to-br from-amber-950 via-orange-900 to-red-900">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      
      {/* Decorative Authentic Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      
      {/* Traditional Pattern Overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div className="max-w-2xl">
            {/* Heritage Badge */}
            <div className="inline-flex items-center gap-2 bg-amber-100/20 backdrop-blur-sm border border-amber-200/40 px-6 py-3 rounded-full mb-4 animate-fade-in">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-amber-50 tracking-wide">Est. 2008  | Trusted Heritage</span>
            </div>

            {/* Main Heading */}
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight animate-slide-up">
              Authentic{' '}
              <span className="block text-transparent bg-gradient-to-r from-amber-300 via-orange-300 to-red-300 bg-clip-text">Masalas</span>
              <span className="text-amber-100">for Timeless Flavors</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base md:text-lg text-amber-50/90 mb-4 leading-relaxed animate-slide-up max-w-xl" style={{ animationDelay: '0.1s' }}>
              From the legendary spice markets to your kitchen table. Hand-selected, stone-ground masalas crafted with centuries-old traditions.
            </p>

            {/* Features Row */}
            <div className="flex flex-wrap gap-6 mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {[
                { icon: '✓', text: 'Hand-Crafted' },
                { icon: '✓', text: 'Pure Ingredients' },
                { icon: '✓', text: 'Authentic Taste' },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-amber-100">
                  <span className="text-2xl text-amber-400 font-bold">{feature.icon}</span>
                  <span className="font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <Button asChild size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-10 py-6 text-lg rounded-lg shadow-2xl group transition-all duration-300 hover:scale-105">
                <Link to="/products" className="flex items-center">
                  Explore Collection
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-amber-100/40 text-amber-50 hover:bg-white/10 hover:border-amber-100/60 font-bold px-10 py-6 text-lg rounded-lg backdrop-blur transition-all duration-300">
                <Link to="/about" className="flex items-center">
                  Our Heritage
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-amber-200/20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {[
                { number: '20+', label: 'Years Heritage' },
                { number: '25+', label: 'Pure Masalas' },
                { number: '5k+', label: 'Loyal Customers' },
              ].map((stat) => (
                <div key={stat.label} className="text-center group">
                  <p className="text-4xl md:text-5xl font-bold text-amber-300 group-hover:text-amber-400 transition-colors">{stat.number}</p>
                  <p className="text-sm text-amber-100/70 mt-2 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Logo Section */}
          <div className="hidden lg:flex items-center justify-center relative">
            <div className="relative animate-float" style={{ animation: 'float 6s ease-in-out infinite' }}>
              {/* Decorative Circle Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/40 to-orange-600/40 rounded-full blur-2xl scale-125 animate-pulse" style={{ animationDuration: '4s' }} />
              
              {/* Logo */}
              <img 
                src={logo} 
                alt="Matasree Super - Premium Masalas" 
                className="w-155 h-auto object-contain drop-shadow-2xl relative z-20 filter brightness-110 transition-transform duration-500"
              />
              
              {/* Accent Decorations */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-400/20 rounded-full blur-lg animate-bounce" style={{ animationDuration: '5s' }} />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-orange-400/15 rounded-full blur-lg animate-pulse" style={{ animationDuration: '6s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-amber-400 rounded-full opacity-40 animate-float" />
      <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-orange-400 rounded-full opacity-30 animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-amber-300 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }} />
    </section>
  );
};

export default HeroSection;