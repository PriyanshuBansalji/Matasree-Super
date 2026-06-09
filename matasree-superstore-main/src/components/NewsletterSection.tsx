import { Button } from '@/components/ui/button';
import { Mail, Gift, ArrowRight, Loader2, CheckCircle, AlertCircle, Lock, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';

const NewsletterSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    if (!isAuthenticated || !user) {
      toast.error('Please login first');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response: any = await apiClient.subscribeNewsletter({
        email: user.email,
        name: user.name,
      });

      setSubscribed(true);
      if (response?.data?.code) setCouponCode(response.data.code);
      toast.success(response?.data?.message || '🎉 Check your email for your exclusive 10% discount code!');
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to subscribe. Please try again later.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="py-24 md:py-32 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #3E2314 0%, #5A2D0E 50%, #8B4513 100%)',
      }}
    >
      {/* Ambient glows */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-[#E65C19]/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#D63220]/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Golden accent lines */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#F4D03F]/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#F4D03F]/20 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-14 border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.2)]"
          >
            <div className="flex flex-col md:flex-row items-center gap-10">
              {/* Icon side */}
              <div className="flex-shrink-0">
                <motion.div 
                  initial={{ rotate: -5, scale: 0.9 }}
                  whileInView={{ rotate: 0, scale: 1 }}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ 
                    rotate: { duration: 0.8, ease: "easeOut" },
                    scale: { duration: 0.8, ease: "easeOut" },
                    y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="w-28 h-28 md:w-36 md:h-36 rounded-[2rem] bg-white/10 border border-white/10 flex items-center justify-center shadow-lg backdrop-blur-sm"
                >
                  <Mail className="w-14 h-14 md:w-20 md:h-20 text-[#F4D03F]" />
                </motion.div>
              </div>

              {/* Content side */}
              <div className="flex-1 text-center md:text-left">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full mb-5 border border-white/10"
                >
                  <Gift className="w-4 h-4 text-[#F4D03F]" />
                  <span className="text-xs font-black text-white tracking-[0.15em] uppercase">Get 10% Off Your First Order</span>
                </motion.div>

                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="font-serif text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight"
                >
                  Stay Connected
                </motion.h2>

                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-white/60 mb-8 max-w-lg leading-relaxed font-medium"
                >
                  Subscribe to our newsletter for exclusive recipes, authentic cooking tips,
                  limited-time offers, and stories from our heritage.
                </motion.p>

                {!isAuthenticated ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white rounded-2xl p-8 text-center"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <motion.div 
                        animate={{ scale: [1, 1.05, 1] }} 
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-16 h-16 bg-[#D63220]/10 rounded-2xl flex items-center justify-center"
                      >
                        <Lock className="w-8 h-8 text-[#D63220]" />
                      </motion.div>
                      <div>
                        <p className="font-black text-[#3E2314] text-lg mb-2">Login to Subscribe</p>
                        <p className="text-[#3E2314]/50 text-sm mb-4 font-medium">Login to get your exclusive, one-time 10% discount code sent to your registered email</p>
                      </div>
                      <Button
                        onClick={() => navigate('/login')}
                        size="lg"
                        className="bg-gradient-to-r from-[#D63220] to-[#E65C19] hover:from-[#B82A1A] hover:to-[#D15016] text-white font-bold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all group"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Login to Subscribe
                      </Button>
                    </div>
                  </motion.div>
                ) : subscribed ? (
                  <div className="bg-white rounded-2xl p-6">
                    <div className="flex flex-col items-center gap-3 justify-center md:items-start md:justify-start">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <p className="font-bold text-green-900">Success! 🎉</p>
                      </div>
                      <div className="text-left w-full">
                        {couponCode ? (
                          <>
                            <p className="text-sm text-green-700 mb-2">Here is your exclusive, one-time discount code:</p>
                            <div className="bg-green-50 border border-green-200 text-green-800 font-mono text-xl font-bold px-4 py-3 rounded-xl text-center tracking-widest shadow-sm">
                              {couponCode}
                            </div>
                            <p className="text-xs text-green-600/80 mt-2 text-center md:text-left">Code also sent to <strong>{user?.email}</strong></p>
                          </>
                        ) : (
                          <p className="text-sm text-green-700">Your unique discount code has been sent to <strong>{user?.email}</strong></p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {error && (
                      <div className="bg-red-50 rounded-xl p-4 mb-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-red-800 text-sm">{error}</p>
                      </div>
                    )}

                    <div className="bg-white rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D63220] to-[#E65C19] flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-bold text-[#3E2314] text-sm">{user?.name}</p>
                          <p className="text-[#3E2314]/40 text-xs">{user?.email}</p>
                        </div>
                      </div>

                      <p className="text-[#3E2314]/60 text-sm mb-4 text-left font-medium">
                        Click below to receive your <strong>unique, one-time 10% discount code</strong> at <strong>{user?.email}</strong>
                      </p>

                      <Button
                        onClick={handleSubscribe}
                        disabled={loading}
                        size="lg"
                        className="w-full bg-gradient-to-r from-[#D63220] to-[#E65C19] hover:from-[#B82A1A] hover:to-[#D15016] text-white font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all group"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating your code...
                          </>
                        ) : (
                          <>
                            <Gift className="w-5 h-5 mr-2" />
                            Get My Exclusive 10% Code
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}

                <p className="text-white/30 text-sm mt-5 font-medium">
                  ✓ One code per account • ✓ Valid for 30 days • ✓ Your privacy is protected
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;