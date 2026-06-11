import { Response } from 'express';
import Category from '../models/Category';
import { ApiResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import Joi from 'joi';

const categorySchema = Joi.object({
  name: Joi.string().required().trim(),
  slug: Joi.string().required().lowercase(),
  description: Joi.string().optional(),
  image: Joi.string().optional(),
});

/**
 * Get all categories
 */
export const getCategories = async (req: any, res: Response) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json(new ApiResponse(true, 'Categories fetched', categories));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch categories', null, 500));
  }
};

/**
 * Get category by ID
 */
export const getCategoryById = async (req: any, res: Response) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json(new ApiResponse(false, 'Category not found', null, 404));
    }
    res.status(200).json(new ApiResponse(true, 'Category fetched', category));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch category', null, 500));
  }
};

/**
 * Create category (Admin only)
 */
export const createCategory = async (req: any, res: Response) => {
  try {
    const { error, value } = categorySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const category = await Category.create(value);
    res.status(201).json(new ApiResponse(true, 'Category created', category));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to create category', null, 500));
  }
};

/**
 * Update category (Admin only)
 */
export const updateCategory = async (req: any, res: Response) => {
  try {
    const { error, value } = categorySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const category = await Category.findByIdAndUpdate(req.params.id, value, { new: true });

    if (!category) {
      return res.status(404).json(new ApiResponse(false, 'Category not found', null, 404));
    }

    res.status(200).json(new ApiResponse(true, 'Category updated', category));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to update category', null, 500));
  }
};

/**
 * Delete category (Admin only)
 */
export const deleteCategory = async (req: any, res: Response) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json(new ApiResponse(false, 'Category not found', null, 404));
    }

    res.status(200).json(new ApiResponse(true, 'Category deleted'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to delete category', null, 500));
  }
};
