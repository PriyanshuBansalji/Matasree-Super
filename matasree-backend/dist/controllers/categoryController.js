"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoryById = exports.getCategories = void 0;
const Category_1 = __importDefault(require("../models/Category"));
const response_1 = require("../utils/response");
const joi_1 = __importDefault(require("joi"));
const categorySchema = joi_1.default.object({
    name: joi_1.default.string().required().trim(),
    slug: joi_1.default.string().required().lowercase(),
    description: joi_1.default.string().optional(),
    image: joi_1.default.string().optional(),
});
/**
 * Get all categories
 */
const getCategories = async (req, res) => {
    try {
        const categories = await Category_1.default.find().sort({ name: 1 });
        res.status(200).json(new response_1.ApiResponse(true, 'Categories fetched', categories));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch categories', null, 500));
    }
};
exports.getCategories = getCategories;
/**
 * Get category by ID
 */
const getCategoryById = async (req, res) => {
    try {
        const category = await Category_1.default.findById(req.params.id);
        if (!category) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Category not found', null, 404));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'Category fetched', category));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch category', null, 500));
    }
};
exports.getCategoryById = getCategoryById;
/**
 * Create category (Admin only)
 */
const createCategory = async (req, res) => {
    try {
        const { error, value } = categorySchema.validate(req.body);
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const category = await Category_1.default.create(value);
        res.status(201).json(new response_1.ApiResponse(true, 'Category created', category));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to create category', null, 500));
    }
};
exports.createCategory = createCategory;
/**
 * Update category (Admin only)
 */
const updateCategory = async (req, res) => {
    try {
        const { error, value } = categorySchema.validate(req.body, { stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const category = await Category_1.default.findByIdAndUpdate(req.params.id, value, { new: true });
        if (!category) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Category not found', null, 404));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'Category updated', category));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to update category', null, 500));
    }
};
exports.updateCategory = updateCategory;
/**
 * Delete category (Admin only)
 */
const deleteCategory = async (req, res) => {
    try {
        const category = await Category_1.default.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Category not found', null, 404));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'Category deleted'));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to delete category', null, 500));
    }
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=categoryController.js.map