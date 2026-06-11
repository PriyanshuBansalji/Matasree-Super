import { Router, Response } from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review';
import Order from '../models/Order';
import Product from '../models/Product';
import { ApiResponse } from '../utils/response';
import { verifyToken, verifyAdmin, AuthenticatedRequest } from '../middleware/auth';
import { sendEmail } from '../utils/email';
import Joi from 'joi';

const router = Router();

const reviewSchema = Joi.object({
    name: Joi.string().required().trim().max(100),
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required().trim().max(1000),
    productId: Joi.string().required(),
    email: Joi.string().email().optional(),
});

// Submit a review (requires authentication + must have purchased the product)
router.post('/submit', verifyToken, async (req: any, res: Response) => {
    try {
        const { error, value } = reviewSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
        }

        const authReq = req as AuthenticatedRequest;
        const userId = authReq.user!.userId;
        const { productId, name, rating, comment } = value;

        // Check that user has at least one paid order containing this product
        const purchaseExists = await Order.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            'items.productId': new mongoose.Types.ObjectId(productId),
            paymentStatus: 'paid',
        });

        if (!purchaseExists) {
            return res.status(403).json(new ApiResponse(false, 'You must purchase this product before reviewing it.', null, 403));
        }

        // Prevent duplicate reviews
        const existingReview = await Review.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            productId: new mongoose.Types.ObjectId(productId),
        });

        if (existingReview) {
            return res.status(409).json(new ApiResponse(false, 'You have already reviewed this product.', null, 409));
        }

        const review = await Review.create({
            ...value,
            userId: new mongoose.Types.ObjectId(userId),
            productId: new mongoose.Types.ObjectId(productId),
            isApproved: false,
            isFeatured: false,
        });

        // Send admin email notification (fire-and-forget; skip if ADMIN_EMAIL not set)
        if (process.env.ADMIN_EMAIL) {
            const commentSnippet = comment.length > 100 ? comment.substring(0, 100) + '...' : comment;
            sendEmail({
                email: process.env.ADMIN_EMAIL,
                subject: 'New Review Pending Approval',
                html: `
                    <h2>New Review Pending Approval</h2>
                    <p><strong>Product ID:</strong> ${productId}</p>
                    <p><strong>Reviewer:</strong> ${name}</p>
                    <p><strong>Rating:</strong> ${rating}/5</p>
                    <p><strong>Comment:</strong> ${commentSnippet}</p>
                    <p>Please log in to the admin panel to approve or reject this review.</p>
                `,
            }).catch(() => {
                // Silent failure — do not block the response
            });
        }

        res.status(201).json(new ApiResponse(true, 'Thank you for your feedback! Your review will be visible after approval.', review));
    } catch (err: any) {
        // Handle MongoDB duplicate key error (race condition fallback)
        if (err.code === 11000) {
            return res.status(409).json(new ApiResponse(false, 'You have already reviewed this product.', null, 409));
        }
        res.status(500).json(new ApiResponse(false, err.message || 'Failed to submit review', null, 500));
    }
});

// Get approved reviews (public)
router.get('/approved', async (req: any, res: Response) => {
    try {
        const { limit = 10, productId } = req.query;
        const query: any = { isApproved: true };
        if (productId) query.productId = productId;

        const reviews = await Review.find(query)
            .sort({ isFeatured: -1, createdAt: -1 })
            .limit(parseInt(limit));

        res.status(200).json(new ApiResponse(true, 'Reviews fetched', reviews));
    } catch (error: any) {
        res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch reviews', null, 500));
    }
});

// Get featured reviews for landing page (public)
router.get('/featured', async (req: any, res: Response) => {
    try {
        const reviews = await Review.find({ isApproved: true, isFeatured: true })
            .sort({ createdAt: -1 })
            .limit(6);

        res.status(200).json(new ApiResponse(true, 'Featured reviews fetched', reviews));
    } catch (error: any) {
        res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch featured reviews', null, 500));
    }
});

router.get('/admin/all', verifyToken, verifyAdmin, async (req: any, res: Response) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const query: any = {};
        if (status === 'approved') query.isApproved = true;
        if (status === 'pending') query.isApproved = false;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const reviews = await Review.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit as string));

        const total = await Review.countDocuments(query);

        res.status(200).json(new ApiResponse(true, 'Reviews fetched', {
            reviews,
            pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string), pages: Math.ceil(total / parseInt(limit as string)) },
        }));
    } catch (error: any) {
        res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch reviews', null, 500));
    }
});

// Admin: Approve/reject review — recomputes product rating when approved
router.put('/admin/:id/approve', verifyToken, verifyAdmin, async (req: any, res: Response) => {
    try {
        const { isApproved, isFeatured } = req.body;
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { isApproved, isFeatured: isFeatured || false },
            { new: true }
        );

        if (!review) {
            return res.status(404).json(new ApiResponse(false, 'Review not found', null, 404));
        }

        // When a review is approved, recompute the product's rating and review count
        if (isApproved === true && review.productId) {
            const approvedReviews = await Review.find({ productId: review.productId, isApproved: true });
            const count = approvedReviews.length;
            const mean = count > 0
                ? Math.round((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
                : 0;

            await Product.findByIdAndUpdate(review.productId, {
                rating: mean,
                reviews: count,
            });
        }

        res.status(200).json(new ApiResponse(true, 'Review updated', review));
    } catch (error: any) {
        res.status(500).json(new ApiResponse(false, error.message || 'Failed to update review', null, 500));
    }
});

router.delete('/admin/:id', verifyToken, verifyAdmin, async (req: any, res: Response) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) {
            return res.status(404).json(new ApiResponse(false, 'Review not found', null, 404));
        }
        res.status(200).json(new ApiResponse(true, 'Review deleted'));
    } catch (error: any) {
        res.status(500).json(new ApiResponse(false, error.message || 'Failed to delete review', null, 500));
    }
});

export default router;
