"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Review_1 = __importDefault(require("../models/Review"));
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
const reviewSchema = joi_1.default.object({
    name: joi_1.default.string().required().trim().max(100),
    rating: joi_1.default.number().required().min(1).max(5),
    comment: joi_1.default.string().required().trim().max(1000),
    productId: joi_1.default.string().optional(),
    email: joi_1.default.string().email().optional(),
});
// Submit a review (public, optionally authenticated)
router.post('/submit', async (req, res) => {
    try {
        const { error, value } = reviewSchema.validate(req.body);
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const review = await Review_1.default.create({
            ...value,
            isApproved: false,
            isFeatured: false,
        });
        res.status(201).json(new response_1.ApiResponse(true, 'Thank you for your feedback! Your review will be visible after approval.', review));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to submit review', null, 500));
    }
});
// Get approved reviews (public)
router.get('/approved', async (req, res) => {
    try {
        const { limit = 10, productId } = req.query;
        const query = { isApproved: true };
        if (productId)
            query.productId = productId;
        const reviews = await Review_1.default.find(query)
            .sort({ isFeatured: -1, createdAt: -1 })
            .limit(parseInt(limit));
        res.status(200).json(new response_1.ApiResponse(true, 'Reviews fetched', reviews));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch reviews', null, 500));
    }
});
// Get featured reviews for landing page (public)
router.get('/featured', async (req, res) => {
    try {
        const reviews = await Review_1.default.find({ isApproved: true, isFeatured: true })
            .sort({ createdAt: -1 })
            .limit(6);
        res.status(200).json(new response_1.ApiResponse(true, 'Featured reviews fetched', reviews));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch featured reviews', null, 500));
    }
});
router.get('/admin/all', auth_1.verifyToken, auth_1.verifyAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const query = {};
        if (status === 'approved')
            query.isApproved = true;
        if (status === 'pending')
            query.isApproved = false;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const reviews = await Review_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        const total = await Review_1.default.countDocuments(query);
        res.status(200).json(new response_1.ApiResponse(true, 'Reviews fetched', {
            reviews,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
        }));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch reviews', null, 500));
    }
});
// Admin: Approve/reject review
router.put('/admin/:id/approve', auth_1.verifyToken, auth_1.verifyAdmin, async (req, res) => {
    try {
        const { isApproved, isFeatured } = req.body;
        const review = await Review_1.default.findByIdAndUpdate(req.params.id, { isApproved, isFeatured: isFeatured || false }, { new: true });
        if (!review) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Review not found', null, 404));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'Review updated', review));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to update review', null, 500));
    }
});
router.delete('/admin/:id', auth_1.verifyToken, auth_1.verifyAdmin, async (req, res) => {
    try {
        const review = await Review_1.default.findByIdAndDelete(req.params.id);
        if (!review) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Review not found', null, 404));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'Review deleted'));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to delete review', null, 500));
    }
});
exports.default = router;
//# sourceMappingURL=reviewRoutes.js.map