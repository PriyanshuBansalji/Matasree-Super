import { Response } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import Product from '../models/Product';
import Category from '../models/Category';
import User from '../models/User';
import { ApiResponse } from '../utils/response';
import { uploadToCloudinary } from '../config/cloudinary';
import { AuthenticatedRequest } from '../middleware/auth';
import Joi from 'joi';

// ── Validation Schemas ──────────────────────────────────────────────────────

const variantSchema = Joi.object({
  weight: Joi.string().trim().required(),
  price: Joi.number().min(0).required(),
  originalPrice: Joi.number().min(0).optional(),
  stock: Joi.number().min(0).required(),
});

const productSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().required(),
  price: Joi.number().required().min(0),
  originalPrice: Joi.number().optional().min(0),
  category: Joi.string().required(),
  stock: Joi.number().required().min(0),
  image: Joi.string().required(),
  // weight is free-form now — no enum
  weight: Joi.string().trim().required(),
  // Variants array — optional, defaults to []
  variants: Joi.array().items(variantSchema).optional().default([]),
  // Tags for keyword search
  tags: Joi.array().items(Joi.string().trim()).optional().default([]),
  isNew: Joi.boolean().optional(),
  isBestseller: Joi.boolean().optional(),
  images: Joi.array().items(Joi.string()).optional().default([]),
});

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Find or create a category by name, returning the ObjectId.
 */
async function findOrCreateCategory(name: string): Promise<mongoose.Types.ObjectId> {
  let category = await Category.findOne({ name });
  if (!category) {
    let baseSlug = name
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

// ── Controllers ─────────────────────────────────────────────────────────────

// ── Fuzzy Typo-Tolerant Search Helpers ─────────────────────────────────────

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

const SPICE_SYNONYMS: Record<string, string[]> = {
  garam: ['garam', 'grm', 'gram', 'warm'],
  masala: ['masala', 'masla', 'msala', 'massala', 'blend', 'powder'],
  chilli: ['chilli', 'chili', 'chilly', 'mirch', 'mirchi', 'lal', 'red'],
  turmeric: ['turmeric', 'haldi', 'haldii', 'hildi', 'yellow'],
  kasoori: ['kasoori', 'kasuri', 'methi'],
  methi: ['methi', 'fenugreek', 'kasoori', 'kasuri'],
  super: ['super', 'supr', 'suber', 'sooper'],
  tadka: ['tadka', 'tarka', 'tdka'],
  hing: ['hing', 'heeng', 'asafoetida'],
  coriander: ['coriander', 'dhania', 'dhaniya'],
  cumin: ['cumin', 'jeera', 'zeera', 'zira'],
  cardamom: ['cardamom', 'elaichi', 'elachi'],
  clove: ['clove', 'laung', 'long'],
  cinnamon: ['cinnamon', 'dalchini'],
  paneer: ['paneer', 'panir'],
  kitchen: ['kitchen', 'kitchn', 'kichen'],
  king: ['king', 'kng'],
  sampuran: ['sampuran', 'sampurna', 'sampurn'],
  meat: ['meat', 'mutton'],
  chicken: ['chicken', 'chiken', 'chikn'],
  chaat: ['chaat', 'chat'],
};

export function calculateFuzzyScore(targetText: string, searchQuery: string): number {
  if (!targetText || !searchQuery) return 0;

  const targetLower = targetText.toLowerCase();
  const searchLower = searchQuery.toLowerCase().trim();

  if (targetLower === searchLower) return 100;
  if (targetLower.includes(searchLower)) return 90;

  const searchTokens = searchLower.split(/\s+/).filter(Boolean);
  const targetWords = targetLower.split(/[\s,\-/()]+/).filter(Boolean);

  let score = 0;

  for (const token of searchTokens) {
    let tokenMatched = false;

    for (const word of targetWords) {
      if (word === token) {
        score += 40;
        tokenMatched = true;
        break;
      }
      if (word.startsWith(token) || token.startsWith(word)) {
        score += 25;
        tokenMatched = true;
        break;
      }
      if (word.includes(token)) {
        score += 18;
        tokenMatched = true;
        break;
      }

      // Synonym match
      for (const [key, synonyms] of Object.entries(SPICE_SYNONYMS)) {
        if (
          (token === key || synonyms.includes(token)) &&
          (word === key || synonyms.includes(word))
        ) {
          score += 30;
          tokenMatched = true;
          break;
        }
      }

      if (tokenMatched) break;

      // Levenshtein fuzzy distance check
      if (token.length >= 3) {
        const dist = levenshteinDistance(token, word);
        const maxAllowed = token.length > 5 ? 2 : 1;
        if (dist <= maxAllowed) {
          score += 22;
          tokenMatched = true;
          break;
        }
      }
    }
  }

  return score;
}

// ── Controllers ─────────────────────────────────────────────────────────────

/**
 * Get all products with filtering and fuzzy search
 */
export const getProducts = async (req: any, res: Response) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      weight,
      minRating,
      inStock,
      page = 1,
      limit = 12,
      sort,
    } = req.query;

    const filterConditions: any[] = [];

    // Always filter active / non-deleted products
    filterConditions.push({
      $or: [
        { status: 'active' },
        { status: { $exists: false } },
        { status: null },
        { status: '' },
      ],
    });

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filterConditions.push({ category });
      } else {
        const cat = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
        if (cat) filterConditions.push({ category: cat._id });
      }
    }

    if (minPrice || maxPrice) {
      const priceCond: any = {};
      if (minPrice) priceCond.$gte = parseFloat(minPrice);
      if (maxPrice) priceCond.$lte = parseFloat(maxPrice);
      filterConditions.push({ price: priceCond });
    }

    if (weight) {
      filterConditions.push({
        $or: [{ weight }, { 'variants.weight': weight }],
      });
    }

    if (minRating) {
      filterConditions.push({ rating: { $gte: parseFloat(minRating) } });
    }

    if (inStock === 'true') {
      filterConditions.push({ stock: { $gt: 0 } });
    }

    const baseQuery = filterConditions.length > 0 ? { $and: filterConditions } : {};

    // Fetch candidate products
    let products = await Product.find(baseQuery).populate('category').lean();

    // If search term is present, apply fuzzy score ranking & typo filtering
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const searchTerm = search.trim();

      const scoredProducts = products.map((prod: any) => {
        const catName = typeof prod.category === 'string' ? prod.category : prod.category?.name || '';
        const combinedText = [
          prod.name,
          prod.description,
          catName,
          ...(Array.isArray(prod.tags) ? prod.tags : []),
          prod.weight,
          ...(Array.isArray(prod.variants) ? prod.variants.map((v: any) => v.weight) : []),
        ].filter(Boolean).join(' ');

        const score = calculateFuzzyScore(combinedText, searchTerm);
        return { prod, score };
      });

      // Keep only products with positive score and sort descending by relevance score
      const matching = scoredProducts
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

      products = matching.map(item => item.prod);
    } else {
      // Normal sorting when no search query
      if (sort === '-sold') products.sort((a: any, b: any) => (b.sold || 0) - (a.sold || 0));
      else if (sort === 'sold') products.sort((a: any, b: any) => (a.sold || 0) - (b.sold || 0));
      else if (sort === '-price') products.sort((a: any, b: any) => (b.price || 0) - (a.price || 0));
      else if (sort === 'price') products.sort((a: any, b: any) => (a.price || 0) - (b.price || 0));
      else if (sort === '-rating') products.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    }

    const total = products.length;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 12;
    const paginatedProducts = products.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.status(200).json(
      new ApiResponse(true, 'Products fetched', {
        products: paginatedProducts,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      })
    );
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch products', null, 500));
  }
};

/**
 * Get product by ID
 */
export const getProductById = async (req: any, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).populate('category').lean();
    if (!product) {
      return res.status(404).json(new ApiResponse(false, 'Product not found', null, 404));
    }
    res.status(200).json(new ApiResponse(true, 'Product fetched', product));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch product', null, 500));
  }
};

/**
 * Create product (Admin only)
 */
export const createProduct = async (req: any, res: Response) => {
  try {
    const { error, value } = productSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const categoryId = await findOrCreateCategory(value.category);

    const productData = {
      name: value.name,
      description: value.description,
      price: value.price,
      originalPrice: value.originalPrice,
      category: categoryId,
      stock: value.stock,
      image: value.image,
      images: value.images ?? [],
      weight: value.weight,
      variants: value.variants ?? [],
      tags: value.tags ?? [],
      isNewProduct: value.isNew ?? false,
      isBestseller: value.isBestseller ?? false,
    };

    const product = await Product.create(productData);
    const populatedProduct = await product.populate('category');
    res.status(201).json(new ApiResponse(true, 'Product created', populatedProduct));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to create product', null, 500));
  }
};

/**
 * Update product (Admin only)
 */
export const updateProduct = async (req: any, res: Response) => {
  try {
    const { error, value } = productSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const categoryId = await findOrCreateCategory(value.category);

    const updateData = {
      name: value.name,
      description: value.description,
      price: value.price,
      originalPrice: value.originalPrice,
      category: categoryId,
      stock: value.stock,
      image: value.image,
      images: value.images ?? [],
      weight: value.weight,
      variants: value.variants ?? [],
      tags: value.tags ?? [],
      isNewProduct: value.isNew ?? false,
      isBestseller: value.isBestseller ?? false,
    };

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('category');
    if (!product) {
      return res.status(404).json(new ApiResponse(false, 'Product not found', null, 404));
    }

    res.status(200).json(new ApiResponse(true, 'Product updated', product));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to update product', null, 500));
  }
};

/**
 * Delete product (Admin only)
 */
export const deleteProduct = async (req: any, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json(new ApiResponse(false, 'Product not found', null, 404));
    }
    res.status(200).json(new ApiResponse(true, 'Product deleted'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to delete product', null, 500));
  }
};

/**
 * Get featured/bestseller products
 */
export const getFeaturedProducts = async (req: any, res: Response) => {
  try {
    const products = await Product.find({ $or: [{ isBestseller: true }, { isNewProduct: true }] })
      .populate('category')
      .limit(8)
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(new ApiResponse(true, 'Featured products fetched', products));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch products', null, 500));
  }
};

/**
 * Autocomplete search — GET /api/products/search?q=&limit=10
 */
export const searchProducts = async (req: any, res: Response) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const limitParam = req.query.limit;

    if (q.length > 200) {
      return res.status(400).json({ success: false, message: 'Search query too long' });
    }

    const trimmed = q.trim();
    if (trimmed.length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    const limit = Math.min(parseInt(String(limitParam)) || 10, 10);

    let products;
    const regex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    // Try $text search first (uses the index on name/description/tags)
    try {
      products = await Product.find(
        {
          $or: [
            { $text: { $search: trimmed } },
            { weight: regex },
            { 'variants.weight': regex }
          ]
        },
        { score: { $meta: 'textScore' } }
      )
        .select('name price originalPrice image weight stock rating variants')
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .lean();
    } catch {
      // Fallback to $regex
      products = await Product.find({
        $or: [
          { name: regex },
          { description: regex },
          { tags: regex },
          { weight: regex },
          { 'variants.weight': regex }
        ],
      })
        .select('name price originalPrice image weight stock rating variants')
        .limit(limit)
        .lean();
    }

    return res.status(200).json({ success: true, data: products });
  } catch (error: any) {
    return res.status(503).json({ success: false, message: 'Search is temporarily unavailable' });
  }
};

/**
 * Get recently viewed products
 */
export const getRecentlyViewed = async (req: any, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.userId;

    const user = await User.findById(userId)
      .populate({
        path: 'recentlyViewed.productId',
        select: 'name price originalPrice image weight stock rating variants',
      })
      .lean();

    if (!user) {
      return res.status(404).json(new ApiResponse(false, 'User not found', null, 404));
    }

    const recentlyViewed = (user.recentlyViewed as any[])
      .filter((entry) => entry.productId !== null)
      .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
      .slice(0, 10)
      .map((entry) => ({
        product: entry.productId,
        viewedAt: entry.viewedAt,
      }));

    return res.status(200).json(new ApiResponse(true, 'Recently viewed products fetched', recentlyViewed));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch recently viewed', null, 500));
  }
};

/**
 * Add product to recently viewed
 */
export const addToRecentlyViewed = async (req: any, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { productId } = req.params;
    const userId = authReq.user!.userId;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json(new ApiResponse(false, 'Invalid product ID', null, 400));
    }

    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json(new ApiResponse(false, 'Product not found', null, 404));
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiResponse(false, 'User not found', null, 404));
    }

    const now = new Date();
    const productObjId = new mongoose.Types.ObjectId(productId);
    const existingIndex = user.recentlyViewed.findIndex((e) => e.productId.equals(productObjId));

    if (existingIndex !== -1) {
      user.recentlyViewed[existingIndex].viewedAt = now;
    } else {
      user.recentlyViewed.push({ productId: productObjId, viewedAt: now });
    }

    user.recentlyViewed.sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());
    user.recentlyViewed = user.recentlyViewed.slice(0, 10) as typeof user.recentlyViewed;

    await user.save();
    return res.status(200).json(new ApiResponse(true, 'Added to recently viewed'));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to update recently viewed', null, 500));
  }
};

/**
 * Upload product image
 */
export const uploadImage = async (req: any, res: Response) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json(new ApiResponse(false, 'No file uploaded', null, 400));
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // If Cloudinary is configured, use it
    if (cloudName && apiKey && apiSecret) {
      const result = await uploadToCloudinary(req.file.buffer, 'matasree/products');
      return res.status(200).json(
        new ApiResponse(true, 'Image uploaded successfully', {
          imageUrl: result.secure_url,
          publicId: result.public_id,
        })
      );
    }

    // Development fallback: save to local uploads/products directory
    const uploadsDir = path.join(process.cwd(), 'uploads', 'products');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = req.file.mimetype === 'image/png' ? '.png'
              : req.file.mimetype === 'image/webp' ? '.webp'
              : req.file.mimetype === 'image/gif'  ? '.gif'
              : '.jpg';
    const filename = `product-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, req.file.buffer);

    const imageUrl = `/uploads/products/${filename}`;
    console.warn('⚠️  Cloudinary not configured — image saved locally:', imageUrl);

    return res.status(200).json(
      new ApiResponse(true, 'Image uploaded successfully (local storage — configure Cloudinary for production)', {
        imageUrl,
        publicId: filename,
      })
    );
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to upload image', null, 500));
  }
};
