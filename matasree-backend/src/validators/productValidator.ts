import Joi from 'joi';

// ── Variant Extended Schema ──────────────────────────────────────────────────

const variantExtendedSchema = Joi.object({
  // Legacy compat fields (storefront compatibility)
  weight:          Joi.string().trim().optional().default('100g'),
  price:           Joi.number().min(0).optional(),   // sellingPrice alias
  originalPrice:   Joi.number().min(0).optional(),   // mrp alias
  stock:           Joi.number().min(0).required(),

  // New fields (allow hyphens and underscores in SKU)
  sku:             Joi.string().trim().pattern(/^[a-zA-Z0-9_-]+$/).max(64).required(),
  barcode:         Joi.string().trim().optional().allow(''),
  mrp:             Joi.number().min(0).required(),
  sellingPrice:    Joi.number().min(0).required(),
  discountPercent: Joi.number().min(0).max(100).optional().default(0),
  discountAmount:  Joi.number().min(0).optional().default(0),
  reservedStock:   Joi.number().min(0).default(0),
  lowStockThreshold: Joi.number().min(0).default(10),
  isAvailable:     Joi.boolean().default(true),
  variantImage:    Joi.string().optional().allow(''),
}).custom((value, helpers) => {
  value.price = value.price ?? value.sellingPrice;
  value.originalPrice = value.originalPrice ?? value.mrp;
  value.discountAmount = value.discountAmount ?? Math.max(0, value.mrp - value.sellingPrice);
  if (value.sellingPrice > value.mrp) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'sellingPrice cannot exceed MRP');

// ── SEO Schema ───────────────────────────────────────────────────────────────

const seoSchema = Joi.object({
  seoTitle:        Joi.string().optional().allow(''),
  seoDescription:  Joi.string().optional().allow(''),
  metaKeywords:    Joi.array().items(Joi.string()).default([]),
  canonicalUrl:    Joi.string().optional().allow(''),
  ogImage:         Joi.string().optional().allow(''),
});

// ── Shipping Schema ──────────────────────────────────────────────────────────

const shippingSchema = Joi.object({
  weightGrams:     Joi.number().min(0).optional(),
  lengthCm:        Joi.number().min(0).optional(),
  widthCm:         Joi.number().min(0).optional(),
  heightCm:        Joi.number().min(0).optional(),
  hsnCode:         Joi.string().optional().allow(''),
  gstPercent:      Joi.number().optional().allow(null),
  countryOfOrigin: Joi.string().default('India'),
  shippingClass:   Joi.string().optional().allow(''),
});

// ── Attribute Schema ─────────────────────────────────────────────────────────

const attributeSchema = Joi.object({
  key:   Joi.string().trim().required(),
  value: Joi.string().trim().required(),
});

// ── Related Product Schema ───────────────────────────────────────────────────

const relatedProductSchema = Joi.object({
  productId:    Joi.string().required(),
  relationType: Joi.valid('frequently_bought', 'recommended', 'cross_sell', 'upsell').required(),
});

// ── Admin Product Schema (full extended) ─────────────────────────────────────

export const adminProductSchema = Joi.object({
  // Required core fields
  name:              Joi.string().trim().required(),
  description:       Joi.string().optional().allow('').default(''),
  price:             Joi.number().min(0).required(),
  stock:             Joi.number().min(0).required(),
  image:             Joi.string().optional().allow('').default(''),
  weight:            Joi.string().trim().optional().default('100g'),
  category:          Joi.string().required(),

  // Optional core fields
  originalPrice:     Joi.number().min(0).optional(),
  images:            Joi.array().items(Joi.string()).max(10).default([]),
  variants:          Joi.array().items(variantExtendedSchema).default([]),
  tags:              Joi.array().items(Joi.string().trim()).default([]),
  isNewProduct:      Joi.boolean().optional(),
  isBestseller:      Joi.boolean().optional(),

  // New extended fields
  brand:             Joi.string().trim().optional().allow('').default('Matasree'),
  subcategory:       Joi.string().trim().optional().allow('').default(''),
  shortDescription:  Joi.string().optional().allow('').default(''),
  fullDescription:   Joi.string().optional().allow('').default(''),
  status:            Joi.valid('active', 'inactive', 'draft', 'scheduled', 'hidden', 'archived').default('active'),
  scheduledPublishAt: Joi.any().optional().allow(null, ''),
  isFeatured:        Joi.boolean().default(false),
  isNewArrival:      Joi.boolean().default(false),
  featuredImage:     Joi.string().optional().allow(''),
  searchKeywords:    Joi.array().items(Joi.string().trim()).default([]),
  seo:               seoSchema.default({}),
  shipping:          shippingSchema.default({}),
  attributes:        Joi.array().items(attributeSchema).default([]),
  relatedProducts:   Joi.array().items(relatedProductSchema).default([]),
});

// ── Bulk Operation Schema ─────────────────────────────────────────────────────

export const bulkOperationSchema = Joi.object({
  productIds: Joi.array().items(Joi.string()).min(1).required(),
  action:     Joi.valid('delete', 'status', 'category', 'discount', 'price', 'inventory').required(),
  payload:    Joi.object().required(),
});

// ── Stock Adjustment Schema ───────────────────────────────────────────────────

export const stockAdjustmentSchema = Joi.object({
  quantity: Joi.number().integer().required(),
  reason:   Joi.string().required(),
  note:     Joi.string().optional().allow(''),
});
