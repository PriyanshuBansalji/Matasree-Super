"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentSummary = exports.getRevenueAnalytics = exports.getAllUsers = exports.getDashboardStats = void 0;
const User_1 = __importDefault(require("../models/User"));
const Order_1 = __importDefault(require("../models/Order"));
const Payment_1 = __importDefault(require("../models/Payment"));
const response_1 = require("../utils/response");
/**
 * Get dashboard statistics (Admin)
 */
const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User_1.default.countDocuments({ role: 'customer' });
        const totalOrders = await Order_1.default.countDocuments();
        const totalRevenue = await Order_1.default.aggregate([
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
        const dailyRevenue = await Order_1.default.aggregate([
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
        res.status(200).json(new response_1.ApiResponse(true, 'Revenue analytics fetched', dailyRevenue));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch analytics', null, 500));
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
        res.status(200).json(new response_1.ApiResponse(true, 'Payment summary fetched', paymentSummary));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch payment summary', null, 500));
    }
};
exports.getPaymentSummary = getPaymentSummary;
//# sourceMappingURL=adminController.js.map