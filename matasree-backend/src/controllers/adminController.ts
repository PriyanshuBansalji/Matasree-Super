import { Response } from 'express';
import User from '../models/User';
import Product from '../models/Product';
import Cart from '../models/Cart';
import Wishlist from '../models/Wishlist';
import Address from '../models/Address';
import LoyaltyAccount from '../models/LoyaltyAccount';
import LoyaltyTransaction from '../models/LoyaltyTransaction';
import RefreshToken from '../models/RefreshToken';
import Order from '../models/Order';
import Payment from '../models/Payment';
import AdminConfig from '../models/AdminConfig';
import Recipe from '../models/Recipe';
import SeasonalBanner from '../models/SeasonalBanner';
import Coupon from '../models/Coupon';
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
      { $match: { orderstatus: { $ne: 'cancelled' } } },
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
    const { startDate, endDate } = req.query;
    let matchFilter: any = { orderstatus: { $ne: 'cancelled' } };

    if (startDate || endDate) {
      if (startDate && endDate && startDate > endDate) {
        return res.status(400).json(new ApiResponse(false, 'startDate cannot be after endDate', null, 400));
      }

      const dateFilter: any = {};
      if (startDate) {
        const start = new Date(startDate as string);
        start.setUTCHours(0, 0, 0, 0);
        dateFilter.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setUTCHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      matchFilter.createdAt = dateFilter;
    } else {
      // Fallback to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
      matchFilter.createdAt = { $gte: thirtyDaysAgo };
    }

    const dailyRevenue = await Order.aggregate([
      { $match: matchFilter },
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
    ]);

    return res.status(200).json(new ApiResponse(true, 'Revenue analytics fetched', dailyRevenue));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch analytics', null, 500));
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
    const cashfreeEntry = paymentSummary.find((item: any) => item._id === 'cashfree' || item._id === 'razorpay');
    const codEntry = paymentSummary.find((item: any) => item._id === 'cod');

    const structured = {
      totalPayments,
      cashfreePayments: cashfreeEntry?.count || 0,
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
    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json(new ApiResponse(false, 'User not found', null, 404));
    }

    // Cascade delete associated user data (Phase 2, Req 9.1, 9.2, 9.3)
    const settlements = await Promise.allSettled([
      Cart.deleteOne({ userId }),
      Wishlist.deleteOne({ userId }),
      Address.deleteMany({ userId }),
      LoyaltyAccount.deleteOne({ userId }),
      LoyaltyTransaction.deleteMany({ userId }),
      RefreshToken.deleteMany({ userId }),
    ]);

    // Log any rejected settlements
    settlements.forEach((result, idx) => {
      if (result.status === 'rejected') {
        console.error(`[deleteUser cascade] Task ${idx} failed:`, result.reason);
      }
    });

    return res.status(200).json(new ApiResponse(true, 'User deleted successfully'));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to delete user', null, 500));
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
    const { tag, region, page = 1, limit: limitQuery } = req.query;
    const limit = limitQuery ? parseInt(limitQuery as string, 10) : 500;
    const skip = (parseInt(page as string, 10) - 1) * limit;

    const filter: Record<string, any> = {};
    if (tag) filter.productTags = tag as string;
    if (region) filter.region = region as string;

    const [recipes, total] = await Promise.all([
      Recipe.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
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
export const getSeasonalBanners = async (req: any, res: Response) => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    let filter: any = {};
    if (activeOnly) {
      const now = new Date();
      filter = {
        activeFrom: { $lte: now },
        activeTo: { $gte: now },
      };
    }
    const banners = await SeasonalBanner.find(filter).sort({ activeFrom: 1 }).lean();
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

/**
 * GET /api/admin/products/low-stock (Admin)
 * Phase 3, Req 11.3
 */
export const getLowStockProducts = async (req: any, res: Response) => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 10;
    const products = await Product.find({ stock: { $lt: threshold } })
      .select('name stock price image')
      .sort({ stock: 1 })
      .lean();

    return res.status(200).json(new ApiResponse(true, 'Low stock products fetched', products));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch low stock products', null, 500));
  }
};

/**
 * GET /api/admin/coupons/analytics (Admin)
 * Phase 3, Req 12.2
 */
export const getCouponAnalytics = async (req: any, res: Response) => {
  try {
    const coupons = await Coupon.find().lean();
    const orderSums = await Order.aggregate([
      { $match: { couponCode: { $ne: null } } },
      {
        $group: {
          _id: '$couponCode',
          totalRevenueSaved: { $sum: '$discountAmount' },
        },
      },
    ]);

    const revenueMap = new Map(orderSums.map((item) => [item._id.toUpperCase(), item.totalRevenueSaved]));

    const analytics = coupons.map((c) => ({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      usageCount: c.usageCount || 0,
      maxUses: c.maxUses || 0,
      totalRevenueSaved: revenueMap.get(c.code.toUpperCase()) || 0,
    }));

    return res.status(200).json(new ApiResponse(true, 'Coupon analytics fetched', analytics));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch coupon analytics', null, 500));
  }
};

/**
 * GET /api/admin/products/top-selling (Admin)
 * Phase 3, Req 14.3
 */
export const getTopSellingProducts = async (req: any, res: Response) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit as string) || 5);
    const products = await Product.find({ sold: { $gt: 0 } })
      .select('name sold price image')
      .sort({ sold: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json(new ApiResponse(true, 'Top selling products fetched', products));
  } catch (error: any) {
    return res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch top selling products', null, 500));
  }
};
