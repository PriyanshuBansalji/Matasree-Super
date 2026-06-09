import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter, Youtube, Linkedin, Award, Leaf, Truck } from 'lucide-react';
import logo from '@/assets/matasree-logo.png';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-foreground via-foreground/99 to-foreground/95 text-background relative overflow-hidden">
      {/* Traditional top border with ornate design */}
      <div className="h-2 bg-gradient-indian-flag shadow-xl" />
      <div className="h-1 bg-primary/40" />
      
      {/* Decorative background elements */}
      <div className="absolute top-32 left-0 w-96 h-96 bg-primary/8 rounded-full blur-3xl -translate-x-1/2" />
      <div className="absolute top-1/2 right-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl translate-x-1/2" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-primary/6 rounded-full blur-3xl" />
      
      {/* Trust Badges Section */}
      <div className="container mx-auto px-4 py-8 relative z-10 border-b border-background/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Award, label: 'Premium Quality', desc: 'Hand-selected premium grade spices' },
            { icon: Leaf, label: '100% Natural', desc: 'No additives or preservatives' },
            { icon: Truck, label: 'Fast Delivery', desc: 'Quick shipping across India' }
          ].map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div key={idx} className="flex items-center gap-4 px-6 py-4 rounded-xl bg-background/5 hover:bg-background/10 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-full bg-gradient-spice/20 flex items-center justify-center flex-shrink-0 group-hover:bg-gradient-spice/30 transition-all">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm uppercase tracking-wide text-background/90">{badge.label}</p>
                  <p className="text-xs text-background/60 mt-1">{badge.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-8">
            <Link to="/" className="inline-block group">
              <img 
                src={logo} 
                alt="Matasree Super" 
                className="h-24 w-auto object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
              />
              <p className="text-xs font-bold uppercase tracking-widest text-background/50 mt-3">Est. 2008</p>
            </Link>
            <p className="text-background/75 text-sm leading-relaxed font-medium">
              Matasree Super Industries - Bringing the authentic taste of India to every home. Premium hand-selected spices from Clement Town, Dehradun, since 2008.
            </p>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest font-bold text-background/60">Follow Us</p>
              <div className="flex gap-3">
                {[
                  { icon: Instagram, url: 'https://www.instagram.com/matasreesuper_spices/', label: 'Instagram' },
                  { icon: Twitter, url: 'https://x.com/PriyanshuB3389', label: 'Twitter' },
                  { icon: Youtube, url: 'https://www.youtube.com/@PriyanshuBansal-xs7yj', label: 'YouTube' },
                  { icon: Linkedin, url: 'https://www.linkedin.com/in/priyanshu-bansal-2926512b8/', label: 'LinkedIn' }
                ].map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <a 
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={social.label}
                      className="w-12 h-12 rounded-full bg-background/15 hover:bg-gradient-spice text-background hover:text-white hover:scale-110 flex items-center justify-center transition-all duration-300 border border-background/20 hover:border-transparent shadow-md font-bold"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="mb-8 relative pb-4">
              <h4 className="font-serif text-lg font-bold uppercase tracking-widest text-background/95">
                Quick Links
              </h4>
              <div className="absolute -bottom-0 left-0 w-16 h-1.5 bg-gradient-spice rounded-full shadow-md" />
            </div>
            <ul className="space-y-3">
              {[
                { name: 'About Us', path: '/about' },
                { name: 'Products', path: '/products' },
                { name: 'Categories', path: '/categories' },
                { name: 'Become a Partner', path: '/partnership' },
                { name: 'Contact', path: '/contact' },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-background/70 hover:text-primary font-medium text-sm transition-all duration-300 hover:translate-x-2 inline-flex items-center gap-3 group"
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-md" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <div className="mb-8 relative pb-4">
              <h4 className="font-serif text-lg font-bold uppercase tracking-widest text-background/95">
                Categories
              </h4>
              <div className="absolute -bottom-0 left-0 w-16 h-1.5 bg-gradient-spice rounded-full shadow-md" />
            </div>
            <ul className="space-y-3">
              {['Red Chilli', 'Turmeric', 'Coriander', 'Garam Masala', 'Combos'].map((cat) => (
                <li key={cat}>
                  <Link
                    to="/categories"
                    className="text-background/70 hover:text-primary font-medium text-sm transition-all duration-300 hover:translate-x-2 inline-flex items-center gap-3 group"
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-md" />
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <div className="mb-8 relative pb-4">
              <h4 className="font-serif text-lg font-bold uppercase tracking-widest text-background/95">
                Contact
              </h4>
              <div className="absolute -bottom-0 left-0 w-16 h-1.5 bg-gradient-spice rounded-full shadow-md" />
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-background/75 group">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-gradient-spice transition-all shadow-md mt-1">
                  <MapPin className="w-4 h-4 group-hover:text-white" />
                </div>
                <span className="font-medium leading-relaxed">Clement Town, Dehradun - Uttarakhand, India</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-background/75 group">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-gradient-spice transition-all shadow-md">
                  <Phone className="w-4 h-4 group-hover:text-white" />
                </div>
                <a href="tel:7505675163" className="font-bold hover:text-primary transition-all">+91 7505675163</a>
              </li>
              <li className="flex items-center gap-3 text-sm text-background/75 group">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-gradient-spice transition-all shadow-md">
                  <Mail className="w-4 h-4 group-hover:text-white" />
                </div>
                <a href="mailto:matasreesuper@gmail.com" className="font-bold hover:text-primary transition-all">Email Us</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Ornate Divider with decorative elements */}
        <div className="relative my-12">
          <div className="h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gradient-spice rounded-full shadow-md" />
        </div>
      </div>

      {/* Bottom Bar with Enhanced styling */}
      <div className="border-t border-background/15 relative z-10 bg-background/5">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-background/60 font-medium tracking-wide uppercase">
              © 2008-2026 Matasree Super Industries. All Rights Reserved.
            </p>
            <div className="flex gap-6 flex-wrap justify-center">
              {[
                { name: 'Privacy Policy', path: '/privacy-policy' },
                { name: 'Terms', path: '/terms-of-service' },
                { name: 'Refund Policy', path: '/refund-policy' }
              ].map((item) => (
                <Link 
                  key={item.name} 
                  to={item.path} 
                  className="text-xs text-background/60 hover:text-primary transition-all duration-300 relative group uppercase font-bold tracking-widest"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-1 bg-gradient-spice rounded-full transition-all duration-300 group-hover:w-full shadow-sm" />
                </Link>
              ))}
            </div>
          </div>
          <div className="text-center mt-6 pt-6 border-t border-background/10">
            <p className="text-xs text-background/40 tracking-widest">
              Bringing Authentic Indian Flavors to Your Home • Established 2008
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;