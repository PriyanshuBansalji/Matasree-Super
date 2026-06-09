const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'matasree-backend/.env') });

const couponSchema = new mongoose.Schema({
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
        default: 0,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    isUsed: {
        type: Boolean,
        default: false,
    },
    usedAt: Date,
    usedOrderId: {
        type: mongoose.Schema.Types.ObjectId,
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
}, { timestamps: true });

const Coupon = mongoose.model('Coupon', couponSchema);

const createTestCoupon = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/matasree');
        console.log('Connected to MongoDB');

        // Create test coupon
        const testCoupon = await Coupon.create({
            code: 'SAVE10',
            email: 'test@example.com',
            discountType: 'percentage',
            discountValue: 10,
            minOrderAmount: 100,
            maxDiscount: 200,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            source: 'admin',
            isUsed: false,
        });

        console.log('✅ Test coupon created:', testCoupon);
        console.log('Use code: SAVE10 for 10% off on orders above ₹100');

        // Create another test coupon
        const testCoupon2 = await Coupon.create({
            code: 'WELCOME20',
            email: 'test@example.com',
            discountType: 'fixed',
            discountValue: 50,
            minOrderAmount: 200,
            maxDiscount: 0,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            source: 'admin',
            isUsed: false,
        });

        console.log('✅ Test coupon 2 created:', testCoupon2);
        console.log('Use code: WELCOME20 for ₹50 off on orders above ₹200');

        await mongoose.connection.close();
        console.log('\n✅ Connected closed. Test coupons are ready to use!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

createTestCoupon();
