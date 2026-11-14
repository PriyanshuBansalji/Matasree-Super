import mongoose, { Schema } from 'mongoose';

/**
 * ProductVariant — one weight/price/stock combination for a product.
 * Legacy interface preserved for storefront backward compatibility.
 * Example: { weight: "100g", price: 99, originalPrice: 129, stock: 50 }
 */
export interface IProductVariant {
  weight: string;      // free-form string: "100g", "250g", "5kg", "1lb", etc.
  price: number;
  originalPrice?: number;
  stock: number;
}

/**
 * Extended variant interface — includes all legacy fields plus new admin fields.
 * The legacy fields (weight, price, originalPrice, stock) are preserved
 * so the storefront variant selector continues to function without changes.
 */
export interface IProductVariantExtended {
  // Legacy fields preserved (storefront compat)
  weight: string;
  price: number;           // maps to sellingPrice for compat
  originalPrice?: number;  // maps to mrp for compat
  stock: number;

  // New fields
  sku: string;
  barcode?: string;
  mrp: number;
  sellingPrice: number;
  discountPercent: number;
  discountAmount: number;
  reservedStock: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  variantImage?: string;
}

export interface IProductSeo {
  seoTitle?: string;
  seoDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
}

export interface IProductShipping {
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  hsnCode?: string;
  gstPercent?: number;
  countryOfOrigin?: string;
  shippingClass?: 'Standard' | 'Express' | 'Heavy';
}

export interface IProductAttribute {
  key: string;
  value: string;
}

export interface IRelatedProduct {
  productId: mongoose.Types.ObjectId;
  relationType: 'frequently_bought' | 'recommended' | 'cross_sell' | 'upsell';
}

export type ProductStatus =
  | 'active' | 'inactive' | 'draft' | 'scheduled' | 'hidden' | 'archived';

export interface IProduct {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  // Base / default price fields (used when no variants exist or as fallback)
  price: number;
  originalPrice?: number;
  category: Schema.Types.ObjectId;
  stock: number;
  rating: number;
  reviews: number;
  sold?: number;
  image: string;
  images?: string[];
  weight: string;       // free-form — no enum restriction
  // Multi-variant support (extended schema, backward-compatible)
  variants: IProductVariantExtended[];
  // Search keyword tags (admin-managed for improved discoverability)
  tags?: string[];
  isNewProduct?: boolean;
  isBestseller?: boolean;

  // New optional fields (all have defaults — existing docs read cleanly)
  slug?: string;
  brand?: string;
  subcategory?: string;
  shortDescription?: string;
  fullDescription?: string;
  status?: ProductStatus;
  scheduledPublishAt?: Date | null;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  featuredImage?: string;
  searchKeywords?: string[];
  seo?: IProductSeo;
  shipping?: IProductShipping;
  attributes?: IProductAttribute[];
  relatedProducts?: IRelatedProduct[];

  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-document schemas ────────────────────────────────────────────────────

const productVariantSchema = new Schema<IProductVariantExtended>(
  {
    // Legacy fields — kept as-is for storefront compat
    weight: {
      type: String,
      required: [true, 'Variant weight is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Variant price is required'],
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // New fields
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    barcode: {
      type: String,
      trim: true,
    },
    mrp: {
      type: Number,
      min: 0,
      default: 0,
    },
    sellingPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    discountPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    discountAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    reservedStock: {
      type: Number,
      min: 0,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      min: 0,
      default: 10,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    variantImage: {
      type: String,
    },
  },
  { _id: true }
);

const productSeoSchema = new Schema<IProductSeo>(
  {
    seoTitle:       { type: String },
    seoDescription: { type: String },
    metaKeywords:   { type: [String], default: [] },
    canonicalUrl:   { type: String },
    ogImage:        { type: String },
  },
  { _id: false }
);

const productShippingSchema = new Schema<IProductShipping>(
  {
    weightGrams:     { type: Number, min: 0 },
    lengthCm:        { type: Number, min: 0 },
    widthCm:         { type: Number, min: 0 },
    heightCm:        { type: Number, min: 0 },
    hsnCode:         { type: String },
    gstPercent:      { type: Number },
    countryOfOrigin: { type: String },
    shippingClass:   { type: String, enum: ['Standard', 'Express', 'Heavy'] },
  },
  { _id: false }
);

const productAttributeSchema = new Schema<IProductAttribute>(
  {
    key:   { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const relatedProductSchema = new Schema<IRelatedProduct>(
  {
    productId:    { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    relationType: {
      type: String,
      enum: ['frequently_bought', 'recommended', 'cross_sell', 'upsell'],
      required: true,
    },
  },
  { _id: false }
);

// ─── Main product schema ─────────────────────────────────────────────────────

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    sold: {
      type: Number,
      default: 0,
      min: 0,
    },
    image: {
      type: String,
      required: true,
    },
    images: [String],
    weight: {
      type: String,
      required: true,
      trim: true,
      // No enum restriction — free-form weight string (e.g. "100g", "5kg", "1lb")
    },
    // Variants: extended schema, legacy fields intact for storefront compat
    variants: {
      type: [productVariantSchema],
      default: [],
    },
    // Tags for multi-keyword search (admin-managed)
    tags: {
      type: [String],
      default: [],
    },
    isNewProduct: {
      type: Boolean,
      default: false,
    },
    isBestseller: {
      type: Boolean,
      default: false,
    },

    // ── New optional fields (all have defaults — existing docs read cleanly) ──

    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
    brand: {
      type: String,
      default: '',
    },
    subcategory: {
      type: String,
      default: '',
    },
    shortDescription: {
      type: String,
      maxlength: 300,
      default: '',
    },
    fullDescription: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft', 'scheduled', 'hidden', 'archived'],
      default: 'active',
    },
    scheduledPublishAt: {
      type: Date,
      default: null,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    featuredImage: {
      type: String,
      default: '',
    },
    searchKeywords: {
      type: [String],
      default: [],
    },
    seo: {
      type: productSeoSchema,
      default: () => ({}),
    },
    shipping: {
      type: productShippingSchema,
      default: () => ({}),
    },
    attributes: {
      type: [productAttributeSchema],
      default: [],
    },
    relatedProducts: {
      type: [relatedProductSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// ─── Pre-save hook: auto-generate unique slug from name ──────────────────────

productSchema.pre('save', async function (next) {
  if (!this.isModified('name') && this.slug) return next();
  const base = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  let slug = base;
  let suffix = 1;
  while (
    await mongoose.model('Product').exists({ slug, _id: { $ne: this._id } })
  ) {
    slug = `${base}-${suffix++}`;
  }
  this.slug = slug;
  next();
});

// ─── Indexes ─────────────────────────────────────────────────────────────────

// Full-text search index — includes name, description, and tags
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
// Existing compound indexes (preserved)
productSchema.index({ category: 1, price: 1 });
productSchema.index({ isBestseller: 1, createdAt: -1 });
// New indexes
productSchema.index({ brand: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isNewArrival: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ sold: -1 });

export default mongoose.model<IProduct>('Product', productSchema);
