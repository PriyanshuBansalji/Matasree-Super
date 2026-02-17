import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from './ProductCard';
import { useProducts } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';

const FeaturedProducts = () => {
  const { data: productsData, isLoading } = useProducts({ limit: 8 });
  const bestsellers = productsData?.data?.products || [];

  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14">
          <div>
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-4">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Best Sellers</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-2 mb-4">
              Most <span className="text-gradient-spice">Loved</span> Products
            </h2>
            <p className="text-muted-foreground max-w-2xl text-lg">
              Discover our customer favorites - the spices that have won hearts and 
              transformed countless dishes.
            </p>
          </div>
          <Button asChild variant="outline" className="mt-6 md:mt-0 group border-2 hover:border-primary hover:bg-primary/5 px-6 py-5">
            <Link to="/products">
              View All Products
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {isLoading ? (
            // Loading skeleton
            [...Array(8)].map((_, i) => (
              <div key={i} className="rounded-3xl overflow-hidden">
                <Skeleton className="w-full aspect-square" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))
          ) : bestsellers.length > 0 ? (
            bestsellers.map((product, index) => (
              <div 
                key={product._id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No products available</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;