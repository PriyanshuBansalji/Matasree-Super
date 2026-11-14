import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Clock, Send, Loader2, CheckCircle, ArrowRight, Star, BadgeCheck, Truck, ChevronDown, HelpCircle, Users, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/matasree-logo.png';
import { apiClient } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import PageHelmet from '@/components/PageHelmet';
import JsonLd, { buildLocalBusinessSchema } from '@/components/JsonLd';

const locations = {
  headOffice: {
    name: 'Matasree Corporate Head Office',
    address: 'C-20, Gokul Enclave, Clement Town, Turner Road, Dehradun Nagar Nigam, Dehradun, Uttarakhand - 248002',
    fssai: '22626030001734',
    phone: ['+91 7505675163', '+91 6397415400'],
    email: 'admin@matasreesuper.com',
    hours: ['Monday - Saturday', '9:00 AM - 6:00 PM', 'Sunday: Closed'],
    mapUrl: 'https://maps.google.com/maps?q=C-20,%20Gokul%20Enclave,%20Clement%20Town,%20Turner%20Road,%20Dehradun%20Nagar%20Nigam,%20Dehradun,%20Uttarakhand%20248002&t=&z=15&ie=UTF8&iwloc=&output=embed',
  },
  factory: {
    name: 'Matasree Processing & Grinding Unit',
    address: 'C-20, Gokul Enclave, Clement Town, Turner Road, Dehradun Nagar Nigam, Dehradun, Uttarakhand - 248002',
    fssai: '22626030001734',
    phone: ['+91 7505675163', '+91 9411130005'],
    email: 'factory@matasreesuper.com',
    hours: ['Monday - Friday', '8:00 AM - 5:00 PM', 'Saturday & Sunday: Closed'],
    mapUrl: 'https://maps.google.com/maps?q=C-20,%20Gokul%20Enclave,%20Clement%20Town,%20Turner%20Road,%20Dehradun%20Nagar%20Nigam,%20Dehradun,%20Uttarakhand%20248002&t=&z=15&ie=UTF8&iwloc=&output=embed',
  }
};

const contactFaqs = [
  {
    question: "How can I request customized spice blends for catering or retail?",
    answer: "We offer customized grinding ratios and proprietary blend formulations for commercial buyers, restaurants, and catering agencies. Reach out via our contact form specifying 'Bulk Order / Custom Blending' in the subject, or call our team directly at +91 7505675163."
  },
  {
    question: "Can I modify or cancel my order after payment?",
    answer: "Our orders are processed within 12 hours. If you need to make changes, please call our 24/7 hotline at +91 7505675163 immediately with your Order ID, and our support team will handle it."
  },
  {
    question: "Do you ship internationally?",
    answer: "Currently, our e-commerce platform processes direct shipping only within India. However, for foreign distributions, wholesale export, and container loads, we can facilitate customs clearance and international logistics. Send your inquiry to admin@matasreesuper.com."
  },
  {
    question: "How do I become a retail distributor of Matasree Spices?",
    answer: "We welcome distributor partnerships across all regions of India. Please fill out the form on our Partnership Page or email details about your retail network directly to partners@matasreesuper.com."
  }
];

const TOPICS = [
  { key: 'general', title: 'General Inquiry', icon: HelpCircle, desc: 'Order status, account help, or product query.' },
  { key: 'bulk', title: 'Bulk & Wholesale', icon: Truck, desc: 'Catering orders, restaurant volume, or custom blends.' },
  { key: 'partner', title: 'Partnerships', icon: Users, desc: 'Become a distributor, supplier, or retail store partner.' },
  { key: 'feedback', title: 'Feedback & Reviews', icon: Star, desc: 'Suggest store features or share product ratings.' }
];

const FloatingSpices = () => {
  const spiceElements = [
    { id: 1, type: 'chili', top: '12%', left: '4%', delay: 0, duration: 18, scale: 0.8 },
    { id: 2, type: 'cardamom', top: '40%', left: '92%', delay: 2, duration: 22, scale: 1 },
    { id: 3, type: 'anise', top: '70%', left: '8%', delay: 4, duration: 25, scale: 0.95 },
    { id: 4, type: 'leaf', top: '25%', left: '82%', delay: 1, duration: 20, scale: 0.75 },
    { id: 5, type: 'clove', top: '55%', left: '86%', delay: 3, duration: 24, scale: 1.1 },
    { id: 6, type: 'seed', top: '88%', left: '78%', delay: 5, duration: 16, scale: 0.8 }
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-5">
      {spiceElements.map((spice) => (
        <motion.div
          key={spice.id}
          className="absolute hidden md:block"
          style={{ top: spice.top, left: spice.left }}
          initial={{ y: 0, rotate: 0, opacity: 0.25 }}
          animate={{
            y: [-18, 18, -18],
            rotate: [0, 360],
            opacity: [0.25, 0.45, 0.25]
          }}
          transition={{
            duration: spice.duration,
            repeat: Infinity,
            delay: spice.delay,
            ease: "easeInOut"
          }}
        >
          {spice.type === 'chili' && (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-red-500/20 fill-current">
              <path d="M19.5 3.5c-2.4-.4-5.2.8-7.1 2.7-1.9 1.9-3.1 4.7-2.7 7.1L4.6 18c-.8.8-.8 2 0 2.8.8.8 2 .8 2.8 0l4.7-5.1c2.4.4 5.2-.8 7.1-2.7 1.9-1.9 3.1-4.7 2.7-7.1l-2.4-2.4z" />
            </svg>
          )}
          {spice.type === 'cardamom' && (
            <svg width="35" height="35" viewBox="0 0 24 24" fill="none" className="text-emerald-500/20 fill-current">
              <ellipse cx="12" cy="12" rx="6" ry="10" transform="rotate(30 12 12)" />
              <path d="M12 2v20M7 7c2 2 8 2 10 0M7 17c2-2 8-2 10 0" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
            </svg>
          )}
          {spice.type === 'anise' && (
            <svg width="45" height="45" viewBox="0 0 24 24" fill="none" className="text-amber-700/25 fill-current">
              <path d="M12 2l2 4 4-2-2 4 4 2-4 2 2 4-4-2-2 4-2-4-4 2 2-4-4-2 4-2-2-4 4 2z" />
            </svg>
          )}
          {spice.type === 'leaf' && (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-green-600/20 fill-current">
              <path d="M2 22C2 12 12 2 22 2c0 10-10 20-20 20z" />
              <path d="M2 22c6-6 12-6 20-20" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
            </svg>
          )}
          {spice.type === 'clove' && (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-[#8B4513]/25 fill-current">
              <circle cx="12" cy="7" r="4" />
              <path d="M10 11h4v9l-2 2-2-2z" />
            </svg>
          )}
          {spice.type === 'seed' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-amber-500/30 fill-current">
              <circle cx="12" cy="12" r="8" />
            </svg>
          )}
        </motion.div>
      ))}
    </div>
  );
};

const ContactPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Multi-step Wizard States
  const [formStep, setFormStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Location Selector State
  const [selectedLocation, setSelectedLocation] = useState<'headOffice' | 'factory'>('headOffice');
  const activeLoc = locations[selectedLocation];

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Star Rating Feedback Widget State
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);
  const [ratingComment, setRatingComment] = useState<string>('');

  // Validation Checkers
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isNameValid = formData.name.trim().length >= 2;
  const isEmailValid = emailRegex.test(formData.email);
  const isPhoneValid = formData.phone.trim() === '' || /^\+?[0-9\s-]{10,15}$/.test(formData.phone.trim());
  const isMessageValid = formData.message.trim().length >= 5;

  // Auto-fill form fields from logged-in user details
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  const handleNextStep = () => {
    setError('');
    if (formStep === 1) {
      if (!isNameValid || !isEmailValid) {
        setError('Please enter a valid name and email address before proceeding.');
        return;
      }
    }
    if (formStep === 2) {
      if (!formData.subject) {
        setError('Please select a topic of inquiry.');
        return;
      }
    }
    setDirection(1);
    setFormStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setError('');
    setDirection(-1);
    setFormStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isMessageValid) {
      setError('Message must be at least 5 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.contactForm(formData);

      if (response.status === 200 || response.status === 201 || (response as any).success) {
        setSubmitted(true);
        toast.success('Message sent! We will get back to you soon.');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        setFormStep(1);

        // Reset after 5 seconds
        setTimeout(() => {
          setSubmitted(false);
        }, 5000);
      }
    } catch (err: any) {
      console.error('Contact form error:', err);
      const errorMsg = err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || 'Failed to send message';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 50 : -50,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden text-[#3E2314]">
      <PageHelmet
        title="Contact Us | Matasree Super Masale"
        description="Get in touch with Matasree Super Masale. Reach us for orders, inquiries, or feedback — we're happy to help."
        canonicalUrl="https://matasreesuper.com/contact"
        ogType="website"
      />
      {/* LocalBusiness JSON-LD structured data (Req 27.5) */}
      <JsonLd schema={buildLocalBusinessSchema()} />
      
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-amber-100/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 left-1/4 w-80 h-80 bg-orange-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-red-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* SVG Background Floating Spice Elements */}
      <FloatingSpices />

      <Navbar />

      <main id="main-content" role="main">
        {/* Luminous Warm Saffron Contact Header */}
        <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-amber-50/70 via-orange-50/60 to-amber-100/40 border-b border-amber-200/30">
          {/* Animated decorative rotating Mandala in background */}
          <div className="absolute inset-y-0 right-[-10%] lg:right-[5%] w-[400px] h-[400px] my-auto flex items-center justify-center opacity-[0.05] pointer-events-none -z-10">
            <motion.svg
              width="400"
              height="400"
              viewBox="0 0 100 100"
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="text-[#3E2314] fill-none stroke-current"
            >
              <circle cx="50" cy="50" r="46" strokeWidth="0.3" />
              <circle cx="50" cy="50" r="38" strokeWidth="0.3" />
              <circle cx="50" cy="50" r="30" strokeWidth="0.3" />
              <circle cx="50" cy="50" r="20" strokeWidth="0.3" />
              {[...Array(24)].map((_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="50"
                  x2={50 + 46 * Math.cos((i * 15 * Math.PI) / 180)}
                  y2={50 + 46 * Math.sin((i * 15 * Math.PI) / 180)}
                  strokeWidth="0.1"
                />
              ))}
            </motion.svg>
          </div>

          <div className="container mx-auto px-4 relative z-10 text-center">
            {/* Logo Section */}
            <div className="flex justify-center mb-6">
              <motion.div 
                className="relative group"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-all duration-500 -z-10" />
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-amber-100 group-hover:border-amber-300 transition-all duration-300">
                  <img
                    src={logo}
                    alt="Matasree Super Logo"
                    className="h-28 md:h-32 object-contain"
                  />
                </div>
              </motion.div>
            </div>

            {/* Premium badge */}
            <div className="inline-block mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full blur-md opacity-25 -z-10" />
                <div className="text-amber-800 font-black text-[10px] uppercase tracking-widest bg-white/80 border border-amber-200/60 px-4 py-2 rounded-full shadow-sm flex items-center gap-1.5 backdrop-blur-sm">
                  <Mail className="w-3.5 h-3.5 text-amber-700" /> GET IN TOUCH
                </div>
              </div>
            </div>

            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-br from-[#3E2314] via-[#D63220] to-[#8B4513] bg-clip-text text-transparent mt-2 mb-2 leading-tight">
              Let's Connect
            </h1>

            <div className="flex justify-center mb-4">
              <div className="h-1 w-20 bg-gradient-to-r from-transparent via-[#D63220] to-transparent rounded-full" />
            </div>

            <p className="text-base text-slate-700 max-w-xl mx-auto leading-relaxed font-semibold">
              Have questions about our premium masalas or need support?
              <span className="block mt-1 text-slate-600 font-normal text-xs">We're excited to hear from you and help you experience authentic flavors.</span>
            </p>
          </div>
        </section>

        {/* Form and Map Content Section */}
        <div className="container mx-auto px-4 py-16 relative z-10">
          {/* Form and Info Section Grid */}
          <div className="grid lg:grid-cols-3 gap-8 items-start mb-24">
            {/* Wizard Form Container */}
            <div className="lg:col-span-2 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-200 via-orange-200 to-red-200 rounded-3xl blur-2xl opacity-40 -z-10" />

              <div className="bg-white backdrop-blur-xl rounded-3xl p-8 md:p-10 border-2 border-amber-100/60 shadow-2xl hover:border-amber-200/100 transition-all duration-500 min-h-[500px] flex flex-col justify-between">
                
                {/* Form Progress Bar */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-amber-100/40 px-2">
                  {[
                    { step: 1, label: 'Identity' },
                    { step: 2, label: 'Topic' },
                    { step: 3, label: 'Details' }
                  ].map((s, idx) => (
                    <div key={s.step} className="flex items-center flex-1 last:flex-initial">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                          formStep === s.step
                            ? 'bg-amber-600 text-white ring-4 ring-amber-600/20 shadow-md'
                            : formStep > s.step
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {formStep > s.step ? '✓' : s.step}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider hidden sm:inline ${
                          formStep === s.step ? 'text-amber-800' : 'text-slate-400'
                        }`}>{s.label}</span>
                      </div>
                      {idx < 2 && (
                        <div className={`h-1 flex-1 mx-4 rounded-full transition-all ${
                          formStep > s.step ? 'bg-emerald-500' : 'bg-slate-100'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-lg p-4 flex gap-3 shadow-sm mb-6"
                  >
                    <div className="w-5 h-5 rounded-full bg-red-300 flex items-center justify-center flex-shrink-0 font-bold text-red-700 text-xs">!</div>
                    <p className="text-red-700 font-semibold text-sm">{error}</p>
                  </motion.div>
                )}

                {submitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 border-2 border-green-400 rounded-2xl p-10 text-center my-auto"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-2 border-green-300">
                      <CheckCircle className="w-10 h-10 text-green-600 animate-bounce" />
                    </div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-green-900 to-emerald-800 bg-clip-text text-transparent mb-3">Message Sent!</h3>
                    <p className="text-green-700 mb-4 leading-relaxed text-base font-medium">
                      Thank you for reaching out. Our team will review and reply within 24 hours.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between space-y-8">
                    <AnimatePresence mode="wait" custom={direction}>
                      {formStep === 1 && (
                        <motion.div
                          key="step1"
                          custom={direction}
                          variants={slideVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ duration: 0.3 }}
                          className="space-y-6"
                        >
                          <h3 className="font-serif text-xl font-bold text-amber-900 mb-2">Tell us about yourself</h3>
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Floating Label - Name */}
                            <div className="relative group/input">
                              <input
                                type="text"
                                required
                                disabled={loading}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={`peer block w-full px-4 py-4 pt-6 bg-slate-50 border-2 rounded-xl transition-all outline-none text-slate-800 text-base shadow-sm focus:bg-white ${
                                  formData.name.trim() === ''
                                    ? 'border-amber-200/40 focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/10'
                                    : isNameValid
                                    ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
                                    : 'border-amber-200/40 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10'
                                }`}
                                placeholder=" "
                              />
                              <label className="absolute left-4 top-2 text-xs font-black text-amber-900/60 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:text-orange-700 peer-focus:font-black transition-all pointer-events-none">
                                Full Name *
                              </label>
                              {formData.name.trim() !== '' && isNameValid && (
                                <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
                              )}
                            </div>

                            {/* Floating Label - Email */}
                            <div className="relative group/input">
                              <input
                                type="email"
                                required
                                disabled={loading}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={`peer block w-full px-4 py-4 pt-6 bg-slate-50 border-2 rounded-xl transition-all outline-none text-slate-800 text-base shadow-sm focus:bg-white ${
                                  formData.email.trim() === ''
                                    ? 'border-amber-200/40 focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/10'
                                    : isEmailValid
                                    ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
                                    : 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
                                }`}
                                placeholder=" "
                              />
                              <label className="absolute left-4 top-2 text-xs font-black text-amber-900/60 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:text-orange-700 peer-focus:font-black transition-all pointer-events-none">
                                Email Address *
                              </label>
                              {formData.email.trim() !== '' && (
                                isEmailValid ? (
                                  <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
                                ) : (
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-red-500">Invalid</span>
                                )
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {formStep === 2 && (
                        <motion.div
                          key="step2"
                          custom={direction}
                          variants={slideVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ duration: 0.3 }}
                          className="space-y-6"
                        >
                          <div className="space-y-1">
                            <h3 className="font-serif text-xl font-bold text-amber-900">Select a Topic</h3>
                            <p className="text-xs text-slate-500 font-semibold">Choose the category that matches your inquiry.</p>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            {TOPICS.map((topic) => {
                              const Icon = topic.icon;
                              const isSelected = formData.subject === topic.title;
                              return (
                                <button
                                  key={topic.key}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, subject: topic.title })}
                                  className={`p-5 rounded-2xl text-left border-2 transition-all duration-300 flex flex-col justify-between h-36 ${
                                    isSelected
                                      ? 'border-amber-600 bg-amber-500/5 shadow-md shadow-amber-500/5'
                                      : 'border-amber-100 bg-slate-50/50 hover:border-amber-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'}`}>
                                      <Icon className="w-5 h-5" />
                                    </div>
                                    {isSelected && <CheckCircle className="w-5 h-5 text-amber-600" />}
                                  </div>
                                  <div>
                                    <h4 className="font-serif font-black text-sm text-[#3E2314] mt-3">{topic.title}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold leading-tight mt-1">{topic.desc}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}

                      {formStep === 3 && (
                        <motion.div
                          key="step3"
                          custom={direction}
                          variants={slideVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ duration: 0.3 }}
                          className="space-y-6"
                        >
                          <div className="space-y-1">
                            <h3 className="font-serif text-xl font-bold text-amber-900">Add Message Details</h3>
                            <p className="text-xs text-slate-500 font-semibold">You selected topic: <strong className="text-amber-800">{formData.subject}</strong></p>
                          </div>

                          {/* Floating Label - Phone */}
                          <div className="relative group/input">
                            <input
                              type="tel"
                              disabled={loading}
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              className={`peer block w-full px-4 py-4 pt-6 bg-slate-50 border-2 rounded-xl transition-all outline-none text-slate-800 text-base shadow-sm focus:bg-white ${
                                formData.phone.trim() === ''
                                  ? 'border-amber-200/40 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10'
                                  : isPhoneValid
                                  ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
                                  : 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
                              }`}
                              placeholder=" "
                            />
                            <label className="absolute left-4 top-2 text-xs font-black text-amber-900/60 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:text-orange-700 peer-focus:font-black transition-all pointer-events-none">
                              Phone Number (Optional)
                            </label>
                            {formData.phone.trim() !== '' && (
                              isPhoneValid ? (
                                <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
                              ) : (
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-red-500">Invalid</span>
                              )
                            )}
                          </div>

                          {/* Floating Label - Message */}
                          <div className="relative group/input">
                            <textarea
                              required
                              rows={4}
                              disabled={loading}
                              value={formData.message}
                              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                              className={`peer block w-full px-4 py-4 pt-6 bg-slate-50 border-2 rounded-xl transition-all outline-none text-slate-800 text-base shadow-sm focus:bg-white resize-none ${
                                formData.message.trim() === ''
                                  ? 'border-amber-200/40 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10'
                                  : isMessageValid
                                  ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
                                  : 'border-amber-200/40 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10'
                              }`}
                              placeholder=" "
                            />
                            <label className="absolute left-4 top-2 text-xs font-black text-amber-900/60 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:text-orange-700 peer-focus:font-black transition-all pointer-events-none">
                              Message details *
                            </label>
                            {formData.message.trim() !== '' && isMessageValid && (
                              <CheckCircle className="absolute right-4 top-4 w-5 h-5 text-emerald-600" />
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Wizard Control Buttons */}
                    <div className="flex gap-4 pt-6 border-t border-amber-100/40">
                      {formStep > 1 && (
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          className="px-6 py-4 bg-amber-50 hover:bg-amber-100 text-amber-900 font-black text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          <ArrowLeft className="w-4 h-4" /> BACK
                        </button>
                      )}
                      
                      {formStep < 3 ? (
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          NEXT STEP <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-700 hover:via-orange-700 hover:to-red-700 text-white font-bold py-6 rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group text-sm uppercase tracking-wider border-0 relative overflow-hidden flex items-center justify-center"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                              Submit Inquiry
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Sidebar Info & Website Rating */}
            <div className="lg:col-span-1 space-y-6">
              {/* Why Contact Us */}
              <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300/60 rounded-3xl p-8 hover:border-amber-400 hover:shadow-2xl transition-all duration-500 shadow-lg">
                <h3 className="font-serif text-2xl font-bold bg-gradient-to-r from-amber-900 to-orange-800 bg-clip-text text-transparent mb-6">Why Contact Us?</h3>
                <ul className="space-y-4">
                  {[
                    'Expert guidance on product selection',
                    'Fast response to all inquiries',
                    'Exclusive offers for subscribers',
                    'Support for bulk orders & wholesale'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 group/item">
                      <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-md group-hover/item:scale-110 transition-all mt-0.5">✓</span>
                      <span className="text-slate-800 text-sm font-semibold group-hover/item:text-amber-900 transition-colors pt-0.5">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Interactive Rating Feedback Widget (Expanded) */}
              <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300/60 rounded-3xl p-8 hover:border-amber-400 hover:shadow-2xl transition-all duration-500 shadow-lg">
                <h3 className="font-serif text-xl font-bold bg-gradient-to-r from-amber-900 to-orange-800 bg-clip-text text-transparent mb-2">Rate Your Experience</h3>
                
                {ratingSubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="text-center py-4"
                  >
                    <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                    <p className="text-slate-800 font-bold text-base">Feedback Received!</p>
                    <p className="text-slate-600 text-xs mt-1 font-medium">Thank you for rating us {rating} out of 5 stars.</p>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-slate-600 text-xs font-semibold leading-relaxed">How easy was it to navigate our store and explore spices today?</p>
                    <div className="flex justify-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="focus:outline-none transition-transform hover:scale-125 duration-100"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              star <= (hoverRating || rating)
                                ? 'fill-amber-500 text-amber-500'
                                : 'text-amber-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    
                    {rating > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3 pt-2"
                      >
                        <textarea
                          rows={2}
                          value={ratingComment}
                          onChange={(e) => setRatingComment(e.target.value)}
                          placeholder="Add a quick comment (optional)..."
                          className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs outline-none focus:border-amber-500 resize-none font-semibold text-slate-800 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setRatingSubmitted(true);
                            toast.success(`Thank you for rating us ${rating} stars!`);
                          }}
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase tracking-wider py-3 rounded-lg shadow-md transition-colors"
                        >
                          Submit Feedback
                        </button>
                      </motion.div>
                    )}
                    <p className="text-center text-[9px] text-amber-800/65 font-bold uppercase tracking-wider">Your feedback shapes our services.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Location Details & Google Map Switcher */}
        <div className="my-20 container mx-auto px-4">
          <div className="text-center mb-10 animate-fade-in-up">
            <h2 className="font-serif text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-900 to-orange-800 bg-clip-text text-transparent mb-3">Our Facilities</h2>
            <p className="text-slate-600 text-sm max-w-lg mx-auto">Switch between locations to check contact details and coordinate addresses.</p>
            
            {/* Tabs Selector */}
            <div className="flex justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setSelectedLocation('headOffice')}
                className={`px-5 py-2.5 rounded-full text-xs font-black tracking-wider transition-all duration-300 border-2 ${
                  selectedLocation === 'headOffice'
                    ? 'bg-amber-600 border-amber-600 text-white shadow-lg'
                    : 'bg-white border-amber-100 text-amber-900 hover:border-amber-300'
                }`}
              >
                CORPORATE HEAD OFFICE
              </button>
              <button
                type="button"
                onClick={() => setSelectedLocation('factory')}
                className={`px-5 py-2.5 rounded-full text-xs font-black tracking-wider transition-all duration-300 border-2 ${
                  selectedLocation === 'factory'
                    ? 'bg-amber-600 border-amber-600 text-white shadow-lg'
                    : 'bg-white border-amber-100 text-amber-900 hover:border-amber-300'
                }`}
              >
                PROCESSING & GRINDING UNIT
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-stretch">
            {/* Map Frame Card */}
            <div className="lg:col-span-2 relative overflow-hidden rounded-3xl h-96 bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-amber-100/40 shadow-xl group hover:border-amber-300 transition-all duration-500">
              <iframe
                src={activeLoc.mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Selected Location Info Card */}
            <div className="lg:col-span-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedLocation}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-3xl p-8 border-2 border-amber-100 shadow-xl flex flex-col justify-between h-full hover:border-amber-300 transition-colors"
                >
                  <div className="space-y-6">
                    <div>
                      <span className="inline-block text-[10px] font-black tracking-widest text-amber-700 uppercase bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">
                        {selectedLocation === 'headOffice' ? 'HEAD OFFICE' : 'FACTORY FACILITY'}
                      </span>
                      <h3 className="font-serif text-xl font-bold text-amber-900 mt-3 leading-tight">{activeLoc.name}</h3>
                    </div>

                    <div className="space-y-4">
                      {/* Address */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-200">
                          <MapPin className="w-4 h-4 text-amber-700" />
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{activeLoc.address}</p>
                      </div>

                      {/* Phone */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-200">
                          <Phone className="w-4 h-4 text-amber-700" />
                        </div>
                        <div>
                          {activeLoc.phone.map((num, i) => (
                            <a key={i} href={`tel:${num.replace(/\s+/g, '')}`} className="block text-xs text-slate-700 font-medium hover:text-amber-600 transition-colors">
                              {num}
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-200">
                          <Mail className="w-4 h-4 text-amber-700" />
                        </div>
                        <a href={`mailto:${activeLoc.email}`} className="text-xs text-slate-700 font-medium hover:text-amber-600 transition-colors">
                          {activeLoc.email}
                        </a>
                      </div>

                      {/* Hours */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-200">
                          <Clock className="w-4 h-4 text-amber-700" />
                        </div>
                        <div>
                          {activeLoc.hours.map((line, i) => (
                            <p key={i} className="text-xs text-slate-600 font-medium">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* FSSAI Registration */}
                      {activeLoc.fssai && (
                        <div className="flex gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl p-3.5 mt-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <BadgeCheck className="w-5 h-5 text-emerald-700" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wide">FSSAI Registered</p>
                            <p className="text-xs text-slate-700 font-bold mt-0.5">No. {activeLoc.fssai}</p>
                            <p className="text-[9px] text-slate-500 font-medium mt-0.5">Kind of Business: Manufacturer / Repacker</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeLoc.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black py-4 rounded-xl shadow-lg transition-colors cursor-pointer"
                  >
                    GET DIRECTIONS
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Curated Contact FAQs Section */}
        <div className="my-24 py-12 border-t-2 border-amber-100/40 container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-200 bg-amber-50 shadow-sm mb-4">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              <span className="text-[10px] font-black tracking-widest text-amber-900 uppercase">Support FAQs</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-900 to-orange-800 bg-clip-text text-transparent mb-2">Common Inquiries</h2>
            <p className="text-slate-600 text-sm">Quick answers regarding custom blends, shipping adjustments, and retail distributions.</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {contactFaqs.map((faq, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 border-2 ${
                  openFaqIndex === index
                    ? 'border-amber-300 shadow-lg shadow-amber-50'
                    : 'border-amber-100 hover:border-amber-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <span className="font-serif text-base md:text-lg font-bold text-amber-900 transition-colors">
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      openFaqIndex === index
                        ? 'bg-amber-600 text-white rotate-180 shadow-md'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    openFaqIndex === index ? 'max-h-48 border-t border-amber-100' : 'max-h-0'
                  }`}
                >
                  <p className="p-6 text-sm text-slate-600 leading-relaxed font-semibold">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="my-24 py-12 border-t border-b border-amber-100/40 container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-900 to-orange-800 bg-clip-text text-transparent mb-2">Why Customers Trust Us</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full mx-auto mt-2" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Star className="w-8 h-8 text-amber-500" />,
                title: '50,000+ Happy Customers',
                desc: 'Delivering authentic flavors and premium quality spices to households daily.'
              },
              {
                icon: <BadgeCheck className="w-8 h-8 text-green-600" />,
                title: '100% Certified Spices',
                desc: 'Our processes align with high food standards, including zero additives.'
              },
              {
                icon: <Truck className="w-8 h-8 text-blue-500" />,
                title: 'Fast Dispatch',
                desc: 'Enjoy secure, rapid delivery options across all major cities in India.'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-amber-100 hover:border-amber-300 hover:shadow-lg transition-all duration-300 text-center"
              >
                <div className="inline-block p-4 rounded-xl bg-amber-50/50 mb-4">{item.icon}</div>
                <h3 className="font-bold text-base text-amber-900 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
};

export default ContactPage;
