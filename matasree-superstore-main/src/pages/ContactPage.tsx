import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Mail, Clock, Send, Loader2, CheckCircle, ArrowRight, Lock } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/matasree-logo.png';
import { apiClient } from '@/services/api';

const ContactPage = () => {
  const navigate = useNavigate();
  // Initialize directly from localStorage so the form shows immediately when logged in
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('authToken'));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (formData.message.length < 5) {
      setError('Message must be at least 5 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.contactForm(formData);

      if (response.status === 200 || response.status === 201) {
        setSubmitted(true);
        toast.success('✅ Message sent! We will get back to you soon.');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });

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

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Visit Us',
      lines: ['Clement Town', 'Dehradun', 'India'],
    },
    {
      icon: Phone,
      title: 'Call Us',
      lines: ['+91 7505675163', '+91 6397415400', '24X7 Support'],
    },
    {
      icon: Mail,
      title: 'Email Us',
      lines: ['matasreesuper@gmail.com', 'priyanshujibansal@gmail.com', 'Support Team'],
    },
    {
      icon: Clock,
      title: 'Business Hours',
      lines: ['Monday - Saturday', '9:00 AM - 6:00 PM', 'Sunday: Closed'],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-amber-100/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 left-1/4 w-80 h-80 bg-orange-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-red-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Navbar />

      <main className="container mx-auto px-4 py-20 relative z-10">
        {/* Enhanced Header with Logo and Gradient */}
        <div className="text-center mb-40 relative">
          {/* Decorative elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl -z-10" />

          {/* Premium divider line */}
          <div className="flex justify-center items-center gap-4 mb-12">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-300" />
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-300" />
          </div>

          {/* Logo Section - Enhanced Premium */}
          <div className="flex justify-center mb-14 animate-fade-in">
            <div className="relative group">
              {/* Multiple gradient layers for depth */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 rounded-3xl blur-3xl opacity-50 group-hover:opacity-70 transition-all duration-500 group-hover:blur-2xl -z-10" />
              <div className="absolute inset-4 bg-gradient-to-b from-amber-300/40 to-orange-300/40 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10" />

              <div className="bg-white rounded-3xl p-10 shadow-2xl border-2 border-amber-100/60 group-hover:border-amber-300/100 transition-all duration-500 group-hover:shadow-3xl group-hover:shadow-amber-200/50 hover:scale-110 hover:-translate-y-3 transform">
                <img
                  src={logo}
                  alt="Matasree Super Logo"
                  className="h-40 md:h-48 object-contain transition-transform duration-500 group-hover:scale-125"
                />
              </div>
            </div>
          </div>

          {/* Premium badge with animation */}
          <div className="inline-block mb-8 animate-fade-in-down" style={{ animationDelay: '0.1s' }}>
            <div className="relative group/badge">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full blur-lg opacity-30 group-hover/badge:opacity-50 transition-opacity -z-10" />
              <div className="text-amber-700 font-black text-xs uppercase tracking-widest bg-gradient-to-r from-amber-100/90 via-orange-50/90 to-amber-100/90 px-5 py-3 rounded-full border-2 border-amber-300/60 backdrop-blur-sm hover:border-amber-400/100 transition-all cursor-default shadow-lg">
                🎯 GET IN TOUCH
              </div>
            </div>
          </div>

          {/* Main heading with enhanced styling */}
          <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-black bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 bg-clip-text text-transparent mt-6 mb-6 leading-tight animate-fade-in-up drop-shadow-lg">
            Let's Connect
          </h1>

          {/* Decorative underline */}
          <div className="flex justify-center mb-8">
            <div className="h-1 w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full" />
          </div>

          {/* Subtitle with better hierarchy */}
          <p className="text-lg md:text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed font-medium animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            Have questions about our premium masalas or need support?
            <span className="block mt-3 text-slate-600 font-normal text-base">We're excited to hear from you and help you experience authentic flavors.</span>
          </p>

          {/* Decorative dots */}
          <div className="flex justify-center gap-2 mt-12">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: '0s' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: '0.6s' }} />
          </div>
        </div>

        {/* Enhanced Form Section */}
        <div className="grid lg:grid-cols-3 gap-8 items-start mb-32">
          {/* Form */}
          <div className="lg:col-span-2 relative animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            {/* Premium gradient background */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-200 via-orange-200 to-red-200 rounded-3xl blur-2xl opacity-40 -z-10 group-hover:opacity-60 transition-all duration-500" />

            <div className="bg-white backdrop-blur-xl rounded-3xl p-12 border-2 border-amber-100/60 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:border-amber-200/100">
              {/* Check if user is logged in */}
              {!isLoggedIn ? (
                // Login required state
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-300 rounded-2xl p-14 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg border-2 border-blue-300">
                    <Lock className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-indigo-800 bg-clip-text text-transparent mb-4">Login Required</h3>
                  <p className="text-blue-700 mb-8 leading-relaxed text-lg font-medium max-w-md mx-auto">
                    To get in touch with us and receive responses, please log in to your account first.
                  </p>
                  <p className="text-blue-600 text-sm mb-8 bg-blue-100/70 rounded-xl px-5 py-4 inline-block border border-blue-300">
                    💡 Logging in helps us provide personalized support and track your inquiries.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => navigate('/login')}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-6 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all text-base"
                    >
                      <ArrowRight className="w-5 h-5 mr-2" />
                      Login to Account
                    </Button>
                    <Button
                      onClick={() => navigate('/register')}
                      variant="outline"
                      className="border-2 border-blue-300 text-blue-700 font-bold py-6 px-8 rounded-xl hover:bg-blue-50 transition-all text-base"
                    >
                      Create New Account
                    </Button>
                  </div>
                </div>
              ) : (
                // Form for logged-in users
                <>
                  {/* Form header with divider */}
                  <div className="mb-10 pb-8 border-b-2 border-amber-100/40">
                    <h2 className="font-serif text-5xl font-bold bg-gradient-to-r from-amber-900 to-orange-800 bg-clip-text text-transparent mb-3">Send us a Message</h2>
                    <p className="text-slate-600 text-lg font-medium">We'll respond within 24 hours</p>
                  </div>

                  {submitted ? (
                    // Success state - Enhanced with animations
                    <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 border-2 border-green-400 rounded-2xl p-14 text-center animate-scale-in">
                      <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg animate-bounce border-2 border-green-300">
                        <CheckCircle className="w-12 h-12 text-green-600 animate-scale-in" />
                      </div>
                      <h3 className="text-4xl font-bold bg-gradient-to-r from-green-900 to-emerald-800 bg-clip-text text-transparent mb-4">Message Sent Successfully!</h3>
                      <p className="text-green-700 mb-5 leading-relaxed text-lg font-medium">
                        Thank you for reaching out. Our team will get back to you within 24 hours with all the information you need.
                      </p>
                      <p className="text-sm text-green-700 bg-green-100/70 rounded-xl px-5 py-4 inline-block border border-green-300">
                        ✓ Confirmation sent to <strong className="font-bold">{formData.email}</strong>
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-7">
                      {error && (
                        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-lg p-6 flex gap-3 animate-slide-in-down shadow-sm">
                          <div className="w-6 h-6 rounded-full bg-red-300 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-red-700 text-sm">!</div>
                          <p className="text-red-700 font-semibold text-base">{error}</p>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="group/input">
                          <label className="block text-sm font-bold text-amber-900 mb-3 group-focus-within/input:text-orange-700 transition-colors">
                            Full Name *
                          </label>
                          <Input
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Your name"
                            disabled={loading}
                            className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-amber-200/40 focus:border-amber-500 focus:ring-0 focus:bg-white rounded-xl placeholder:text-slate-400 transition-all hover:border-amber-300/70 group-focus-within/input:bg-white shadow-sm"
                          />
                        </div>
                        <div className="group/input">
                          <label className="block text-sm font-bold text-amber-900 mb-3 group-focus-within/input:text-orange-700 transition-colors">
                            Email Address *
                          </label>
                          <Input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your@email.com"
                            disabled={loading}
                            className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-amber-200/40 focus:border-amber-500 focus:ring-0 focus:bg-white rounded-xl placeholder:text-slate-400 transition-all hover:border-amber-300/70 group-focus-within/input:bg-white shadow-sm"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="group/input">
                          <label className="block text-sm font-bold text-amber-900 mb-3 group-focus-within/input:text-orange-700 transition-colors">
                            Phone Number
                          </label>
                          <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+91 98765 43210"
                            disabled={loading}
                            className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-amber-200/40 focus:border-amber-500 focus:ring-0 focus:bg-white rounded-xl placeholder:text-slate-400 transition-all hover:border-amber-300/70 group-focus-within/input:bg-white shadow-sm"
                          />
                        </div>
                        <div className="group/input">
                          <label className="block text-sm font-bold text-amber-900 mb-3 group-focus-within/input:text-orange-700 transition-colors">
                            Subject *
                          </label>
                          <Input
                            required
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="How can we help?"
                            disabled={loading}
                            className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-amber-200/40 focus:border-amber-500 focus:ring-0 focus:bg-white rounded-xl placeholder:text-slate-400 transition-all hover:border-amber-300/70 group-focus-within/input:bg-white shadow-sm"
                          />
                        </div>
                      </div>

                      <div className="group/input">
                        <label className="block text-sm font-bold text-amber-900 mb-3 group-focus-within/input:text-orange-700 transition-colors">
                          Message *
                        </label>
                        <Textarea
                          required
                          rows={6}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Tell us more about your inquiry..."
                          disabled={loading}
                          className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-amber-200/40 focus:border-amber-500 focus:ring-0 focus:bg-white rounded-xl placeholder:text-slate-400 transition-all hover:border-amber-300/70 resize-none group-focus-within/input:bg-white shadow-sm"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-700 hover:via-orange-700 hover:to-red-700 text-white font-bold py-8 rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group text-lg border-0 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                            Send Message
                            <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Info Box - Enhanced */}
          <div className="lg:col-span-1 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300/60 rounded-2xl p-8 sticky top-32 hover:border-amber-400 hover:shadow-2xl transition-all duration-500 shadow-lg">
              <h3 className="font-serif text-2xl font-bold bg-gradient-to-r from-amber-900 to-orange-800 bg-clip-text text-transparent mb-6">Why Contact Us?</h3>
              <ul className="space-y-5">
                {[
                  'Expert guidance on product selection',
                  'Fast response to all inquiries',
                  'Exclusive offers for subscribers',
                  'Support for bulk orders'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 group/item hover:translate-x-2 transition-transform">
                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-md group-hover/item:scale-125 group-hover/item:shadow-lg transition-all mt-0.5">✓</span>
                    <span className="text-slate-800 text-sm font-semibold group-hover/item:text-amber-900 transition-colors pt-1">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Info Section - Repositioned and Restyled */}
        <div className="mb-20 py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Enhanced Contact Info Cards */}
            {contactInfo.map((info, index) => (
              <div
                key={info.title}
                className="group relative animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative bg-white/80 backdrop-blur-lg rounded-2xl p-7 border border-amber-100/50 hover:border-amber-300/80 shadow-md hover:shadow-lg transition-all duration-500 hover:-translate-y-2 group-hover:bg-white">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl group-hover:scale-120 transition-all duration-500 mb-4">
                      <info.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold text-base text-amber-900 mb-3 group-hover:text-orange-700 transition-colors">{info.title}</h3>
                    <div className="space-y-1.5">
                      {info.lines.map((line, i) => (
                        <p key={i} className="text-xs text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust & Features Section - New */}
        <div className="my-24 py-16 border-t-2 border-amber-100/40 border-b-2">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="font-serif text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-900 to-orange-800 bg-clip-text text-transparent mb-4">Why Customers Trust Us</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full mx-auto" />
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {[
              {
                icon: '🌟',
                title: '10,000+ Happy Customers',
                desc: 'Trusted by families across India for authentic masalas',
                color: 'from-amber-100 to-orange-100'
              },
              {
                icon: '✅',
                title: '100% Authentic Quality',
                desc: 'Pure, handpicked spices with zero additives',
                color: 'from-green-100 to-emerald-100'
              },
              {
                icon: '🚚',
                title: 'Fast & Safe Delivery',
                desc: 'Delivered within 2-3 days across India',
                color: 'from-blue-100 to-cyan-100'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="group relative animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity -z-10`} />
                <div className="bg-white rounded-2xl p-8 border-2 border-amber-100/50 hover:border-amber-300/80 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group-hover:bg-white/95 h-full">
                  <div className="text-5xl mb-4 transform group-hover:scale-125 transition-transform duration-500">{item.icon}</div>
                  <h3 className="font-bold text-xl text-amber-900 mb-3 group-hover:text-orange-700 transition-colors">{item.title}</h3>
                  <p className="text-slate-700 text-sm leading-relaxed group-hover:text-slate-800 transition-colors">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '15+ Years', value: 'Experience' },
              { label: '25+ Products', value: 'Range' },
              { label: '24x7', value: 'Support' },
              { label: 'Pan India', value: 'Delivery' }
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200/60 rounded-xl p-6 text-center hover:border-amber-400 hover:shadow-lg transition-all duration-500 hover:-translate-y-1 group animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="text-2xl font-black bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">{stat.label}</div>
                <div className="text-xs font-bold text-slate-600">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Section - New */}
        <div className="my-24 py-16 relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl -z-10" />

          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="font-serif text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-900 to-orange-800 bg-clip-text text-transparent mb-4">What Our Customers Say</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full mx-auto" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Priya Sharma',
                text: 'Best quality masalas I\'ve ever used. The aroma is incredible!',
                rating: 5,
                city: 'Delhi'
              },
              {
                name: 'Rajesh Kumar',
                text: 'Authentic taste just like my grandmother used to make. Highly recommended!',
                rating: 5,
                city: 'Mumbai'
              },
              {
                name: 'Anjali Patel',
                text: 'Fast delivery, premium quality, and excellent customer service. 10/10!',
                rating: 5,
                city: 'Bangalore'
              }
            ].map((review, idx) => (
              <div
                key={idx}
                className="group relative animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border-2 border-amber-100/60 hover:border-amber-300/80 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-3 group-hover:bg-white h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500" />

                  <div className="flex gap-1 mb-4 relative z-10">
                    {[...Array(review.rating)].map((_, i) => (
                      <span key={i} className="text-xl transform group-hover:scale-125 transition-transform" style={{ transitionDelay: `${i * 50}ms` }}>⭐</span>
                    ))}
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed mb-6 italic group-hover:text-slate-800 transition-colors relative z-10">"{review.text}"</p>
                  <div className="border-t border-amber-100/40 pt-4 relative z-10">
                    <p className="font-bold text-amber-900 text-sm group-hover:text-orange-700 transition-colors">{review.name}</p>
                    <p className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors">{review.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Section - Google Maps Integration */}
        <div className="relative overflow-hidden rounded-3xl h-96 bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-amber-100/40 group hover:border-amber-300/80 transition-all duration-500 shadow-xl hover:shadow-2xl animate-fade-in-up mt-24 overflow-hidden" style={{ animationDelay: '0.5s' }}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3447.8701255444627!2d78.0436!3d30.1834!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39092cfe00000001%3A0x1234567890abcdef!2sMatasree%20Super%20Industries!5e0!3m2!1sen!2sin!4v1234567890"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="group-hover:scale-105 transition-transform duration-500"
          />

          {/* Overlay info box */}
          <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-amber-100/60 group-hover:shadow-2xl transition-all duration-500 z-10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-amber-900 text-sm">Matasree Super Industries</p>
                <p className="text-xs text-slate-600 mt-1">Clement Town, Dehradun, Uttarakhand, India</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
};

export default ContactPage;
