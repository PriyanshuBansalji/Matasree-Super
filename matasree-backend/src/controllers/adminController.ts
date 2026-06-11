import { Response } from 'express';
import User from '../models/User';
import Order from '../models/Order';
import Payment from '../models/Payment';
import AdminConfig from '../models/AdminConfig';
import Recipe from '../models/Recipe';
import SeasonalBanner from '../models/SeasonalBanner';
import { ApiResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import Joi from 'joi';

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid('customer', 'admin').required(),
});

const abandonmentConfigSchema = Joi.object({
  abandonWindowHours: Joi.number().integer().min(1).max(24).required(),
  abandonmentCouponCode: Joi.string().allow(null, '').optional(),
});

/**
 * Get dashboard statistics (Admin)
 */
export const getDashboardStats = async (req: any, res: Response) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const revenueValue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$orderstatus', count: { $sum: 1 } } },
    ]);

    res.status(200).json(
      new ApiResponse(true, 'Dashboard stats fetched', {
        totalUsers,
        totalOrders,
        totalRevenue: revenueValue,
        ordersByStatus: ordersByStatus.reduce((acc: any, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      })
    );
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch stats', null, 500));
  }
};

/**
 * Get all users (Admin)
 */
export const getAllUsers = async (req: any, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const users = await User.find()
      .skip(skip)
      .limit(parseInt(limit as string))
      .select('-password')
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    res.status(200).json(
      new ApiResponse(true, 'Users fetched', {
        users,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      })
    );
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch users', null, 500));
  }
};

/**
 * Get revenue analytics (Admin)
 */
export const getRevenueAnalytics = async (req: any, res: Response) => {
  try {
    const dailyRevenue = await Order.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }, // Last 30 days
    ]);

    res.status(200).json(new ApiResponse(true, 'Revenue analytics fetched', dailyRevenue));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch analytics', null, 500));
  }
};

/**
 * Get payment summary (Admin)
 */
export const getPaymentSummary = async (req: any, res: Response) => {
  try {
    const paymentSummary = await Payment.aggregate([
      {
        $group: {
          _id: '$method',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Transform raw aggregate array into structured shape
    const totalPayments = paymentSummary.reduce((sum: number, item: any) => sum + item.count, 0);
    const razorpayEntry = paymentSummary.find((item: any) => item._id === 'razorpay');
    const codEntry = paymentSummary.find((item: any) => item._id === 'cod');

    const structured = {
      totalPayments,
      razorpayPayments: razorpayEntry?.count || 0,
      codPayments: codEntry?.count || 0,
      paymentMethods: paymentSummary,
    };

    res.status(200).json(new ApiResponse(true, 'Payment summary fetched', structured));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch payment summary', null, 500));
  }
};

/**
 * Update user role (Admin)
 */
export const updateUserRole = async (req: any, res: Response) => {
  try {
    const { error, value } = updateUserRoleSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { role } = value;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json(new ApiResponse(false, 'User not found', null, 404));
    }

    res.status(200).json(new ApiResponse(true, 'User role updated', user));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to update user role', null, 500));
  }
};

/**
 * Delete user (Admin)
 */
export const deleteUser = async (req: any, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json(new ApiResponse(false, 'User not found', null, 404));
    }

    res.status(200).json(new ApiResponse(true, 'User deleted successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to delete user', null, 500));
  }
};

/**
 * GET /api/admin/abandonment-config (Admin)
 * Returns the current cart abandonment configuration.
 * Requirements: 14.5
 */
export const getAbandonmentConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [windowDoc, couponDoc] = await Promise.all([
      AdminConfig.findOne({ key: 'abandonmentWindowHours' }),
      AdminConfig.findOne({ key: 'abandonmentCouponCode' }),
    ]);

    return res.status(200).json(
      new ApiResponse(true, 'Abandonment config fetched', {
        abandonWindowHours:
          windowDoc && typeof windowDoc.value === 'number' ? windowDoc.value : 2,
        abandonmentCouponCode:
          couponDoc && typeof couponDoc.value === 'string' && couponDoc.value.trim()
            ? couponDoc.value.trim()
            : null,
      })
    );
  } catch (error: any) {
    return res
      .status(500)
      .json(new ApiResponse(false, error.message || 'Failed to fetch abandonment config', null, 500));
  }
};

/**
 * PUT /api/admin/abandonment-config (Admin)
 * Updates the cart abandonment window and optional coupon code.
 * Requirements: 14.5
 */
export const updateAbandonmentConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error, value } = abandonmentConfigSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const { abandonWindowHours, abandonmentCouponCode } = value;

    await Promise.all([
      AdminConfig.findOneAndUpdate(
        { key: 'abandonmentWindowHours' },
        { value: abandonWindowHours },
        { upsert: true, new: true }
      ),
      AdminConfig.findOneAndUpdate(
        { key: 'abandonmentCouponCode' },
        { value: abandonmentCouponCode ?? null },
        { upsert: true, new: true }
      ),
    ]);

    return res.status(200).json(
      new ApiResponse(true, 'Abandonment config updated', {
        abandonWindowHours,
        abandonmentCouponCode: abandonmentCouponCode ?? null,
      })
    );
  } catch (error: any) {
    return res
      .status(500)
      .json(new ApiResponse(false, error.message || 'Failed to update abandonment config', null, 500));
  }
};

// ============================================================
// RECIPE HANDLERS (Requirements: 9.2, 9.3, 16.3)
// ============================================================

const recipeSchema = Joi.object({
  title: Joi.string().trim().required(),
  description: Joi.string().trim().required(),
  ingredients: Joi.array().items(Joi.string()).default([]),
  steps: Joi.array().items(Joi.string()).default([]),
  productTags: Joi.array().items(Joi.string()).default([]),
  region: Joi.string()
    .valid('North Indian', 'South Indian', 'Bengali', 'Rajasthani', 'Other')
    .required(),
  image: Joi.string().uri().allow('', null).optional(),
});

/**
 * GET /api/admin/recipes (public)
 * Returns paginated recipes, optionally filtered by tag and/or region.
 */
export const getRecipes = async (req: any, res: Response) => {
  try {
    const { tag, region, page = 1 } = req.query;
    const limit = 10;
    const skip = (parseInt(page as string, 10) - 1) * limit;

    const filter: Record<string, any> = {};
    if (tag) filter.productTags = tag as string;
    if (region) filter.region = region as string;

    const [recipes, total] = await Promise.all([
      Recipe.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Recipe.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(true, 'Recipes fetched', {
        recipes,
        pagination: {
          total,
          page: parseInt(page as string, 10),
          limit,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error: any) {
    return res
      .status(500)
      .json(new ApiResponse(false, error.message || 'Failed to fetch recipes', null, 500));
  }
};

/**
 * POST /api/admin/recipes (admin-only)
 */
export const createRecipe = async (req: any, res: Response) => {
  try {
    const { error, value } = recipeSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const recipe = await Recipe.create(value);
    return res.status(201).json(new ApiResponse(true, 'Recipe created', recipe));
  } catch (error: any) {
    return res
      .status(500)
      .json(new ApiResponse(false, error.message || 'Failed to create recipe', null, 500));
  }
};

/**
 * PUT /api/admin/recipes/:id (admin-only)
 */
export const updateRecipe = async (req: any, res: Response) => {
  try {
    const { error, value } = recipeSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const recipe = await Recipe.findByIdAndUpdate(req.params.id, value, { new: true });
    if (!recipe) {
      return res.status(404).json(new ApiResponse(false, 'Recipe not found', null, 404));
    }
    return res.status(200).json(new ApiResponse(true, 'Recipe updated', recipe));
  } catch (error: any) {
    return res
      .status(500)
      .json(new ApiResponse(false, error.message || 'Failed to update recipe', null, 500));
  }
};

/**
 * DELETE /api/admin/recipes/:id (admin-only)
 */
export const deleteRecipe = async (req: any, res: Response) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) {
      return res.status(404).json(new ApiResponse(false, 'Recipe not found', null, 404));
    }
    return res.status(200).json(new ApiResponse(true, 'Recipe deleted'));
  } catch (error: any) {
    return res
      .status(500)
      .json(new ApiResponse(false, error.message || 'Failed to delete recipe', null, 500));
  }
};

// ============================================================
// SEASONAL BANNER HANDLERS (Requirements: 9.4, 9.5, 17.1)
// ============================================================

const bannerSchema = Joi.object({
  image: Joi.string().trim().required(),
  title: Joi.string().trim().required(),
  subtitle: Joi.string().trim().allow('', null).optional(),
  ctaLink: Joi.string().trim().required(),
  ctaText: Joi.string().trim().required(),
  activeFrom: Joi.date().required(),
  activeTo: Joi.date().required(),
});

/**
 * GET /api/admin/banners (public)
 * Returns all seasonal banners; client filters by activeFrom/activeTo.
 */
export const getSeasonalBanners = async (_req: any, res: Response) => {
  try {
    const banners = await SeasonalBanner.find().sort({ activeFrom: 1 });
    return res.status(200).json(new ApiResponse(true, 'Banners fetched', banners));
  } catch (error: any) {
    return res
      .status(500)
      .json(new ApiResponse(false, error.message || 'Failed to fetch banners', null, 500));
  }
};

/**
 * POST /api/admin/banners (admin-only)
 */
export const createBanner = async (req: any, res: Response) => {
  try {
    const { error, value } = bannerSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const banner = await SeasonalBanner.create(value);
    return res.status(201).json(new ApiResponse(true, 'Banner created', banner));
  } catch (error: any) {
    return res
      .status(500)
      .json(new ApiResponse(false, error.message || 'Failed to create banner', null, 500));
  }
};

/**
 * PUT /api/admin/banners/:id (admin-only)
 */
export const updateBanner = async (req: any, res: Response) => {
  try {
    const { error, value } = bannerSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const banner = await SeasonalBanner.findByIdAndUpdate(req.params.id, value, { new: true });
    if (!banner) {
      return res.status(404).json(new ApiResponse(false, 'Banner not found', null, 404));
    }
    return res.status(200).json(new ApiResponse(true, 'Banner updated', banner));
  } catch (error: any) {
    return res
      .status(500)
      .json(new ApiResponse(false, error.message || 'Failed to update banner', null, 500));
  }
};

/**
 * DELETE /api/admin/banners/:id (admin-only)
 */
export const deleteBanner = async (req: any, res: Response) => {
  try {
    const banner = await SeasonalBanner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json(new ApiResponse(false, 'Banner not found', null, 404));
    }
    return res.status(200).json(new ApiResponse(true, 'Banner deleted'));
  } catch (error: any) {
    return res
      .status(500)
      .json(new ApiResponse(false, error.message || 'Failed to delete banner', null, 500));
  }
};
