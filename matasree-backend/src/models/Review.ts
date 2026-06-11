import mongoose, { Schema } from 'mongoose';

export interface IReview {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    productId?: mongoose.Types.ObjectId;
    name: string;
    email?: string;
    rating: number;
    comment: string;
    isApproved: boolean;
    isFeatured: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            trim: true,
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: [true, 'Comment is required'],
            trim: true,
            maxlength: 1000,
        },
        isApproved: {
            type: Boolean,
            default: false,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

reviewSchema.index({ productId: 1 });
reviewSchema.index({ isApproved: 1, isFeatured: 1 });
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true, background: true });

export default mongoose.model<IReview>('Review', reviewSchema);
