import mongoose, { Schema } from 'mongoose';

export interface ICoupon {
    _id: mongoose.Types.ObjectId;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderAmount: number;
    maxDiscount: number;
    email: string;
    userId?: mongoose.Types.ObjectId;
    isUsed: boolean;
    usedAt?: Date;
    usedOrderId?: mongoose.Types.ObjectId;
    expiresAt: Date;
    source: 'newsletter' | 'admin' | 'promotion';
    maxUses: number;
    usageCount: number;              // Req 12.2 — tracks cumulative redemptions
    categoryRestrictions?: string[]; // Req 12.3 — category ObjectId strings
    createdAt: Date;
    updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true,
        },
        discountType: {
            type: String,
            enum: ['percentage', 'fixed'],
            default: 'percentage',
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0,
        },
        minOrderAmount: {
            type: Number,
            default: 0,
        },
        maxDiscount: {
            type: Number,
            default: 0, // 0 = no cap
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        isUsed: {
            type: Boolean,
            default: false,
        },
        usedAt: Date,
        usedOrderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        source: {
            type: String,
            enum: ['newsletter', 'admin', 'promotion'],
            default: 'newsletter',
        },
        maxUses: {
            type: Number,
            default: 0, // 0 = unlimited
            min: 0,
        },
        usageCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        categoryRestrictions: {
            type: [String],
        },
    },
    { timestamps: true }
);

// Indexes
couponSchema.index({ email: 1, source: 1 });
couponSchema.index({ expiresAt: 1 });

export default mongoose.model<ICoupon>('Coupon', couponSchema);
