import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Gift, ArrowRight, Loader2, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';

const NewsletterSection = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const authToken = localStorage.getItem('authToken');
    setIsLoggedIn(!!authToken);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.subscribeNewsletter({
        email,
        name: name || undefined
      });

      setSubscribed(true);
      toast.success('🎉 Welcome! Check your email for your 10% discount code!');
      setEmail('');
      setName('');
      
      // Reset after 5 seconds
      setTimeout(() => {
        setSubscribed(false);
      }, 5000);
    } catch (err: any) {
      console.error('Newsletter subscription error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to subscribe. Please try again later.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 md:py-28 bg-gradient-to-r from-amber-700 via-orange-700 to-red-700 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-white/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-black/15 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-white/40 rounded-full animate-float" />
      <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-white/30 rounded-full animate-float" style={{ animationDelay: '1s' }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/30 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Icon side */}
              <div className="flex-shrink-0">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center shadow-lg border border-white/20">
                  <Mail className="w-14 h-14 md:w-20 md:h-20 text-white" />
                </div>
              </div>
              
              {/* Content side */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-white/25 backdrop-blur px-4 py-2 rounded-full mb-4 border border-white/20">
                  <Gift className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">Get 10% Off Your First Order</span>
                </div>
                
                <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
                  Stay Connected
                </h2>
                
                <p className="text-white/85 mb-6 max-w-lg leading-relaxed">
                  Subscribe to our newsletter for exclusive recipes, authentic cooking tips, 
                  limited-time offers, and stories from our 40+ year heritage.
                </p>
                
                {!isLoggedIn ? (
                  // Locked state - user not logged in
                  <div className="bg-white/95 rounded-xl p-8 mb-4 text-center relative">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                        <Lock className="w-8 h-8 text-amber-700" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg mb-2">Subscription Locked</p>
                        <p className="text-gray-600 text-sm mb-4">Please login to subscribe to our newsletter and get exclusive offers</p>
                      </div>
                      <Button 
                        onClick={() => navigate('/login')}
                        size="lg"
                        className="bg-amber-700 hover:bg-amber-800 text-white font-bold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all group"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Login to Subscribe
                      </Button>
                    </div>
                  </div>
                ) : subscribed ? (
                  // Success state
                  <div className="bg-white/95 rounded-xl p-6 mb-4">
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div className="text-left">
                        <p className="font-bold text-green-900">Subscription successful!</p>
                        <p className="text-sm text-green-700">Check your email for your 10% discount code</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {error && (
                      <div className="bg-red-100/95 rounded-xl p-4 mb-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-red-800 text-sm">{error}</p>
                      </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Input
                            type="text"
                            placeholder="Your name (optional)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="py-6 bg-white/95 border-0 text-foreground placeholder:text-muted-foreground rounded-xl shadow-lg focus:ring-2 focus:ring-amber-300"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-12 py-6 bg-white/95 border-0 text-foreground placeholder:text-muted-foreground rounded-xl shadow-lg focus:ring-2 focus:ring-amber-300"
                          />
                        </div>
                        <Button 
                          type="submit"
                          disabled={loading}
                          size="lg"
                          className="bg-white hover:bg-white/90 text-amber-700 font-bold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all group disabled:opacity-70"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Subscribing...
                            </>
                          ) : (
                            <>
                              Subscribe
                              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </>
                )}
                
                <p className="text-white/60 text-sm mt-4">
                  ✓ No spam • ✓ Unsubscribe anytime • ✓ Your privacy is protected
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;