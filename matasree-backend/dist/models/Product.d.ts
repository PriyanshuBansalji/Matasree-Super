import mongoose, { Schema } from 'mongoose';
/**
 * ProductVariant — one weight/price/stock combination for a product.
 * Legacy interface preserved for storefront backward compatibility.
 * Example: { weight: "100g", price: 99, originalPrice: 129, stock: 50 }
 */
export interface IProductVariant {
    weight: string;
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
    weight: string;
    price: number;
    originalPrice?: number;
    stock: number;
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
export type ProductStatus = 'active' | 'inactive' | 'draft' | 'scheduled' | 'hidden' | 'archived';
export interface IProduct {
    _id: mongoose.Types.ObjectId;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    category: Schema.Types.ObjectId;
    stock: number;
    rating: number;
    reviews: number;
    sold?: number;
    image: string;
    images?: string[];
    weight: string;
    variants: IProductVariantExtended[];
    tags?: string[];
    isNewProduct?: boolean;
    isBestseller?: boolean;
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
declare const _default: mongoose.Model<IProduct, {}, {}, {}, mongoose.Document<unknown, {}, IProduct, {}, {}> & IProduct & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Product.d.ts.map