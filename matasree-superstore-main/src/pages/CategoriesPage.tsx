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
    console.log('📦 Categories Data:', categoriesData);

    // Handle different API response structures
    let cats = [];

    if (categoriesData?.data?.data && Array.isArray(categoriesData.data.data)) {
      cats = categoriesData.data.data;
    } else if (categoriesData?.data && Array.isArray(categoriesData.data)) {
      cats = categoriesData.data;
    } else if (Array.isArray(categoriesData)) {
      cats = categoriesData;
    }

    console.log('✅ Extracted categories:', cats);
    return Array.isArray(cats) ? (cats as Category[]) : [];
  }, [categoriesData]);

  const allProducts = useMemo(() => {
    console.log('📦 Products Data:', productsData);

    // Robust checking for products data structure
    if (!productsData) return [];

    let products = [];

    if (productsData.data?.data?.products && Array.isArray(productsData.data.data.products)) {
      products = productsData.data.data.products;
    } else if (productsData.data?.products && Array.isArray(productsData.data.products)) {
      products = productsData.data.products;
    } else if ((productsData as any).products && Array.isArray((productsData as any).products)) {
      products = (productsData as any).products;
    } else if (Array.isArray(productsData)) {
      products = productsData;
    } else if (Array.isArray(productsData.data)) {
      products = productsData.data;
    }

    console.log('✅ Extracted products:', products);
    return products;
  }, [productsData]);

  const getCategoryProducts = (categoryName: string) => {
    const products = allProducts.filter((p: any) => {
      const cat = typeof p.category === 'string' ? p.category : p.category?.name;
      return cat === categoryName;
    });
    console.log(`🔍 Products for "${categoryName}":`, products.length);
    return products;
  };

  const isLoading = catLoading || prodLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          </div>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-6 shadow-lg">
            <Package className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2 mb-4">
            <span className="inline-block text-primary font-semibold text-sm uppercase tracking-widest px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              Our Collection
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-4 mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text">
            Browse by Category
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Discover our premium range of authentic Indian spices, carefully organized for your convenience.
            Each category features handpicked masalas crafted with traditional recipes.
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
          <div className="space-y-24">
            {categories
              .filter((category: Category) => {
                const categoryProducts = getCategoryProducts(category.name);
                return categoryProducts.length > 0;
              })
              .map((category: Category, index: number) => {
                const categoryProducts = getCategoryProducts(category.name);

                return (
                  <section
                    key={category._id}
                    className="scroll-mt-24 group"
                    id={category.name}
                  >
                    {/* Category Header */}
                    <div className="relative mb-10">
                      <div className="absolute inset-0 -z-10 overflow-hidden">
                        <div className={`absolute ${index % 2 === 0 ? 'left-0' : 'right-0'} top-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl`} />
                      </div>

                      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            {category.image && (
                              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg ring-2 ring-primary/20">
                                <img
                                  src={category.image}
                                  alt={category.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground group-hover:text-primary transition-colors">
                                {category.name}
                              </h2>
                              <div className="h-1 w-20 bg-gradient-to-r from-primary to-accent rounded-full mt-2" />
                            </div>
                          </div>
                          {category.description && (
                            <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
                              {category.description}
                            </p>
                          )}
                        </div>

                        <Button
                          asChild
                          variant="outline"
                          className="hidden sm:flex group/btn border-2 hover:border-primary hover:bg-primary/5 transition-all"
                          size="lg"
                        >
                          <Link to={`/products?category=${category.name}`}>
                            View All {category.name}
                            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                      {categoryProducts.slice(0, 4).map((product: any) => (
                        <div
                          key={product._id}
                          className="h-full transform transition-all duration-300 hover:scale-[1.02]"
                        >
                          <ProductCard product={product} />
                        </div>
                      ))}
                    </div>

                    {/* Mobile View All Button */}
                    <div className="sm:hidden">
                      <Button
                        asChild
                        variant="outline"
                        className="w-full border-2 hover:border-primary hover:bg-primary/5"
                        size="lg"
                      >
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

