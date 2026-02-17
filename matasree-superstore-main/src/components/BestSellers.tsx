import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from './ProductCard';
import { useProducts } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';

const BestSellers = () => {
  const { data: productsData, isLoading } = useProducts({ limit: 10, sort: '-sold' });

  // Use robust extraction logic similar to ProductsPage
  const products = useMemo(() => {
    if (!productsData) return [];

    // Structure 1: response.data.data.products
    if (productsData.data?.data?.products && Array.isArray(productsData.data.data.products)) {
      return productsData.data.data.products;
    }
    // Structure 2: response.data.products
    else if (productsData.data?.products && Array.isArray(productsData.data.products)) {
      return productsData.data.products;
    }
    // Structure 3: response.products (if already unwrapped or cast needed)
    else if ((productsData as any).products && Array.isArray((productsData as any).products)) {
      return (productsData as any).products;
    }
    // Structure 4: direct array
    else if (Array.isArray(productsData)) {
      return productsData;
    }
    // Structure 5: response.data is the products array
    else if (Array.isArray(productsData.data)) {
      return productsData.data;
    }

    return [];
  }, [productsData]);

  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-b from-white via-amber-50/30 to-white overflow-hidden">
      {/* Premium decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl opacity-40" />
      <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-red-200/20 rounded-full blur-3xl opacity-30" />

      <div className="container mx-auto px-4 relative z-10">

        {/* Header with premium styling */}
        <div className="flex flex-col items-center justify-center gap-4 mb-6">
          <div className="flex items-center justify-center gap-3">
            <div className="h-1 w-8 bg-gradient-to-r from-transparent to-amber-500" />
            <Star className="w-7 h-7 fill-amber-500 text-amber-500" />
            <div className="h-1 w-8 bg-gradient-to-l from-transparent to-amber-500" />
          </div>

          <h2 className="text-center font-serif text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-b from-amber-950 to-orange-900 bg-clip-text text-transparent">
            Most Loved Masalas
          </h2>

          <div className="flex items-center justify-center gap-3">
            <div className="h-1 w-8 bg-gradient-to-r from-transparent to-orange-500" />
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            <div className="h-1 w-8 bg-gradient-to-l from-transparent to-orange-500" />
          </div>
        </div>

        <p className="text-center text-amber-900/70 max-w-2xl mx-auto mb-14 text-lg leading-relaxed font-medium">
          Our bestsellers - handpicked by thousands of satisfied customers who love authentic flavors
        </p>

        {/* Products Grid - 4-6 products */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-14">
          {isLoading ? (
            [...Array(10)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white/80 backdrop-blur p-4 shadow-md">
                <Skeleton className="w-full aspect-square rounded-xl mb-4" />
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-full mb-3" />
                <Skeleton className="h-4 w-32 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1 rounded-lg" />
                  <Skeleton className="h-10 flex-1 rounded-lg" />
                </div>
              </div>
            ))
          ) : products.length > 0 ? (
            products.slice(0, 10).map((product, index) => (
              <div
                key={product._id}
                className="relative animate-slide-up group"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Best Seller Badge with glow */}
                <div className="absolute top-4 right-4 z-20">
                  <div className="absolute inset-0 bg-red-500/30 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-gradient-to-r from-red-600 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg group-hover:shadow-xl transition-shadow">
                    Best Seller
                  </div>
                </div>

                <ProductCard product={product} />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <p className="text-amber-900/60 text-lg">No products available</p>
            </div>
          )}
        </div>

        {/* CTA with enhanced styling */}
        <div className="flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300" />
            <Button asChild className="relative bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold px-10 py-7 text-lg rounded-lg shadow-lg transition-all duration-300 hover:scale-105">
              <Link to="/products" className="flex items-center gap-3">
                Explore All Products
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
