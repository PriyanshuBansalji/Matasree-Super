"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = exports.addToRecentlyViewed = exports.getRecentlyViewed = exports.searchProducts = exports.getFeaturedProducts = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const Product_1 = __importDefault(require("../models/Product"));
const Category_1 = __importDefault(require("../models/Category"));
const User_1 = __importDefault(require("../models/User"));
const response_1 = require("../utils/response");
const cloudinary_1 = require("../config/cloudinary");
const joi_1 = __importDefault(require("joi"));
// ── Validation Schemas ──────────────────────────────────────────────────────
const variantSchema = joi_1.default.object({
    weight: joi_1.default.string().trim().required(),
    price: joi_1.default.number().min(0).required(),
    originalPrice: joi_1.default.number().min(0).optional(),
    stock: joi_1.default.number().min(0).required(),
});
const productSchema = joi_1.default.object({
    name: joi_1.default.string().required().trim(),
    description: joi_1.default.string().required(),
    price: joi_1.default.number().required().min(0),
    originalPrice: joi_1.default.number().optional().min(0),
    category: joi_1.default.string().required(),
    stock: joi_1.default.number().required().min(0),
    image: joi_1.default.string().required(),
    // weight is free-form now — no enum
    weight: joi_1.default.string().trim().required(),
    // Variants array — optional, defaults to []
    variants: joi_1.default.array().items(variantSchema).optional().default([]),
    // Tags for keyword search
    tags: joi_1.default.array().items(joi_1.default.string().trim()).optional().default([]),
    isNew: joi_1.default.boolean().optional(),
    isBestseller: joi_1.default.boolean().optional(),
    images: joi_1.default.array().items(joi_1.default.string()).optional().default([]),
});
// ── Helpers ─────────────────────────────────────────────────────────────────
/**
 * Find or create a category by name, returning the ObjectId.
 */
async function findOrCreateCategory(name) {
    let category = await Category_1.default.findOne({ name });
    if (!category) {
        let baseSlug = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .replace(/^-+|-+$/g, '') || 'category';
        const slug = `${baseSlug}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        category = await Category_1.default.create({ name, slug });
    }
    return category._id;
}
// ── Controllers ─────────────────────────────────────────────────────────────
/**
 * Get all products with filtering and search
 */
const getProducts = async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, weight, minRating, inStock, page = 1, limit = 12, sort, } = req.query;
        let query = {};
        if (search) {
            // Search across name, description, and tags
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
                { weight: { $regex: search, $options: 'i' } },
                // Also search within variant weights
                { 'variants.weight': { $regex: search, $options: 'i' } },
            ];
        }
        if (category) {
            if (mongoose_1.default.Types.ObjectId.isValid(category)) {
                query.category = category;
            }
            else {
                const cat = await Category_1.default.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
                if (cat)
                    query.category = cat._id;
            }
        }
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice)
                query.price.$gte = parseFloat(minPrice);
            if (maxPrice)
                query.price.$lte = parseFloat(maxPrice);
        }
        // Weight filter — matches base weight OR any variant weight
        if (weight) {
            query.$or = [
                ...(query.$or ?? []),
                { weight },
                { 'variants.weight': weight },
            ];
        }
        if (minRating) {
            query.rating = { $gte: parseFloat(minRating) };
        }
        if (inStock === 'true') {
            query.stock = { $gt: 0 };
        }
        // Default to 'active' products on public endpoint (Req 15.4)
        if (!query.status) {
            query.status = 'active';
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const products = await Product_1.default.find(query)
            .populate('category')
            .skip(skip)
            .limit(parseInt(limit))
            .sort(sort === '-sold' ? { sold: -1 } :
            sort === 'sold' ? { sold: 1 } :
                sort === '-price' ? { price: -1 } :
                    sort === 'price' ? { price: 1 } :
                        sort === '-rating' ? { rating: -1 } :
                            { createdAt: -1 })
            .lean();
        const total = await Product_1.default.countDocuments(query);
        res.status(200).json(new response_1.ApiResponse(true, 'Products fetched', {
            products,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch products', null, 500));
    }
};
exports.getProducts = getProducts;
/**
 * Get product by ID
 */
const getProductById = async (req, res) => {
    try {
        const product = await Product_1.default.findById(req.params.id).populate('category').lean();
        if (!product) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Product not found', null, 404));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'Product fetched', product));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch product', null, 500));
    }
};
exports.getProductById = getProductById;
/**
 * Create product (Admin only)
 */
const createProduct = async (req, res) => {
    try {
        const { error, value } = productSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
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
        const product = await Product_1.default.create(productData);
        const populatedProduct = await product.populate('category');
        res.status(201).json(new response_1.ApiResponse(true, 'Product created', populatedProduct));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to create product', null, 500));
    }
};
exports.createProduct = createProduct;
/**
 * Update product (Admin only)
 */
const updateProduct = async (req, res) => {
    try {
        const { error, value } = productSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
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
        const product = await Product_1.default.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('category');
        if (!product) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Product not found', null, 404));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'Product updated', product));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to update product', null, 500));
    }
};
exports.updateProduct = updateProduct;
/**
 * Delete product (Admin only)
 */
const deleteProduct = async (req, res) => {
    try {
        const product = await Product_1.default.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Product not found', null, 404));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'Product deleted'));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to delete product', null, 500));
    }
};
exports.deleteProduct = deleteProduct;
/**
 * Get featured/bestseller products
 */
const getFeaturedProducts = async (req, res) => {
    try {
        const products = await Product_1.default.find({ $or: [{ isBestseller: true }, { isNewProduct: true }] })
            .populate('category')
            .limit(8)
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json(new response_1.ApiResponse(true, 'Featured products fetched', products));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch products', null, 500));
    }
};
exports.getFeaturedProducts = getFeaturedProducts;
/**
 * Autocomplete search — GET /api/products/search?q=&limit=10
 */
const searchProducts = async (req, res) => {
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
            products = await Product_1.default.find({
                $or: [
                    { $text: { $search: trimmed } },
                    { weight: regex },
                    { 'variants.weight': regex }
                ]
            }, { score: { $meta: 'textScore' } })
                .select('name price originalPrice image weight stock rating variants')
                .sort({ score: { $meta: 'textScore' } })
                .limit(limit)
                .lean();
        }
        catch {
            // Fallback to $regex
            products = await Product_1.default.find({
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
    }
    catch (error) {
        return res.status(503).json({ success: false, message: 'Search is temporarily unavailable' });
    }
};
exports.searchProducts = searchProducts;
/**
 * Get recently viewed products
 */
const getRecentlyViewed = async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user.userId;
        const user = await User_1.default.findById(userId)
            .populate({
            path: 'recentlyViewed.productId',
            select: 'name price originalPrice image weight stock rating variants',
        })
            .lean();
        if (!user) {
            return res.status(404).json(new response_1.ApiResponse(false, 'User not found', null, 404));
        }
        const recentlyViewed = user.recentlyViewed
            .filter((entry) => entry.productId !== null)
            .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
            .slice(0, 10)
            .map((entry) => ({
            product: entry.productId,
            viewedAt: entry.viewedAt,
        }));
        return res.status(200).json(new response_1.ApiResponse(true, 'Recently viewed products fetched', recentlyViewed));
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch recently viewed', null, 500));
    }
};
exports.getRecentlyViewed = getRecentlyViewed;
/**
 * Add product to recently viewed
 */
const addToRecentlyViewed = async (req, res) => {
    try {
        const authReq = req;
        const { productId } = req.params;
        const userId = authReq.user.userId;
        if (!mongoose_1.default.Types.ObjectId.isValid(productId)) {
            return res.status(400).json(new response_1.ApiResponse(false, 'Invalid product ID', null, 400));
        }
        const product = await Product_1.default.findById(productId).lean();
        if (!product) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Product not found', null, 404));
        }
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json(new response_1.ApiResponse(false, 'User not found', null, 404));
        }
        const now = new Date();
        const productObjId = new mongoose_1.default.Types.ObjectId(productId);
        const existingIndex = user.recentlyViewed.findIndex((e) => e.productId.equals(productObjId));
        if (existingIndex !== -1) {
            user.recentlyViewed[existingIndex].viewedAt = now;
        }
        else {
            user.recentlyViewed.push({ productId: productObjId, viewedAt: now });
        }
        user.recentlyViewed.sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());
        user.recentlyViewed = user.recentlyViewed.slice(0, 10);
        await user.save();
        return res.status(200).json(new response_1.ApiResponse(true, 'Added to recently viewed'));
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to update recently viewed', null, 500));
    }
};
exports.addToRecentlyViewed = addToRecentlyViewed;
/**
 * Upload product image
 */
const uploadImage = async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json(new response_1.ApiResponse(false, 'No file uploaded', null, 400));
        }
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        // If Cloudinary is configured, use it
        if (cloudName && apiKey && apiSecret) {
            const result = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, 'matasree/products');
            return res.status(200).json(new response_1.ApiResponse(true, 'Image uploaded successfully', {
                imageUrl: result.secure_url,
                publicId: result.public_id,
            }));
        }
        // Development fallback: save to local uploads/products directory
        const uploadsDir = path_1.default.join(process.cwd(), 'uploads', 'products');
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        }
        const ext = req.file.mimetype === 'image/png' ? '.png'
            : req.file.mimetype === 'image/webp' ? '.webp'
                : req.file.mimetype === 'image/gif' ? '.gif'
                    : '.jpg';
        const filename = `product-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
        const filepath = path_1.default.join(uploadsDir, filename);
        fs_1.default.writeFileSync(filepath, req.file.buffer);
        const imageUrl = `/uploads/products/${filename}`;
        console.warn('⚠️  Cloudinary not configured — image saved locally:', imageUrl);
        return res.status(200).json(new response_1.ApiResponse(true, 'Image uploaded successfully (local storage — configure Cloudinary for production)', {
            imageUrl,
            publicId: filename,
        }));
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to upload image', null, 500));
    }
};
exports.uploadImage = uploadImage;
//# sourceMappingURL=productController.js.map