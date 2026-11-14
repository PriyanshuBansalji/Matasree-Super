/**
 * Admin Product Controller
 *
 * Full CRUD, inventory management, bulk operations, export/import,
 * and search-picker endpoints for admin product management.
 *
 * Requirements: 1.1–5.3, 7.1–8.3, 15.1–15.5, 16.1–16.5, 17.1–17.5, 18.1–18.3
 */
import { Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product';
import Category from '../models/Category';
import InventoryHistory from '../models/InventoryHistory';
import { ApiResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { invalidateCachePattern } from '../middleware/cache';
import { adminProductSchema, bulkOperationSchema, stockAdjustmentSchema } from '../validators/productValidator';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Find or create a category by name, returning the ObjectId.
 */
async function findOrCreateCategory(name: string): Promise<mongoose.Types.ObjectId> {
  let category = await Category.findOne({ name });
  if (!category) {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '') || 'category';
    const slug = `${baseSlug}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    category = await Category.create({ name, slug });
  }
  return category._id as mongoose.Types.ObjectId;
}

/**
 * Sync legacy variant fields for storefront compatibility.
 * Sets variant.price = variant.sellingPrice and variant.originalPrice = variant.mrp.
 */
export function syncLegacyVariantFields(variants: any[]): any[] {
  return variants.map((v) => ({
    ...v,
    price: v.sellingPrice,
    originalPrice: v.mrp,
  }));
}

/**
 * Compute top-level price from variants.
 * Returns the minimum sellingPrice of available variants, or null if no available variants.
 */
export function computeTopLevelPrice(variants: any[]): number | null {
  const available = variants.filter((v) => v.isAvailable === true || v.isAvailable === undefined);
  if (available.length === 0) return null;
  const prices = available.map((v) => v.sellingPrice).filter((p) => typeof p === 'number');
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

// ─── List Products ───────────────────────────────────────────────────────────

/**
 * GET /api/admin/products
 * Admin product listing with full filtering, pagination, and search.
 */
export const listProducts = async (req: any, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort,
      search,
      category,
      brand,
      status,
      inStock,
      isFeatured,
      dateFrom,
      dateTo,
    } = req.query;

    const query: any = {};

    // Search: regex match on name, tags, sku in variants
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { 'variants.sku': { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = new mongoose.Types.ObjectId(category);
      } else {
        const cat = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
        if (cat) query.category = cat._id;
      }
    }

    if (status) {
      if (status === 'active') {
        query.$or = [
          ...(query.$or || []),
          { status: 'active' },
          { status: { $exists: false } },
          { status: null },
          { status: '' },
        ];
      } else {
        query.status = status;
      }
    }
    if (isFeatured === 'true') query.isFeatured = true;
    if (isFeatured === 'false') query.isFeatured = false;
    if (inStock === 'true') query.stock = { $gt: 0 };

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const sortOption: any =
      sort === 'price'     ? { price: 1 }      :
      sort === '-price'    ? { price: -1 }      :
      sort === 'name'      ? { name: 1 }        :
      sort === '-name'     ? { name: -1 }       :
      sort === '-sold'     ? { sold: -1 }       :
      sort === 'stock'     ? { stock: 1 }       :
      sort === '-stock'    ? { stock: -1 }      :
                             { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query),
    ]);

    return res.status(200).json(
      new ApiResponse(true, 'Products fetched', {
        products,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      })
    );
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch products', null, 500));
  }
};

// ─── Get Product ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/products/:id
 * Get single product with full population.
 */
export const getProduct = async (req: any, res: Response) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate('relatedProducts.productId', 'name image price')
      .lean();

    if (!product) {
      return res.status(404).json(new ApiResponse(false, 'Product not found', null, 404));
    }
    return res.status(200).json(new ApiResponse(true, 'Product fetched', product));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch product', null, 500));
  }
};

// ─── Create Product ───────────────────────────────────────────────────────────

/**
 * POST /api/admin/products
 * Create a new product with extended admin schema.
 */
export const createProduct = async (req: any, res: Response) => {
  try {
    const { error, value } = adminProductSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      console.warn('⚠️  Validation error creating product:', error.details.map((d: any) => d.message));
      return res.status(400).json(new ApiResponse(false, error.details.map((d: any) => d.message).join('; '), null, 400));
    }

    // Check SKU uniqueness within submitted variants
    const skus: string[] = (value.variants || []).map((v: any) => v.sku).filter(Boolean);
    const uniqueSkus = new Set<string>();
    for (const sku of skus) {
      if (uniqueSkus.has(sku)) {
        return res.status(400).json(new ApiResponse(false, `Duplicate SKU: ${sku}`, null, 400));
      }
      uniqueSkus.add(sku);
    }

    const categoryId = await findOrCreateCategory(value.category);

    // Sync legacy variant fields
    const variants = syncLegacyVariantFields(value.variants || []);

    // Compute top-level price
    const computedPrice = computeTopLevelPrice(variants);
    const topLevelPrice = computedPrice !== null ? computedPrice : value.price;

    const doc: any = {
      ...value,
      category: categoryId,
      variants,
      price: topLevelPrice,
    };

    const product = await Product.create(doc);

    // Create initial InventoryHistory entries per variant
    const performedBy = req.user?.userId
      ? new mongoose.Types.ObjectId(req.user.userId)
      : new mongoose.Types.ObjectId();

    const historyEntries = product.variants.map((variant: any) => ({
      productId: product._id,
      variantId: variant._id,
      variantWeight: variant.weight,
      deltaQuantity: variant.stock,
      previousStock: 0,
      newStock: variant.stock,
      reason: 'initial',
      performedBy,
    }));

    if (historyEntries.length > 0) {
      await InventoryHistory.insertMany(historyEntries);
    }

    await invalidateCachePattern('products:*');

    const populated = await product.populate('category');
    return res.status(201).json(new ApiResponse(true, 'Product created', populated));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to create product', null, 500));
  }
};

// ─── Update Product ───────────────────────────────────────────────────────────

/**
 * PUT /api/admin/products/:id
 * Update an existing product.
 */
export const updateProduct = async (req: any, res: Response) => {
  try {
    const { error, value } = adminProductSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    // Check SKU uniqueness within submitted variants
    const skus: string[] = (value.variants || []).map((v: any) => v.sku).filter(Boolean);
    const uniqueSkus = new Set<string>();
    for (const sku of skus) {
      if (uniqueSkus.has(sku)) {
        return res.status(400).json(new ApiResponse(false, `Duplicate SKU: ${sku}`, null, 400));
      }
      uniqueSkus.add(sku);
    }

    const categoryId = await findOrCreateCategory(value.category);
    const variants = syncLegacyVariantFields(value.variants || []);
    const computedPrice = computeTopLevelPrice(variants);
    const topLevelPrice = computedPrice !== null ? computedPrice : value.price;

    // Fetch existing product to compare stock
    const existingProduct = await Product.findById(req.params.id).lean();
    if (!existingProduct) {
      return res.status(404).json(new ApiResponse(false, 'Product not found', null, 404));
    }

    const updateData: any = {
      ...value,
      category: categoryId,
      variants,
      price: topLevelPrice,
    };

    if (Array.isArray(value.images) && value.images.length > 0) {
      updateData.image = value.images[0];
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: false,
    }).populate('category');

    if (!updated) {
      return res.status(404).json(new ApiResponse(false, 'Product not found', null, 404));
    }

    // Create InventoryHistory for stock changes
    const performedBy = req.user?.userId
      ? new mongoose.Types.ObjectId(req.user.userId)
      : new mongoose.Types.ObjectId();

    const oldVariantMap = new Map(
      (existingProduct.variants || []).map((v: any) => [String(v._id), v.stock])
    );

    const historyEntries: any[] = [];
    for (const variant of updated.variants as any[]) {
      const oldStock = oldVariantMap.get(String(variant._id));
      if (oldStock !== undefined && oldStock !== variant.stock) {
        historyEntries.push({
          productId: updated._id,
          variantId: variant._id,
          variantWeight: variant.weight,
          deltaQuantity: variant.stock - oldStock,
          previousStock: oldStock,
          newStock: variant.stock,
          reason: 'admin_adjustment',
          performedBy,
        });
      }
    }

    if (historyEntries.length > 0) {
      await InventoryHistory.insertMany(historyEntries);
    }

    await invalidateCachePattern('products:*');
    return res.status(200).json(new ApiResponse(true, 'Product updated', updated));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to update product', null, 500));
  }
};

// ─── Delete Product ───────────────────────────────────────────────────────────

/**
 * DELETE /api/admin/products/:id
 */
export const deleteProduct = async (req: any, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json(new ApiResponse(false, 'Product not found', null, 404));
    }
    await invalidateCachePattern('products:*');
    return res.status(200).json(new ApiResponse(true, 'Product deleted'));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to delete product', null, 500));
  }
};

// ─── Update Product Status ────────────────────────────────────────────────────

/**
 * PATCH /api/admin/products/:id/status
 */
export const updateProductStatus = async (req: any, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'inactive', 'draft', 'scheduled', 'hidden', 'archived'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json(
        new ApiResponse(false, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, null, 400)
      );
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    ).populate('category');

    if (!product) {
      return res.status(404).json(new ApiResponse(false, 'Product not found', null, 404));
    }

    await invalidateCachePattern('products:*');
    return res.status(200).json(new ApiResponse(true, 'Product status updated', product));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to update product status', null, 500));
  }
};

// ─── Duplicate Product ────────────────────────────────────────────────────────

/**
 * POST /api/admin/products/:id/duplicate
 */
export const duplicateProduct = async (req: any, res: Response) => {
  try {
    const source = await Product.findById(req.params.id).lean();
    if (!source) {
      return res.status(404).json(new ApiResponse(false, 'Product not found', null, 404));
    }

    // Build new doc from source
    const { _id, slug, createdAt, updatedAt, __v, ...rest } = source as any;

    const newDoc: any = {
      ...rest,
      name: `Copy of ${source.name}`,
      status: 'draft',
      scheduledPublishAt: null,
      // Clear variant _id fields so Mongoose generates new ones
      variants: (source.variants || []).map((v: any) => {
        const { _id: vid, ...variantRest } = v;
        return variantRest;
      }),
    };

    const newProduct = await Product.create(newDoc);
    await invalidateCachePattern('products:*');
    return res.status(201).json(new ApiResponse(true, 'Product duplicated', newProduct));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to duplicate product', null, 500));
  }
};

// ─── Get Inventory ────────────────────────────────────────────────────────────

/**
 * GET /api/admin/products/:id/inventory
 */
export const getInventory = async (req: any, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json(new ApiResponse(false, 'Product not found', null, 404));
    }

    const inventory = (product.variants || []).map((v: any) => ({
      variantId: v._id,
      weight: v.weight,
      sku: v.sku,
      currentStock: v.stock,
      reservedStock: v.reservedStock || 0,
      availableStock: v.stock - (v.reservedStock || 0),
      lowStockThreshold: v.lowStockThreshold ?? 10,
      lastUpdated: (product as any).updatedAt,
    }));

    return res.status(200).json(new ApiResponse(true, 'Inventory fetched', inventory));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch inventory', null, 500));
  }
};

// ─── Adjust Variant Stock ─────────────────────────────────────────────────────

/**
 * PUT /api/admin/products/:id/variants/:variantId/stock
 */
export const adjustVariantStock = async (req: any, res: Response) => {
  try {
    const { error, value } = stockAdjustmentSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const { quantity, reason, note } = value;
    const { id, variantId } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json(new ApiResponse(false, 'Product not found', null, 404));
    }

    const variant = (product.variants as any[]).find(
      (v: any) => String(v._id) === variantId
    );
    if (!variant) {
      return res.status(404).json(new ApiResponse(false, 'Variant not found', null, 404));
    }

    const previousStock = variant.stock;
    const newStock = previousStock + quantity;

    if (newStock < 0) {
      return res.status(400).json(new ApiResponse(false, 'Stock cannot go below 0', null, 400));
    }

    variant.stock = newStock;
    await product.save();

    const performedBy = req.user?.userId
      ? new mongoose.Types.ObjectId(req.user.userId)
      : new mongoose.Types.ObjectId();

    await InventoryHistory.create({
      productId: product._id,
      variantId: variant._id,
      variantWeight: variant.weight,
      deltaQuantity: quantity,
      previousStock,
      newStock,
      reason,
      note,
      performedBy,
    });

    await invalidateCachePattern('products:*');

    const updatedStocks = (product.variants as any[]).map((v: any) => ({
      variantId: v._id,
      weight: v.weight,
      sku: v.sku,
      stock: v.stock,
    }));

    return res.status(200).json(new ApiResponse(true, 'Stock adjusted', updatedStocks));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to adjust stock', null, 500));
  }
};

// ─── Get Inventory History ────────────────────────────────────────────────────

/**
 * GET /api/admin/products/:id/inventory/history
 */
export const getInventoryHistory = async (req: any, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [history, total] = await Promise.all([
      InventoryHistory.find({ productId: req.params.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      InventoryHistory.countDocuments({ productId: req.params.id }),
    ]);

    return res.status(200).json(
      new ApiResponse(true, 'Inventory history fetched', {
        history,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      })
    );
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch inventory history', null, 500));
  }
};

// ─── Bulk Operation ───────────────────────────────────────────────────────────

/**
 * POST /api/admin/products/bulk
 */
export const bulkOperation = async (req: any, res: Response) => {
  try {
    const { error, value } = bulkOperationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const { productIds, action, payload } = value;
    let matched = productIds.length;
    let modified = 0;
    let failed = 0;
    const errors: Array<{ productId: string; message: string }> = [];

    const performedBy = req.user?.userId
      ? new mongoose.Types.ObjectId(req.user.userId)
      : new mongoose.Types.ObjectId();

    if (action === 'delete') {
      for (const pid of productIds) {
        try {
          const result = await Product.findByIdAndDelete(pid);
          if (result) modified++;
          else { failed++; errors.push({ productId: pid, message: 'Not found' }); }
        } catch (e: any) {
          failed++;
          errors.push({ productId: pid, message: e.message });
        }
      }
    } else if (action === 'status') {
      const result = await Product.updateMany(
        { _id: { $in: productIds } },
        { $set: { status: payload.status } }
      );
      modified = result.modifiedCount;
      failed = matched - modified;
    } else if (action === 'category') {
      let categoryId: mongoose.Types.ObjectId;
      if (payload.categoryId) {
        categoryId = new mongoose.Types.ObjectId(payload.categoryId);
      } else {
        categoryId = await findOrCreateCategory(payload.categoryName);
      }
      const result = await Product.updateMany(
        { _id: { $in: productIds } },
        { $set: { category: categoryId } }
      );
      modified = result.modifiedCount;
      failed = matched - modified;
    } else if (action === 'discount') {
      for (const pid of productIds) {
        try {
          const product = await Product.findById(pid);
          if (!product) { failed++; errors.push({ productId: pid, message: 'Not found' }); continue; }
          const variants = product.variants as any[];
          for (const v of variants) {
            v.discountPercent = payload.discountPercent;
            v.sellingPrice = Math.round(v.mrp * (1 - payload.discountPercent / 100) * 100) / 100;
            v.discountAmount = Math.round((v.mrp - v.sellingPrice) * 100) / 100;
            v.price = v.sellingPrice;
          }
          const newPrice = computeTopLevelPrice(variants);
          if (newPrice !== null) product.price = newPrice;
          await product.save();
          modified++;
        } catch (e: any) {
          failed++;
          errors.push({ productId: pid, message: e.message });
        }
      }
    } else if (action === 'price') {
      for (const pid of productIds) {
        try {
          const product = await Product.findById(pid);
          if (!product) { failed++; errors.push({ productId: pid, message: 'Not found' }); continue; }
          const variants = product.variants as any[];
          for (const v of variants) {
            v.sellingPrice = payload.sellingPrice;
            v.discountPercent = v.mrp > 0
              ? Math.round(((v.mrp - payload.sellingPrice) / v.mrp) * 100 * 100) / 100
              : 0;
            v.discountAmount = Math.round((v.mrp - payload.sellingPrice) * 100) / 100;
            v.price = v.sellingPrice;
          }
          const newPrice = computeTopLevelPrice(variants);
          if (newPrice !== null) product.price = newPrice;
          await product.save();
          modified++;
        } catch (e: any) {
          failed++;
          errors.push({ productId: pid, message: e.message });
        }
      }
    } else if (action === 'inventory') {
      const deltaQuantity: number = payload.deltaQuantity;
      for (const pid of productIds) {
        try {
          const product = await Product.findById(pid);
          if (!product) { failed++; errors.push({ productId: pid, message: 'Not found' }); continue; }
          const historyEntries: any[] = [];
          for (const variant of product.variants as any[]) {
            const previousStock = variant.stock;
            const newStock = previousStock + deltaQuantity;
            if (newStock < 0) continue; // skip if would go negative
            variant.stock = newStock;
            historyEntries.push({
              productId: product._id,
              variantId: variant._id,
              variantWeight: variant.weight,
              deltaQuantity,
              previousStock,
              newStock,
              reason: payload.reason || 'admin_adjustment',
              note: payload.note,
              performedBy,
            });
          }
          await product.save();
          if (historyEntries.length > 0) {
            await InventoryHistory.insertMany(historyEntries);
          }
          modified++;
        } catch (e: any) {
          failed++;
          errors.push({ productId: pid, message: e.message });
        }
      }
    }

    if (modified > 0) {
      await invalidateCachePattern('products:*');
    }

    return res.status(200).json(
      new ApiResponse(true, 'Bulk operation complete', { matched, modified, failed, errors })
    );
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Bulk operation failed', null, 500));
  }
};

// ─── Export Products ─────────────────────────────────────────────────────────

/**
 * GET /api/admin/products/export
 * Exports product database as CSV.
 */
export const exportProducts = async (req: any, res: Response) => {
  try {
    const products = await Product.find().populate('category').lean();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products_export.csv"');

    const headers = [
      'ID', 'Name', 'Category', 'Brand', 'Status', 'IsFeatured',
      'Variant SKU', 'Variant Weight', 'MRP', 'Selling Price', 'Stock', 'Barcode'
    ];

    let csvContent = headers.join(',') + '\n';

    for (const prod of products) {
      const categoryName = (prod.category as any)?.name || '';
      const variants = prod.variants && prod.variants.length > 0 ? prod.variants : [{
        sku: '', weight: '', mrp: prod.price, sellingPrice: prod.price, stock: prod.stock, barcode: ''
      }];

      for (const v of variants as any[]) {
        const row = [
          `"${prod._id}"`,
          `"${(prod.name || '').replace(/"/g, '""')}"`,
          `"${categoryName.replace(/"/g, '""')}"`,
          `"${(prod.brand || '').replace(/"/g, '""')}"`,
          `"${prod.status || 'active'}"`,
          `"${prod.isFeatured ? 'true' : 'false'}"`,
          `"${(v.sku || '').replace(/"/g, '""')}"`,
          `"${(v.weight || '').replace(/"/g, '""')}"`,
          v.mrp || v.originalPrice || v.price || 0,
          v.sellingPrice || v.price || 0,
          v.stock || 0,
          `"${(v.barcode || '').replace(/"/g, '""')}"`,
        ];
        csvContent += row.join(',') + '\n';
      }
    }

    return res.status(200).send(csvContent);
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Export failed', null, 500));
  }
};

// ─── Import Products ─────────────────────────────────────────────────────────

/**
 * POST /api/admin/products/import
 * Imports products from CSV or JSON payload.
 */
export const importProducts = async (req: any, res: Response) => {
  try {
    const rows = Array.isArray(req.body.products) ? req.body.products : [];
    if (!rows.length) {
      return res.status(400).json(new ApiResponse(false, 'No products provided for import', null, 400));
    }

    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors: Array<{ row: number; message: string }> = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      try {
        const { name, category: catName, price, weight, stock, sku, brand } = row;
        if (!name || !catName || price === undefined) {
          failed++;
          errors.push({ row: index + 1, message: 'Name, Category, and Price are required' });
          continue;
        }

        const categoryId = await findOrCreateCategory(catName);
        const existing = await Product.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });

        const variant = {
          weight: weight || '100g',
          sellingPrice: Number(price),
          mrp: Number(row.mrp || price),
          price: Number(price),
          originalPrice: Number(row.mrp || price),
          discountPercent: 0,
          discountAmount: 0,
          stock: Number(stock || 0),
          sku: sku || `SKU-${Date.now()}-${index}`,
          isAvailable: true,
        };

        if (existing) {
          existing.brand = brand || existing.brand;
          existing.category = categoryId as any;
          existing.variants = [variant] as any;
          existing.price = Number(price);
          existing.stock = Number(stock || 0);
          await existing.save();
          updated++;
        } else {
          await Product.create({
            name: name.trim(),
            brand: brand || '',
            category: categoryId,
            price: Number(price),
            stock: Number(stock || 0),
            image: row.image || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600',
            description: row.description || `${name} premium spice`,
            variants: [variant],
            status: 'active',
          });
          created++;
        }
      } catch (rowErr: any) {
        failed++;
        errors.push({ row: index + 1, message: rowErr.message });
      }
    }

    if (created > 0 || updated > 0) {
      await invalidateCachePattern('products:*');
    }

    return res.status(200).json(
      new ApiResponse(true, 'Import complete', { created, updated, failed, errors })
    );
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Import failed', null, 500));
  }
};

// ─── Search Picker Products ───────────────────────────────────────────────────

/**
 * GET /api/admin/products/search-picker
 * Lightweight search for product pickers / related product selection.
 */
export const searchPickerProducts = async (req: any, res: Response) => {
  try {
    const { q = '', limit = 20 } = req.query;
    const query: any = {};

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
      ];
    }

    const limitNum = Math.min(50, parseInt(limit as string, 10) || 20);

    const products = await Product.find(query)
      .select('_id name image price category brand status')
      .populate('category', 'name')
      .limit(limitNum)
      .lean();

    const formatted = products.map((p) => ({
      _id: p._id,
      name: p.name,
      image: p.image,
      price: p.price,
      brand: p.brand,
      status: p.status,
      categoryName: (p.category as any)?.name || '',
    }));

    return res.status(200).json(new ApiResponse(true, 'Products fetched', formatted));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Search picker failed', null, 500));
  }
};
