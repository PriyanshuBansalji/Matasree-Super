import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHelmet from '@/components/PageHelmet';
import { AlertTriangle, RefreshCw, ShoppingCart, ArrowLeft, PhoneCall } from 'lucide-react';

const PaymentFailedPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason') || 'Transaction was declined or cancelled.';
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-background">
      <PageHelmet title="Payment Unsuccessful | Matasree Super" noIndex={true} />
      <Navbar />

      <main className="container mx-auto px-4 pt-32 pb-20 max-w-2xl page-enter text-center">
        <div className="bg-card border border-red-200 dark:border-red-900/40 rounded-2xl p-8 md:p-12 shadow-xl relative overflow-hidden">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mb-6 shadow-inner animate-bounce">
            <AlertTriangle className="w-10 h-10 stroke-[2.5]" />
          </div>

          <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-foreground mb-3">
            Payment Unsuccessful
          </h1>
          
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            We could not complete your payment verification. Don't worry — your cart items are safe and no duplicate order was created.
          </p>

          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-4 mb-8 text-left max-w-lg mx-auto">
            <span className="text-xs font-bold uppercase text-red-600 dark:text-red-400 tracking-wider block mb-1">
              Reason Provided:
            </span>
            <span className="text-sm font-mono text-foreground">{reason}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => navigate('/checkout')}
              className="bg-gradient-spice text-white w-full sm:w-auto shadow-md hover:scale-105 transition-all"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Retry Payment / Try COD
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/products')}
              className="w-full sm:w-auto border-border"
            >
              <ShoppingCart className="w-4 h-4 mr-2" /> Back to Cart &amp; Products
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <button onClick={() => navigate(-1)} className="hover:text-primary flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Previous Step
            </button>
            <a href="mailto:admin@matasreesuper.com" className="hover:text-primary flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5" /> Contact Support
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentFailedPage;
