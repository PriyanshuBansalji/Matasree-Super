"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopSellingProducts = exports.getCouponAnalytics = exports.getLowStockProducts = exports.deleteBanner = exports.updateBanner = exports.createBanner = exports.getSeasonalBanners = exports.deleteRecipe = exports.updateRecipe = exports.createRecipe = exports.getRecipes = exports.updateAbandonmentConfig = exports.getAbandonmentConfig = exports.deleteUser = exports.updateUserRole = exports.getPaymentSummary = exports.getRevenueAnalytics = exports.getAllUsers = exports.getDashboardStats = void 0;
const User_1 = __importDefault(require("../models/User"));
const Product_1 = __importDefault(require("../models/Product"));
const Cart_1 = __importDefault(require("../models/Cart"));
const Wishlist_1 = __importDefault(require("../models/Wishlist"));
const Address_1 = __importDefault(require("../models/Address"));
const LoyaltyAccount_1 = __importDefault(require("../models/LoyaltyAccount"));
const LoyaltyTransaction_1 = __importDefault(require("../models/LoyaltyTransaction"));
const RefreshToken_1 = __importDefault(require("../models/RefreshToken"));
const Order_1 = __importDefault(require("../models/Order"));
const Payment_1 = __importDefault(require("../models/Payment"));
const AdminConfig_1 = __importDefault(require("../models/AdminConfig"));
const Recipe_1 = __importDefault(require("../models/Recipe"));
const SeasonalBanner_1 = __importDefault(require("../models/SeasonalBanner"));
const Coupon_1 = __importDefault(require("../models/Coupon"));
const response_1 = require("../utils/response");
const joi_1 = __importDefault(require("joi"));
// ============================================================
// VALIDATION SCHEMAS
// ============================================================
const updateUserRoleSchema = joi_1.default.object({
    role: joi_1.default.string().valid('customer', 'admin').required(),
});
const abandonmentConfigSchema = joi_1.default.object({
    abandonWindowHours: joi_1.default.number().integer().min(1).max(24).required(),
    abandonmentCouponCode: joi_1.default.string().allow(null, '').optional(),
});
/**
 * Get dashboard statistics (Admin)
 */
const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User_1.default.countDocuments({ role: 'customer' });
        const totalOrders = await Order_1.default.countDocuments();
        const totalRevenue = await Order_1.default.aggregate([
            { $match: { orderstatus: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);
        const revenueValue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
        const ordersByStatus = await Order_1.default.aggregate([
            { $group: { _id: '$orderstatus', count: { $sum: 1 } } },
        ]);
        res.status(200).json(new response_1.ApiResponse(true, 'Dashboard stats fetched', {
            totalUsers,
            totalOrders,
            totalRevenue: revenueValue,
            ordersByStatus: ordersByStatus.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch stats', null, 500));
    }
};
exports.getDashboardStats = getDashboardStats;
/**
 * Get all users (Admin)
 */
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const users = await User_1.default.find()
            .skip(skip)
            .limit(parseInt(limit))
            .select('-password')
            .sort({ createdAt: -1 });
        const total = await User_1.default.countDocuments();
        res.status(200).json(new response_1.ApiResponse(true, 'Users fetched', {
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch users', null, 500));
    }
};
exports.getAllUsers = getAllUsers;
/**
 * Get revenue analytics (Admin)
 */
const getRevenueAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let matchFilter = { orderstatus: { $ne: 'cancelled' } };
        if (startDate || endDate) {
            if (startDate && endDate && startDate > endDate) {
                return res.status(400).json(new response_1.ApiResponse(false, 'startDate cannot be after endDate', null, 400));
            }
            const dateFilter = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setUTCHours(0, 0, 0, 0);
                dateFilter.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                dateFilter.$lte = end;
            }
            matchFilter.createdAt = dateFilter;
        }
        else {
            // Fallback to last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
            matchFilter.createdAt = { $gte: thirtyDaysAgo };
        }
        const dailyRevenue = await Order_1.default.aggregate([
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
        return res.status(200).json(new response_1.ApiResponse(true, 'Revenue analytics fetched', dailyRevenue));
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch analytics', null, 500));
    }
};
exports.getRevenueAnalytics = getRevenueAnalytics;
/**
 * Get payment summary (Admin)
 */
const getPaymentSummary = async (req, res) => {
    try {
        const paymentSummary = await Payment_1.default.aggregate([
            {
                $group: {
                    _id: '$method',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);
        // Transform raw aggregate array into structured shape
        const totalPayments = paymentSummary.reduce((sum, item) => sum + item.count, 0);
        const razorpayEntry = paymentSummary.find((item) => item._id === 'razorpay');
        const codEntry = paymentSummary.find((item) => item._id === 'cod');
        const structured = {
            totalPayments,
            razorpayPayments: razorpayEntry?.count || 0,
            codPayments: codEntry?.count || 0,
            paymentMethods: paymentSummary,
        };
        res.status(200).json(new response_1.ApiResponse(true, 'Payment summary fetched', structured));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch payment summary', null, 500));
    }
};
exports.getPaymentSummary = getPaymentSummary;
/**
 * Update user role (Admin)
 */
const updateUserRole = async (req, res) => {
    try {
        const { error, value } = updateUserRoleSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }
        const { role } = value;
        const user = await User_1.default.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json(new response_1.ApiResponse(false, 'User not found', null, 404));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'User role updated', user));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to update user role', null, 500));
    }
};
exports.updateUserRole = updateUserRole;
/**
 * Delete user (Admin)
 */
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User_1.default.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json(new response_1.ApiResponse(false, 'User not found', null, 404));
        }
        // Cascade delete associated user data (Phase 2, Req 9.1, 9.2, 9.3)
        const settlements = await Promise.allSettled([
            Cart_1.default.deleteOne({ userId }),
            Wishlist_1.default.deleteOne({ userId }),
            Address_1.default.deleteMany({ userId }),
            LoyaltyAccount_1.default.deleteOne({ userId }),
            LoyaltyTransaction_1.default.deleteMany({ userId }),
            RefreshToken_1.default.deleteMany({ userId }),
        ]);
        // Log any rejected settlements
        settlements.forEach((result, idx) => {
            if (result.status === 'rejected') {
                console.error(`[deleteUser cascade] Task ${idx} failed:`, result.reason);
            }
        });
        return res.status(200).json(new response_1.ApiResponse(true, 'User deleted successfully'));
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to delete user', null, 500));
    }
};
exports.deleteUser = deleteUser;
/**
 * GET /api/admin/abandonment-config (Admin)
 * Returns the current cart abandonment configuration.
 * Requirements: 14.5
 */
const getAbandonmentConfig = async (req, res) => {
    try {
        const [windowDoc, couponDoc] = await Promise.all([
            AdminConfig_1.default.findOne({ key: 'abandonmentWindowHours' }),
            AdminConfig_1.default.findOne({ key: 'abandonmentCouponCode' }),
        ]);
        return res.status(200).json(new response_1.ApiResponse(true, 'Abandonment config fetched', {
            abandonWindowHours: windowDoc && typeof windowDoc.value === 'number' ? windowDoc.value : 2,
            abandonmentCouponCode: couponDoc && typeof couponDoc.value === 'string' && couponDoc.value.trim()
                ? couponDoc.value.trim()
                : null,
        }));
    }
    catch (error) {
        return res
            .status(500)
            .json(new response_1.ApiResponse(false, error.message || 'Failed to fetch abandonment config', null, 500));
    }
};
exports.getAbandonmentConfig = getAbandonmentConfig;
/**
 * PUT /api/admin/abandonment-config (Admin)
 * Updates the cart abandonment window and optional coupon code.
 * Requirements: 14.5
 */
const updateAbandonmentConfig = async (req, res) => {
    try {
        const { error, value } = abandonmentConfigSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            return res
                .status(400)
                .json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const { abandonWindowHours, abandonmentCouponCode } = value;
        await Promise.all([
            AdminConfig_1.default.findOneAndUpdate({ key: 'abandonmentWindowHours' }, { value: abandonWindowHours }, { upsert: true, new: true }),
            AdminConfig_1.default.findOneAndUpdate({ key: 'abandonmentCouponCode' }, { value: abandonmentCouponCode ?? null }, { upsert: true, new: true }),
        ]);
        return res.status(200).json(new response_1.ApiResponse(true, 'Abandonment config updated', {
            abandonWindowHours,
            abandonmentCouponCode: abandonmentCouponCode ?? null,
        }));
    }
    catch (error) {
        return res
            .status(500)
            .json(new response_1.ApiResponse(false, error.message || 'Failed to update abandonment config', null, 500));
    }
};
exports.updateAbandonmentConfig = updateAbandonmentConfig;
// ============================================================
// RECIPE HANDLERS (Requirements: 9.2, 9.3, 16.3)
// ============================================================
const recipeSchema = joi_1.default.object({
    title: joi_1.default.string().trim().required(),
    description: joi_1.default.string().trim().required(),
    ingredients: joi_1.default.array().items(joi_1.default.string()).default([]),
    steps: joi_1.default.array().items(joi_1.default.string()).default([]),
    productTags: joi_1.default.array().items(joi_1.default.string()).default([]),
    region: joi_1.default.string()
        .valid('North Indian', 'South Indian', 'Bengali', 'Rajasthani', 'Other')
        .required(),
    image: joi_1.default.string().uri().allow('', null).optional(),
});
/**
 * GET /api/admin/recipes (public)
 * Returns paginated recipes, optionally filtered by tag and/or region.
 */
const getRecipes = async (req, res) => {
    try {
        const { tag, region, page = 1 } = req.query;
        const limit = 10;
        const skip = (parseInt(page, 10) - 1) * limit;
        const filter = {};
        if (tag)
            filter.productTags = tag;
        if (region)
            filter.region = region;
        const [recipes, total] = await Promise.all([
            Recipe_1.default.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
            Recipe_1.default.countDocuments(filter),
        ]);
        return res.status(200).json(new response_1.ApiResponse(true, 'Recipes fetched', {
            recipes,
            pagination: {
                total,
                page: parseInt(page, 10),
                limit,
                pages: Math.ceil(total / limit),
            },
        }));
    }
    catch (error) {
        return res
            .status(500)
            .json(new response_1.ApiResponse(false, error.message || 'Failed to fetch recipes', null, 500));
    }
};
exports.getRecipes = getRecipes;
/**
 * POST /api/admin/recipes (admin-only)
 */
const createRecipe = async (req, res) => {
    try {
        const { error, value } = recipeSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            return res
                .status(400)
                .json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const recipe = await Recipe_1.default.create(value);
        return res.status(201).json(new response_1.ApiResponse(true, 'Recipe created', recipe));
    }
    catch (error) {
        return res
            .status(500)
            .json(new response_1.ApiResponse(false, error.message || 'Failed to create recipe', null, 500));
    }
};
exports.createRecipe = createRecipe;
/**
 * PUT /api/admin/recipes/:id (admin-only)
 */
const updateRecipe = async (req, res) => {
    try {
        const { error, value } = recipeSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            return res
                .status(400)
                .json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const recipe = await Recipe_1.default.findByIdAndUpdate(req.params.id, value, { new: true });
        if (!recipe) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Recipe not found', null, 404));
        }
        return res.status(200).json(new response_1.ApiResponse(true, 'Recipe updated', recipe));
    }
    catch (error) {
        return res
            .status(500)
            .json(new response_1.ApiResponse(false, error.message || 'Failed to update recipe', null, 500));
    }
};
exports.updateRecipe = updateRecipe;
/**
 * DELETE /api/admin/recipes/:id (admin-only)
 */
const deleteRecipe = async (req, res) => {
    try {
        const recipe = await Recipe_1.default.findByIdAndDelete(req.params.id);
        if (!recipe) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Recipe not found', null, 404));
        }
        return res.status(200).json(new response_1.ApiResponse(true, 'Recipe deleted'));
    }
    catch (error) {
        return res
            .status(500)
            .json(new response_1.ApiResponse(false, error.message || 'Failed to delete recipe', null, 500));
    }
};
exports.deleteRecipe = deleteRecipe;
// ============================================================
// SEASONAL BANNER HANDLERS (Requirements: 9.4, 9.5, 17.1)
// ============================================================
const bannerSchema = joi_1.default.object({
    image: joi_1.default.string().trim().required(),
    title: joi_1.default.string().trim().required(),
    subtitle: joi_1.default.string().trim().allow('', null).optional(),
    ctaLink: joi_1.default.string().trim().required(),
    ctaText: joi_1.default.string().trim().required(),
    activeFrom: joi_1.default.date().required(),
    activeTo: joi_1.default.date().required(),
});
/**
 * GET /api/admin/banners (public)
 * Returns all seasonal banners; client filters by activeFrom/activeTo.
 */
const getSeasonalBanners = async (req, res) => {
    try {
        const activeOnly = req.query.activeOnly === 'true';
        let filter = {};
        if (activeOnly) {
            const now = new Date();
            filter = {
                activeFrom: { $lte: now },
                activeTo: { $gte: now },
            };
        }
        const banners = await SeasonalBanner_1.default.find(filter).sort({ activeFrom: 1 }).lean();
        return res.status(200).json(new response_1.ApiResponse(true, 'Banners fetched', banners));
    }
    catch (error) {
        return res
            .status(500)
            .json(new response_1.ApiResponse(false, error.message || 'Failed to fetch banners', null, 500));
    }
};
exports.getSeasonalBanners = getSeasonalBanners;
/**
 * POST /api/admin/banners (admin-only)
 */
const createBanner = async (req, res) => {
    try {
        const { error, value } = bannerSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            return res
                .status(400)
                .json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const banner = await SeasonalBanner_1.default.create(value);
        return res.status(201).json(new response_1.ApiResponse(true, 'Banner created', banner));
    }
    catch (error) {
        return res
            .status(500)
            .json(new response_1.ApiResponse(false, error.message || 'Failed to create banner', null, 500));
    }
};
exports.createBanner = createBanner;
/**
 * PUT /api/admin/banners/:id (admin-only)
 */
const updateBanner = async (req, res) => {
    try {
        const { error, value } = bannerSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            return res
                .status(400)
                .json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const banner = await SeasonalBanner_1.default.findByIdAndUpdate(req.params.id, value, { new: true });
        if (!banner) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Banner not found', null, 404));
        }
        return res.status(200).json(new response_1.ApiResponse(true, 'Banner updated', banner));
    }
    catch (error) {
        return res
            .status(500)
            .json(new response_1.ApiResponse(false, error.message || 'Failed to update banner', null, 500));
    }
};
exports.updateBanner = updateBanner;
/**
 * DELETE /api/admin/banners/:id (admin-only)
 */
const deleteBanner = async (req, res) => {
    try {
        const banner = await SeasonalBanner_1.default.findByIdAndDelete(req.params.id);
        if (!banner) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Banner not found', null, 404));
        }
        return res.status(200).json(new response_1.ApiResponse(true, 'Banner deleted'));
    }
    catch (error) {
        return res
            .status(500)
            .json(new response_1.ApiResponse(false, error.message || 'Failed to delete banner', null, 500));
    }
};
exports.deleteBanner = deleteBanner;
/**
 * GET /api/admin/products/low-stock (Admin)
 * Phase 3, Req 11.3
 */
const getLowStockProducts = async (req, res) => {
    try {
        const threshold = parseInt(req.query.threshold) || 10;
        const products = await Product_1.default.find({ stock: { $lt: threshold } })
            .select('name stock price image')
            .sort({ stock: 1 })
            .lean();
        return res.status(200).json(new response_1.ApiResponse(true, 'Low stock products fetched', products));
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch low stock products', null, 500));
    }
};
exports.getLowStockProducts = getLowStockProducts;
/**
 * GET /api/admin/coupons/analytics (Admin)
 * Phase 3, Req 12.2
 */
const getCouponAnalytics = async (req, res) => {
    try {
        const coupons = await Coupon_1.default.find().lean();
        const orderSums = await Order_1.default.aggregate([
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
        return res.status(200).json(new response_1.ApiResponse(true, 'Coupon analytics fetched', analytics));
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch coupon analytics', null, 500));
    }
};
exports.getCouponAnalytics = getCouponAnalytics;
/**
 * GET /api/admin/products/top-selling (Admin)
 * Phase 3, Req 14.3
 */
const getTopSellingProducts = async (req, res) => {
    try {
        const limit = Math.min(20, parseInt(req.query.limit) || 5);
        const products = await Product_1.default.find({ sold: { $gt: 0 } })
            .select('name sold price image')
            .sort({ sold: -1 })
            .limit(limit)
            .lean();
        return res.status(200).json(new response_1.ApiResponse(true, 'Top selling products fetched', products));
    }
    catch (error) {
        return res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch top selling products', null, 500));
    }
};
exports.getTopSellingProducts = getTopSellingProducts;
//# sourceMappingURL=adminController.js.map