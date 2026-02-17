import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter, Youtube, Linkedin } from 'lucide-react';
import logo from '@/assets/matasree-logo.png';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-foreground to-foreground/95 text-background relative overflow-hidden">
      {/* Traditional top border */}
      <div className="h-1 bg-gradient-indian-flag" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/" className="inline-block group">
              <img 
                src={logo} 
                alt="Matasree Super" 
                className="h-20 w-auto object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
            <p className="text-background/70 text-sm leading-relaxed">
              Matasree Super Industries - Bringing authentic taste of India since 2008. 
              Premium spices from Clement Town, Dehradun.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Instagram, url: 'https://www.instagram.com/matasreesuper_spices/' },
                { icon: Twitter, url: 'https://x.com/PriyanshuB3389' },
                { icon: Youtube, url: 'https://www.youtube.com/@PriyanshuBansal-xs7yj' },
                { icon: Linkedin, url: 'https://www.linkedin.com/in/priyanshu-bansal-2926512b8/' }
              ].map((social, index) => {
                const Icon = social.icon;
                return (
                  <a 
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-background/10 hover:bg-primary hover:scale-110 flex items-center justify-center transition-all duration-300"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-6 relative inline-block">
              Quick Links
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-spice rounded-full" />
            </h4>
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
                    className="text-background/70 hover:text-primary text-sm transition-colors duration-300 hover:translate-x-1 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-6 relative inline-block">
              Categories
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-spice rounded-full" />
            </h4>
            <ul className="space-y-3">
              {['Red Chilli', 'Turmeric', 'Coriander', 'Garam Masala', 'Combo Packs'].map((cat) => (
                <li key={cat}>
                  <Link
                    to="/categories"
                    className="text-background/70 hover:text-primary text-sm transition-colors duration-300 hover:translate-x-1 inline-block"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-6 relative inline-block">
              Contact Us
              <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-spice rounded-full" />
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-background/70 group">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>Clement Town, Dehradun - Uttarakhand, India</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-background/70 group">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <a href="tel:7505675163" className="hover:text-primary transition-colors">+91 7505675163</a>
              </li>
              <li className="flex items-center gap-3 text-sm text-background/70 group">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <a href="tel:6937475400" className="hover:text-primary transition-colors">+91 6937475400</a>
              </li>
              <li className="flex items-center gap-3 text-sm text-background/70 group">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <a href="mailto:matasreesuper@gmail.com" className="hover:text-primary transition-colors">matasreesuper@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10 relative z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-background/60">
            <p>© 2008-2026 Matasree Super Industries. All rights reserved. | Est. 2008</p>
            <div className="flex gap-8">
              {[
                { name: 'Privacy Policy', path: '/privacy-policy' },
                { name: 'Terms of Service', path: '/terms-of-service' },
                { name: 'Refund Policy', path: '/refund-policy' }
              ].map((item) => (
                <Link 
                  key={item.name} 
                  to={item.path} 
                  className="hover:text-primary transition-colors relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;