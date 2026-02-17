import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { ArrowRight, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCategories, useProducts } from '@/hooks/useApi';
import ProductCard from '@/components/ProductCard';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt?: string;
}

const CategoriesPage = () => {
  const { data: categoriesData, isLoading: catLoading, error } = useCategories();
  const { data: productsData, isLoading: prodLoading } = useProducts();

  const categories = useMemo(() => {
    let cats = categoriesData?.data || [];
    return Array.isArray(cats) ? (cats as Category[]) : [];
  }, [categoriesData]);

  const allProducts = useMemo(() => {
    // Robust checking for products data structure
    if (!productsData) return [];

    if (productsData.data?.data?.products && Array.isArray(productsData.data.data.products)) {
      return productsData.data.data.products;
    }
    if (productsData.data?.products && Array.isArray(productsData.data.products)) {
      return productsData.data.products;
    }
    if ((productsData as any).products && Array.isArray((productsData as any).products)) {
      return (productsData as any).products;
    }
    if (Array.isArray(productsData)) {
      return productsData;
    }
    if (Array.isArray(productsData.data)) {
      return productsData.data;
    }
    return [];
  }, [productsData]);

  const getCategoryProducts = (categoryName: string) => {
    return allProducts.filter((p: any) => {
      const cat = typeof p.category === 'string' ? p.category : p.category?.name;
      return cat === categoryName;
    });
  };

  const isLoading = catLoading || prodLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <span className="text-primary font-medium text-sm uppercase tracking-wider">Our Collection</span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-3 mb-4">
            Browse by Category
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Discover our premium range of spices organized for your convenience.
          </p>
        </div>

        {/* Categories List */}
        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground text-lg">Loading collection...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-border/50">
            <p className="text-red-500 mb-6 text-lg">Error loading categories</p>
            <Button onClick={() => window.location.reload()} variant="default">
              Try Again
            </Button>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-border/50">
            <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No categories available yet</p>
          </div>
        ) : (
          <div className="space-y-20">
            {categories.map((category: Category) => {
              const categoryProducts = getCategoryProducts(category.name);

              if (categoryProducts.length === 0) return null; // Optionally hide empty categories

              return (
                <section key={category._id} className="scroll-mt-24" id={category.name}>
                  <div className="flex items-end justify-between mb-8">
                    <div>
                      <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
                        {category.name}
                      </h2>
                      {category.description && (
                        <p className="text-muted-foreground max-w-xl">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <Button asChild variant="outline" className="hidden sm:flex">
                      <Link to={`/products?category=${category.name}`}>
                        View All {category.name}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categoryProducts.slice(0, 4).map((product: any) => (
                      <div key={product._id} className="h-full">
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 sm:hidden">
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/products?category=${category.name}`}>
                        View All {category.name}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
};

export default CategoriesPage;
