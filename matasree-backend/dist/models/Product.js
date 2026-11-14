"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// ─── Sub-document schemas ────────────────────────────────────────────────────
const productVariantSchema = new mongoose_1.Schema({
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
}, { _id: true });
const productSeoSchema = new mongoose_1.Schema({
    seoTitle: { type: String },
    seoDescription: { type: String },
    metaKeywords: { type: [String], default: [] },
    canonicalUrl: { type: String },
    ogImage: { type: String },
}, { _id: false });
const productShippingSchema = new mongoose_1.Schema({
    weightGrams: { type: Number, min: 0 },
    lengthCm: { type: Number, min: 0 },
    widthCm: { type: Number, min: 0 },
    heightCm: { type: Number, min: 0 },
    hsnCode: { type: String },
    gstPercent: { type: Number },
    countryOfOrigin: { type: String },
    shippingClass: { type: String, enum: ['Standard', 'Express', 'Heavy'] },
}, { _id: false });
const productAttributeSchema = new mongoose_1.Schema({
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
}, { _id: false });
const relatedProductSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
    relationType: {
        type: String,
        enum: ['frequently_bought', 'recommended', 'cross_sell', 'upsell'],
        required: true,
    },
}, { _id: false });
// ─── Main product schema ─────────────────────────────────────────────────────
const productSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
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
}, { timestamps: true });
// ─── Pre-save hook: auto-generate unique slug from name ──────────────────────
productSchema.pre('save', async function (next) {
    if (!this.isModified('name') && this.slug)
        return next();
    const base = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    let slug = base;
    let suffix = 1;
    while (await mongoose_1.default.model('Product').exists({ slug, _id: { $ne: this._id } })) {
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
productSchema.index({ slug: 1 }, { unique: true, sparse: true });
productSchema.index({ brand: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isNewArrival: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ sold: -1 });
exports.default = mongoose_1.default.model('Product', productSchema);
//# sourceMappingURL=Product.js.map