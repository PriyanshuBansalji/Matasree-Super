import { Router, Response } from 'express';
import Review from '../models/Review';
import { ApiResponse } from '../utils/response';
import { verifyToken, verifyAdmin, AuthenticatedRequest } from '../middleware/auth';
import Joi from 'joi';

const router = Router();

const reviewSchema = Joi.object({
    name: Joi.string().required().trim().max(100),
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required().trim().max(1000),
    productId: Joi.string().optional(),
    email: Joi.string().email().optional(),
});

// Submit a review (public, optionally authenticated)
router.post('/submit', async (req: any, res: Response) => {
    try {
        const { error, value } = reviewSchema.validate(req.body);
        if (error) {
            return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
        }

        const review = await Review.create({
            ...value,
            isApproved: false,
            isFeatured: false,
        });

        res.status(201).json(new ApiResponse(true, 'Thank you for your feedback! Your review will be visible after approval.', review));
    } catch (error: any) {
        res.status(500).json(new ApiResponse(false, error.message || 'Failed to submit review', null, 500));
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

// Admin: Approve/reject review
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

