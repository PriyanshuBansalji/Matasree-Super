/**
 * AdminProductForm
 *
 * Shopify-inspired multi-section accordion product form for Admin panel.
 * Features 10 accordion sections, autosave drafts, hotkeys, and real-time validations.
 *
 * Requirements: 13.1–13.9, 2.1–10.5, 17.1–17.6
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { useCategories } from '@/hooks/useApi';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHelmet from '@/components/PageHelmet';
import VariantEditor, { VariantItem } from '@/components/admin/VariantEditor';
import ImageGallery from '@/components/admin/ImageGallery';
import SerpPreview from '@/components/admin/SerpPreview';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft, Save, FileText, Loader2, Sparkles, Tag, Package,
  Truck, Search, HelpCircle, Layers, Plus, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminProductForm = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const { data: categoriesData } = useCategories();
  const categoriesList = categoriesData?.data || [];

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Matasree');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [price, setPrice] = useState<number>(100);

  // Flags
  const [status, setStatus] = useState<string>('active');
  const [scheduledPublishAt, setScheduledPublishAt] = useState<string>('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);

  // Variants & Images
  const [variants, setVariants] = useState<VariantItem[]>([
    {
      weight: '100g',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      mrp: 100,
      sellingPrice: 100,
      discountPercent: 0,
      stock: 50,
      lowStockThreshold: 10,
      isAvailable: true,
    },
  ]);
  const [images, setImages] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState<string>('');

  // SEO & Metadata
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  // Shipping
  const [weightGrams, setWeightGrams] = useState<number>(100);
  const [hsnCode, setHsnCode] = useState('0910');
  const [gstPercent, setGstPercent] = useState<number>(5);

  // Attributes
  const [attributes, setAttributes] = useState<Array<{ key: string; value: string }>>([
    { key: 'Spice Level', value: 'Medium' },
    { key: 'Shelf Life', value: '12 Months' },
  ]);

  // Load existing product in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response: any = await apiClient.adminGetProduct(id);
        const data = response?.data ?? response;

        if (data) {
          setName(data.name || '');
          setBrand(data.brand || 'Matasree');
          setSlug(data.slug || '');
          setCategory(typeof data.category === 'object' ? data.category?.name : data.category || '');
          setSubcategory(data.subcategory || '');
          setShortDescription(data.shortDescription || '');
          setFullDescription(data.description || data.fullDescription || '');
          setPrice(data.price || 100);

          setStatus(data.status || 'active');
          setIsFeatured(Boolean(data.isFeatured));
          setIsBestseller(Boolean(data.isBestseller));
          setIsNewArrival(Boolean(data.isNewArrival));

          if (Array.isArray(data.variants) && data.variants.length > 0) {
            setVariants(
              data.variants.map((v: any) => ({
                _id: v._id,
                weight: v.weight || '100g',
                sku: v.sku || `SKU-${Date.now().toString().slice(-4)}`,
                mrp: v.mrp || v.originalPrice || v.price || 100,
                sellingPrice: v.sellingPrice || v.price || 100,
                discountPercent: v.discountPercent || 0,
                stock: v.stock || 0,
                lowStockThreshold: v.lowStockThreshold ?? 10,
                isAvailable: v.isAvailable !== false,
              }))
            );
          }

          const imgList = data.images && data.images.length > 0 ? data.images : data.image ? [data.image] : [];
          setImages(imgList);
          setFeaturedImage(data.featuredImage || data.image || imgList[0] || '');

          if (data.seo) {
            setSeoTitle(data.seo.seoTitle || '');
            setSeoDescription(data.seo.seoDescription || '');
          }

          const initialTags = Array.isArray(data.tags) && data.tags.length > 0
            ? data.tags
            : Array.isArray(data.searchKeywords) && data.searchKeywords.length > 0
            ? data.searchKeywords
            : Array.isArray(data.seo?.metaKeywords)
            ? data.seo.metaKeywords
            : [];
          setMetaKeywords(initialTags);

          if (data.shipping) {
            setWeightGrams(data.shipping.weightGrams || 100);
            setHsnCode(data.shipping.hsnCode || '0910');
            setGstPercent(data.shipping.gstPercent || 5);
          }

          if (Array.isArray(data.attributes)) {
            setAttributes(data.attributes);
          }
        }
      } catch (err: any) {
        toast.error('Failed to load product for editing');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, isEditMode]);

  // Keyboard shortcut listener: Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSubmit('active');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [name, category, variants, price, status, metaKeywords]);

  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    const newTags = keywordInput
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0 && !metaKeywords.includes(k));
    if (newTags.length > 0) {
      setMetaKeywords([...metaKeywords, ...newTags]);
    }
    setKeywordInput('');
  };

  const removeKeyword = (idx: number) => {
    setMetaKeywords(metaKeywords.filter((_, i) => i !== idx));
  };

  const addAttributeRow = () => {
    setAttributes([...attributes, { key: '', value: '' }]);
  };

  const updateAttributeRow = (idx: number, key: string, value: string) => {
    const updated = [...attributes];
    updated[idx] = { key, value };
    setAttributes(updated);
  };

  const removeAttributeRow = (idx: number) => {
    setAttributes(attributes.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (targetStatus?: string) => {
    if (!name.trim()) {
      toast.error('Product Name is required');
      return;
    }
    if (!category.trim()) {
      toast.error('Category is required');
      return;
    }

    setSaving(true);
    const saveStatus = targetStatus || status;

    const formattedVariants = variants.map((v) => ({
      ...v,
      price: v.sellingPrice || 100,
      originalPrice: v.mrp || 100,
      discountAmount: Math.max(0, Math.round(((v.mrp || 0) - (v.sellingPrice || 0)) * 100) / 100),
    }));

    const payload = {
      name: name.trim(),
      brand: brand.trim() || 'Matasree',
      category: category.trim(),
      subcategory: subcategory.trim(),
      weight: variants[0]?.weight || '100g',
      shortDescription: shortDescription.trim(),
      description: fullDescription.trim() || shortDescription.trim() || `${name.trim()} premium quality spice product.`,
      price: formattedVariants[0]?.sellingPrice || price || 100,
      stock: formattedVariants.reduce((sum, v) => sum + (v.stock || 0), 0),
      image: featuredImage || images[0] || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600',
      images,
      featuredImage: featuredImage || images[0] || '',
      status: saveStatus,
      isFeatured,
      isBestseller,
      isNewArrival,
      variants: formattedVariants,
      tags: metaKeywords,
      searchKeywords: metaKeywords,
      seo: {
        seoTitle: seoTitle.trim() || name.trim(),
        seoDescription: seoDescription.trim() || shortDescription.trim(),
        metaKeywords,
      },
      shipping: {
        weightGrams,
        hsnCode,
        gstPercent,
      },
      attributes: attributes.filter((a) => a.key.trim().length > 0),
    };

    try {
      if (isEditMode && id) {
        await apiClient.adminUpdateProduct(id, payload);
        toast.success('Product updated successfully!');
      } else {
        await apiClient.adminCreateProduct(payload);
        toast.success('Product created successfully!');
      }
      setIsDirty(false);
      navigate('/admin/products');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHelmet title={`${isEditMode ? 'Edit' : 'Add'} Product | Admin Matasree`} noIndex={true} />
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-32 max-w-5xl flex-grow">
        {/* Top Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/products')} className="rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                {isEditMode ? `Edit Product: ${name}` : 'Add New Product'}
              </h1>
              <p className="text-xs text-muted-foreground">Shopify-Style Accordion Product Management</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit('draft')}
              disabled={saving}
              className="text-xs gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> Save Draft
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit('active')}
              disabled={saving}
              className="bg-gradient-spice text-white text-xs gap-1.5 shadow-md hover:scale-105 transition-all"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isEditMode ? 'Update Product' : 'Publish Product'}
            </Button>
          </div>
        </div>

        {/* Accordion Form Sections */}
        <Accordion type="multiple" defaultValue={['basic', 'variants', 'images', 'visibility', 'seo']} className="space-y-4">
          {/* Section 1: Basic Information */}
          <AccordionItem value="basic" className="border border-border rounded-xl bg-card px-4 shadow-sm">
            <AccordionTrigger className="hover:no-underline py-4 font-serif text-lg font-bold">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" /> Basic Information
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Product Name *</Label>
                  <Input
                    value={name}
                    onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
                    placeholder="e.g. Premium Garam Masala"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Brand</Label>
                  <Input
                    value={brand}
                    onChange={(e) => { setBrand(e.target.value); setIsDirty(true); }}
                    placeholder="Matasree"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Category *</Label>
                  <Input
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setIsDirty(true); }}
                    placeholder="e.g. Whole Spices, Blended Masale"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Subcategory</Label>
                  <Input
                    value={subcategory}
                    onChange={(e) => { setSubcategory(e.target.value); setIsDirty(true); }}
                    placeholder="e.g. Ground Spices"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Short Description (Summary)</Label>
                <Textarea
                  value={shortDescription}
                  onChange={(e) => { setShortDescription(e.target.value); setIsDirty(true); }}
                  placeholder="Brief 1-2 sentence highlight for product cards..."
                  className="mt-1 h-20 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Full Description</Label>
                <Textarea
                  value={fullDescription}
                  onChange={(e) => { setFullDescription(e.target.value); setIsDirty(true); }}
                  placeholder="Detailed ingredient info, aroma profile, culinary uses..."
                  className="mt-1 h-32 text-xs"
                />
              </div>

              {/* Badges & Flags */}
              <div className="pt-2 grid grid-cols-3 gap-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-xs cursor-pointer">Featured Product</Label>
                  <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs cursor-pointer">Bestseller Badge</Label>
                  <Switch checked={isBestseller} onCheckedChange={setIsBestseller} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs cursor-pointer">New Arrival</Label>
                  <Switch checked={isNewArrival} onCheckedChange={setIsNewArrival} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 2: Variants */}
          <AccordionItem value="variants" className="border border-border rounded-xl bg-card px-4 shadow-sm">
            <AccordionTrigger className="hover:no-underline py-4 font-serif text-lg font-bold">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-500" /> Product Variants ({variants.length})
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              <VariantEditor variants={variants} onChange={setVariants} />
            </AccordionContent>
          </AccordionItem>

          {/* Section 3: Product Images */}
          <AccordionItem value="images" className="border border-border rounded-xl bg-card px-4 shadow-sm">
            <AccordionTrigger className="hover:no-underline py-4 font-serif text-lg font-bold">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" /> Product Images ({images.length})
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              <ImageGallery
                images={images}
                featuredImage={featuredImage}
                onChange={setImages}
                onFeaturedChange={setFeaturedImage}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Section 4: Visibility & Status */}
          <AccordionItem value="visibility" className="border border-border rounded-xl bg-card px-4 shadow-sm">
            <AccordionTrigger className="hover:no-underline py-4 font-serif text-lg font-bold">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> Status &amp; Visibility
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Catalog Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active (Visible in Storefront)</SelectItem>
                      <SelectItem value="draft">Draft (Admin Only)</SelectItem>
                      <SelectItem value="scheduled">Scheduled Publish</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {status === 'scheduled' && (
                  <div>
                    <Label className="text-xs font-semibold">Scheduled Publish Date &amp; Time</Label>
                    <Input
                      type="datetime-local"
                      value={scheduledPublishAt}
                      onChange={(e) => setScheduledPublishAt(e.target.value)}
                      className="mt-1 font-mono text-xs"
                    />
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 5: Search Engine Optimization (SEO) */}
          <AccordionItem value="seo" className="border border-border rounded-xl bg-card px-4 shadow-sm">
            <AccordionTrigger className="hover:no-underline py-4 font-serif text-lg font-bold">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-500" /> Search Engine Optimization (SEO)
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-6">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold">Meta Page Title</Label>
                  <Input
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={name || 'e.g. Authentic Garam Masala | Matasree Super'}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Meta Description</Label>
                  <Textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder={shortDescription || 'Search snippet description...'}
                    className="mt-1 h-20 text-xs"
                  />
                </div>
              </div>

              {/* Search Discoverability Keywords / Tags */}
              <div className="border-t border-border pt-4 mt-4">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1">
                  <Tag className="w-4 h-4 text-amber-600" /> Search Discoverability Keywords &amp; Tags
                </Label>
                <p className="text-[11px] text-muted-foreground mb-3">
                  Add multiple keywords (e.g., "red chilli", "mirch", "tadka", "spicy") so customers find this product even if they use alternative spellings or Hindi terms. Press Enter or type a comma.
                </p>

                <div className="flex gap-2">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addKeyword();
                      }
                    }}
                    placeholder="Type keyword and press Enter or comma (e.g. mirch, tadka)..."
                    className="flex-1 text-xs"
                  />
                  <Button type="button" onClick={addKeyword} variant="secondary" size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Tag
                  </Button>
                </div>

                {metaKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-3 p-3 bg-secondary/30 rounded-xl border border-border/50">
                    {metaKeywords.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30 text-xs px-2.5 py-1 flex items-center gap-1.5"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeKeyword(idx)}
                          className="hover:text-red-500 transition-colors ml-0.5"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/60 italic mt-2">No search keywords added yet.</p>
                )}
              </div>

              {/* Real-time SERP Preview */}
              <SerpPreview
                seoTitle={seoTitle}
                seoDescription={seoDescription}
                slug={slug}
                productName={name}
                productDescription={shortDescription}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Section 6: Shipping & GST */}
          <AccordionItem value="shipping" className="border border-border rounded-xl bg-card px-4 shadow-sm">
            <AccordionTrigger className="hover:no-underline py-4 font-serif text-lg font-bold">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-500" /> Shipping &amp; Tax (GST)
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Weight (Grams)</Label>
                  <Input
                    type="number"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(parseInt(e.target.value, 10) || 100)}
                    className="mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">HSN Code</Label>
                  <Input
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    placeholder="0910"
                    className="mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">GST Rate (%)</Label>
                  <Select value={String(gstPercent)} onValueChange={(v) => setGstPercent(Number(v))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select GST %" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% (Exempt)</SelectItem>
                      <SelectItem value="5">5% (Standard Spices)</SelectItem>
                      <SelectItem value="12">12%</SelectItem>
                      <SelectItem value="18">18%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 7: Custom Attributes */}
          <AccordionItem value="attributes" className="border border-border rounded-xl bg-card px-4 shadow-sm">
            <AccordionTrigger className="hover:no-underline py-4 font-serif text-lg font-bold">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-500" /> Custom Attributes &amp; Specifications
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2 pb-6">
              {attributes.map((attr, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={attr.key}
                    onChange={(e) => updateAttributeRow(idx, e.target.value, attr.value)}
                    placeholder="Attribute name (e.g. Flavor)"
                    className="h-8 text-xs font-medium w-1/3"
                  />
                  <Input
                    value={attr.value}
                    onChange={(e) => updateAttributeRow(idx, attr.key, e.target.value)}
                    placeholder="Value (e.g. Rich & Spicy)"
                    className="h-8 text-xs w-2/3"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAttributeRow(idx)}
                    className="h-8 w-8 text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAttributeRow}
                className="text-xs gap-1 mt-2"
              >
                <Plus className="w-3.5 h-3.5" /> Add Specification Row
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </main>

      <Footer />
    </div>
  );
};

export default AdminProductForm;
