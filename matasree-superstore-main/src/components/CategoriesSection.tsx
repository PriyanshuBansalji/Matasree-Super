import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useCategories } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';

const CategoriesSection = () => {
  const { data: categoriesData, isLoading } = useCategories();
  const categories = categoriesData?.data?.categories || [];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-secondary via-secondary/80 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 spice-pattern" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Our Range</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-2 mb-4">
            Explore <span className="text-gradient-spice">Categories</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            From everyday essentials to special blends, discover the perfect spices
            for every cuisine and occasion.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 md:gap-6">
          {isLoading ? (
            // Loading skeleton
            [...Array(6)].map((_, i) => (
              <Skeleton key={i} className="w-full aspect-[4/5] rounded-3xl" />
            ))
          ) : categories.length > 0 ? (
            categories.map((category, index) => (
              <Link
                key={category._id}
                to={`/products?category=${category.name}`}
                className="group relative overflow-hidden rounded-3xl aspect-[4/5] shadow-card hover:shadow-elevated transition-all duration-500 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Image */}
                <img
                  src={category.image || 'https://via.placeholder.com/400x500'}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Decorative ring */}
                <div className="absolute inset-4 border border-background/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-5">
                  {category.description && (
                    <span className="text-primary text-xs font-medium uppercase tracking-wider mb-1 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-2 group-hover:translate-y-0 line-clamp-1">
                      {category.description}
                    </span>
                  )}
                  <h3 className="font-serif text-xl md:text-2xl font-bold text-background group-hover:text-primary transition-colors duration-300">
                    {category.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-background/70 text-sm">{category.productCount || 0} Products</p>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                      <ArrowRight className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No categories available</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;