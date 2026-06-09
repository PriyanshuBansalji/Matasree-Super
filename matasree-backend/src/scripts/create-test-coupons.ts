import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Coupon from '../models/Coupon';

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI as string);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const createTestCoupons = async () => {
    try {
        await connectDB();

        // Create test coupon 1: 10% off
        const coupon1 = await Coupon.create({
            code: 'SAVE10',
            email: 'test@example.com',
            discountType: 'percentage',
            discountValue: 10,
            minOrderAmount: 100,
            maxDiscount: 200,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
            source: 'admin',
            isUsed: false,
        });

        console.log('✅ Coupon 1 created:', coupon1.code);
        console.log('   | 10% discount on orders above ₹100 (max ₹200 off)');

        // Create test coupon 2: ₹50 fixed discount
        const coupon2 = await Coupon.create({
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

        console.log('✅ Coupon 2 created:', coupon2.code);
        console.log('   | ₹50 fixed discount on orders above ₹200');

        console.log('\n📋 Test coupon codes ready to use in checkout:');
        console.log('   → SAVE10 (10% off, min ₹100)');
        console.log('   → WELCOME20 (₹50 off, min ₹200)');

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

createTestCoupons();
