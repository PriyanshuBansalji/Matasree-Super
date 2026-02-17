import { Link } from 'react-router-dom';
import { ArrowRight, Package, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from './ProductCard';
import { useProducts } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';

const StoreSection = () => {
  const { data: productsData, isLoading } = useProducts({ limit: 12 });
  const products = productsData?.data?.products || [];

  return (
    <section className="relative py-16 md:py-24 bg-gradient-to-b from-amber-50 via-white to-orange-50 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-1/4 w-60 h-60 bg-red-200/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center justify-center gap-2 bg-amber-100/60 text-amber-900 px-6 py-2 rounded-full mb-6">
            <Package className="w-4 h-4" />
            <span className="text-sm font-semibold tracking-wide">Our Premium Collection</span>
          </div>
          
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-amber-950 mb-4 leading-tight">
            Explore Our <span className="text-transparent bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text">Authentic Masalas</span>
          </h2>
          
          <p className="text-lg md:text-xl text-amber-900/80 max-w-2xl mx-auto">
            Hand-selected spices from across India's finest spice markets, blended with centuries-old recipes for uncompromising quality and authentic taste.
          </p>
        </div>

        {/* Filter/Info Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-6 border-b border-amber-200/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm font-medium text-amber-900">Trusted by 1L+ customers</span>
          </div>
          <span className="text-sm text-amber-900/60 font-medium">Showing {products.length} products</span>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 mb-12">
          {isLoading ? (
            // Loading skeleton
            [...Array(12)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white p-4">
                <Skeleton className="w-full aspect-square rounded-xl mb-4" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-full mb-3" />
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))
          ) : products.length > 0 ? (
            products.map((product, index) => (
              <div 
                key={product._id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <Package className="w-16 h-16 text-amber-200 mx-auto mb-4" />
              <p className="text-amber-900/60 text-lg">No products available at the moment</p>
            </div>
          )}
        </div>

        {/* CTA Footer */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 border-t border-amber-200/30">
          <p className="text-amber-900/80 font-medium">
            {products.length > 12 ? 'Browse all our premium masalas' : 'View our complete collection'}
          </p>
          <Button asChild className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold px-8 py-6 rounded-lg shadow-lg group transition-all duration-300 hover:shadow-xl">
            <Link to="/products" className="flex items-center gap-2">
              Shop All Products
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default StoreSection;
