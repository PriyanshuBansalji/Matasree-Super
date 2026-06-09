"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = exports.getFeaturedProducts = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const Product_1 = __importDefault(require("../models/Product"));
const Category_1 = __importDefault(require("../models/Category"));
const response_1 = require("../utils/response");
const joi_1 = __importDefault(require("joi"));
const productSchema = joi_1.default.object({
    name: joi_1.default.string().required().trim(),
    description: joi_1.default.string().required(),
    price: joi_1.default.number().required().min(0),
    originalPrice: joi_1.default.number().optional().min(0),
    category: joi_1.default.string().required(),
    stock: joi_1.default.number().required().min(0),
    image: joi_1.default.string().required(),
    weight: joi_1.default.string().valid('100g', '250g', '500g', '1kg', '2kg').required(),
    tags: joi_1.default.array().items(joi_1.default.string()).optional(),
    isNew: joi_1.default.boolean().optional(),
    isBestseller: joi_1.default.boolean().optional(),
});
/**
 * Get all products with filtering and search
 */
const getProducts = async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, page = 1, limit = 12, sort } = req.query;
        let query = {};
        if (search) {
            // Use regex for partial matching (more flexible than $text index)
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
            ];
        }
        if (category) {
            // Support both ObjectId and category name
            const mongoose = require('mongoose');
            if (mongoose.Types.ObjectId.isValid(category)) {
                query.category = category;
            }
            else {
                // Look up category by name
                const Category = require('../models/Category').default;
                const cat = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
                if (cat) {
                    query.category = cat._id;
                }
            }
        }
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice)
                query.price.$gte = parseInt(minPrice);
            if (maxPrice)
                query.price.$lte = parseInt(maxPrice);
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
                            { createdAt: -1 });
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
        const product = await Product_1.default.findById(req.params.id).populate('category');
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
        const { error, value } = productSchema.validate(req.body);
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        // Find or create category
        let category = await Category_1.default.findOne({ name: value.category });
        if (!category) {
            // Create slug from category name with proper sanitization and uniqueness
            let baseSlug = value.category
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, '-')
                .replace(/^-+|-+$/g, '');
            // Ensure slug is not empty and unique
            if (!baseSlug) {
                baseSlug = 'category';
            }
            // Add timestamp and random suffix for guaranteed uniqueness
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 10000);
            const slug = `${baseSlug}-${timestamp}-${random}`.toLowerCase();
            category = await Category_1.default.create({
                name: value.category,
                slug: slug,
            });
        }
        const productData = {
            ...value,
            category: category._id,
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
        const { error, value } = productSchema.validate(req.body, { stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        // Find or create category
        let category = await Category_1.default.findOne({ name: value.category });
        if (!category) {
            // Create slug from category name with proper sanitization and uniqueness
            let baseSlug = value.category
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, '-')
                .replace(/^-+|-+$/g, '');
            // Ensure slug is not empty and unique
            if (!baseSlug) {
                baseSlug = 'category';
            }
            // Add timestamp and random suffix for guaranteed uniqueness
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 10000);
            const slug = `${baseSlug}-${timestamp}-${random}`.toLowerCase();
            category = await Category_1.default.create({
                name: value.category,
                slug: slug,
            });
        }
        const updateData = {
            ...value,
            category: category._id,
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
        const products = await Product_1.default.find({ isBestseller: true })
            .populate('category')
            .limit(8)
            .sort({ createdAt: -1 });
        res.status(200).json(new response_1.ApiResponse(true, 'Featured products fetched', products));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch products', null, 500));
    }
};
exports.getFeaturedProducts = getFeaturedProducts;
/**
 * Upload product image
 */
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json(new response_1.ApiResponse(false, 'No file uploaded', null, 400));
        }
        // Construct the image URL that will be served from the backend
        const imageUrl = `/uploads/products/${req.file.filename}`;
        res.status(200).json(new response_1.ApiResponse(true, 'Image uploaded successfully', {
            imageUrl,
            filename: req.file.filename,
            size: req.file.size,
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to upload image', null, 500));
    }
};
exports.uploadImage = uploadImage;
//# sourceMappingURL=productController.js.map