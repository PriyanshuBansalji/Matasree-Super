import { Response } from 'express';
import User from '../models/User';
import Order from '../models/Order';
import Payment from '../models/Payment';
import { ApiResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

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

    res.status(200).json(new ApiResponse(true, 'Payment summary fetched', paymentSummary));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch payment summary', null, 500));
  }
};
