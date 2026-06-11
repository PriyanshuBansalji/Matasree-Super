import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Grid3X3, LayoutList, Sparkles, Loader2, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { useProducts, useCategories } from '@/hooks/useApi';
import heroImage from '@/assets/hero-spices.jpg';
import PageHelmet from '@/components/PageHelmet';

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string | { _id: string; name: string; slug: string };
  stock?: number;
  description?: string;
  image?: string;
  rating?: number;
  createdAt?: string;
  isBestseller?: boolean;
}

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Fetch data from API
  const { data: productsData, isLoading: productsLoading } = useProducts();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();

  // Handle URL category parameter
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && !selectedCategories.includes(categoryParam)) {
      setSelectedCategories([categoryParam]);
    }
  }, [searchParams]);

  const allProducts = useMemo(() => {
    if (!productsData) {
      console.log('❌ No productsData');
      return [];
    }

    console.log('📦 Full productsData structure:', productsData);

    // Handle different response structures
    let products = [];

    // Structure 1: response.data.data.products (from Axios with {data: {products: [...]}}})
    if (productsData.data?.data?.products && Array.isArray(productsData.data.data.products)) {
      products = productsData.data.data.products;
      console.log('✅ Found products at data.data.products');
    }
    // Structure 2: response.data.products (if data has products directly)
    else if (productsData.data?.products && Array.isArray(productsData.data.products)) {
      products = productsData.data.products;
      console.log('✅ Found products at data.products');
    }
    // Structure 3: response.products (if already unwrapped)
    else if ((productsData as any).products && Array.isArray((productsData as any).products)) {
      products = (productsData as any).products;
      console.log('✅ Found products at (productsData as any).products');
    }
    // Structure 4: direct array
    else if (Array.isArray(productsData)) {
      products = productsData;
      console.log('✅ productsData is direct array');
    }
    // Structure 5: response.data is the products array
    else if (Array.isArray(productsData.data)) {
      products = productsData.data;
      console.log('✅ Found products at data (direct array)');
    }

    console.log('🔍 Final products:', { length: products.length, products });
    return products as Product[];
  }, [productsData]);
  const allCategories = useMemo(() => {
    if (!categoriesData) {
      console.log('❌ No categoriesData');
      return [];
    }

    console.log('📦 Full categoriesData structure:', categoriesData);

    let cats = [];

    // Structure 1: response.data.data (array directly)
    if (Array.isArray(categoriesData.data?.data)) {
      cats = categoriesData.data.data;
      console.log('✅ Found categories at data.data');
    }
    // Structure 2: response.data (array directly)
    else if (Array.isArray(categoriesData.data)) {
      cats = categoriesData.data;
      console.log('✅ Found categories at data');
    }
    // Structure 3: direct array
    else if (Array.isArray(categoriesData)) {
      cats = categoriesData;
      console.log('✅ categoriesData is direct array');
    }

    console.log('📂 Final categories:', { length: cats.length, cats });
    return cats;
  }, [categoriesData]);

  // Get category name helper
  const getCategoryName = (category: string | { _id: string; name: string; slug: string }): string => {
    return typeof category === 'string' ? category : category?.name || '';
  };

  // Get product count for a category
  const getCategoryProductCount = (categoryName: string): number => {
    return allProducts.filter((product) => {
      const productCategory = getCategoryName(product.category);
      return productCategory === categoryName;
    }).length;
  };

  // Filter categories to only show those with products
  const categoriesWithProducts = useMemo(() => {
    return allCategories.filter((cat: any) => {
      const count = getCategoryProductCount(cat.name);
      return count > 0;
    });
  }, [allCategories, allProducts]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const categoryName = getCategoryName(product.category);
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(categoryName);

      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];

      const matchesStock = !inStockOnly || (product.stock && product.stock > 0);

      return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    });
  }, [allProducts, searchQuery, selectedCategories, priceRange, inStockOnly]);

  const sortedProducts = useMemo(() => {
    const products = [...filteredProducts];

    switch (sortBy) {
      case 'price-low':
        return products.sort((a, b) => a.price - b.price);
      case 'price-high':
        return products.sort((a, b) => b.price - a.price);
      case 'rating':
        return products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'newest':
        return products.sort((a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      case 'bestseller':
        return products.filter(p => p.isBestseller).concat(products.filter(p => !p.isBestseller));
      default:
        return products;
    }
  }, [filteredProducts, sortBy]);

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setPriceRange([0, 10000]);
    setInStockOnly(false);
  };

  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || inStockOnly ||
    priceRange[0] !== 0 || priceRange[1] !== 10000;

  return (
    <div className="min-h-screen bg-background">
      <PageHelmet
        title="Products | Matasree Super Masale"
        description="Browse our full range of authentic Indian spices and masalas — chilli powder, turmeric, coriander, garam masala, and more from Matasree Super Masale."
        canonicalUrl="https://matasreesuper.com/products"
        ogType="website"
      />
      <Navbar />

      {/* Hero Banner */}
      <section className="relative py-20 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/20" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-white text-sm font-medium">Premium Spices & Masalas</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
            Discover Our Collections
          </h1>
          <p className="text-white/90 max-w-2xl mx-auto text-lg">
            Explore premium spices and masalas sourced from across India,
            crafted with authenticity and quality.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        {/* Search and Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search products by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 bg-card border-border/50 rounded-xl focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all duration-300 shadow-sm"
              />
            </div>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="py-6 rounded-xl bg-card">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="bestseller">Bestsellers</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <div className="hidden md:flex items-center gap-1 bg-card rounded-xl p-1 border border-border/50">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className="rounded-lg"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className="rounded-lg"
                onClick={() => setViewMode('list')}
              >
                <LayoutList className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              className="md:hidden rounded-xl w-full"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-72 flex-shrink-0`}>
            <div className="sticky top-24 space-y-6 card-ornate bg-card/80 backdrop-blur-sm p-6 shadow-soft">
              {/* Categories */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif font-bold text-xl text-foreground">Categories</h3>
                  {selectedCategories.length > 0 && (
                    <span className="bg-gradient-spice text-white text-xs px-2 py-0.5 rounded-full shadow-sm font-medium">
                      {selectedCategories.length}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {categoriesLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : categoriesWithProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No categories available</p>
                  ) : (
                    categoriesWithProducts.map((cat: any) => {
                      const isSelected = selectedCategories.includes(cat.name);
                      const productCount = getCategoryProductCount(cat.name);
                      return (
                        <div
                          key={cat._id}
                          onClick={() => toggleCategory(cat.name)}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 group ${isSelected
                            ? 'bg-primary/10 border-primary/20 shadow-sm'
                            : 'bg-secondary/30 hover:bg-secondary/60 border-transparent'
                            } border`}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <span className={`text-sm font-medium transition-colors ${isSelected ? 'text-primary' : 'text-foreground/80 group-hover:text-foreground'
                              }`}>
                              {cat.name}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full transition-colors ${isSelected
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted text-muted-foreground'
                              }`}>
                              {productCount}
                            </span>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30 bg-background'
                            }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Price Range */}
              <div className="border-t border-dotted-traditional pt-6">
                <h3 className="font-serif font-bold text-xl text-foreground mb-4">Price Range</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-4 text-muted-foreground">
                      <span>₹{priceRange[0]}</span>
                      <span>₹{priceRange[1]}</span>
                    </div>
                    <Slider
                      defaultValue={[0, 10000]}
                      value={[priceRange[0], priceRange[1]]}
                      min={0}
                      max={10000}
                      step={100}
                      onValueChange={(value) => setPriceRange([value[0], value[1]])}
                      className="py-2"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '< ₹200', value: 200 },
                      { label: '₹200-500', value: 500 },
                      { label: '₹500+', value: 10000 },
                    ].map((range) => {
                      const isActive = priceRange[1] === range.value && priceRange[0] === (range.value === 500 ? 200 : range.value === 10000 ? 500 : 0);
                      // Simplified logic for quick buttons: 0-200, 200-500, 500-10000
                      // But the click handler sets [0, range.value]. Let's adjust for distinct ranges.
                      const targetRange: [number, number] = range.value === 200 ? [0, 200] : range.value === 500 ? [200, 500] : [500, 10000];
                      const isSelected = priceRange[0] === targetRange[0] && priceRange[1] === targetRange[1];

                      return (
                        <Button
                          key={range.label}
                          variant="outline"
                          size="sm"
                          onClick={() => setPriceRange(targetRange)}
                          className={`text-xs h-9 rounded-lg transition-all border ${isSelected
                            ? 'bg-gradient-spice text-white border-transparent shadow-md'
                            : 'hover:border-primary/50 hover:bg-secondary/50 text-muted-foreground'
                            }`}
                        >
                          {range.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Stock Filter */}
              <div className="border-t border-dotted-traditional pt-6 mt-6">
                <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-secondary/30 rounded-lg transition-colors">
                  <Checkbox
                    checked={inStockOnly}
                    onCheckedChange={(checked) => setInStockOnly(checked as boolean)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary w-5 h-5 border-2"
                  />
                  <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">In Stock Only</span>
                </label>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={clearFilters}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-6 bg-gradient-warm border border-border/40 px-5 py-3 rounded-xl shadow-sm">
              <p className="text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{sortedProducts.length}</span> of {allProducts.length} products
              </p>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8"
                >
                  Clear filters
                </Button>
              )}
            </div>

            {productsLoading ? (
              <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
                <Loader2 className="w-10 h-10 text-primary mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <h3 className="font-serif text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your search or filter criteria</p>
                <Button onClick={clearFilters} variant="default">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className={`grid gap-6 ${viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
                }`}>
                {sortedProducts.map((product, index) => (
                  <div
                    key={product._id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
};

export default ProductsPage;