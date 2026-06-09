"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const Coupon_1 = __importDefault(require("../models/Coupon"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '.env') });
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};
const createTestCoupons = async () => {
    try {
        await connectDB();
        // Create test coupon 1: 10% off
        const coupon1 = await Coupon_1.default.create({
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
        const coupon2 = await Coupon_1.default.create({
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
        await mongoose_1.default.connection.close();
        console.log('\n✅ Database connection closed');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};
createTestCoupons();
//# sourceMappingURL=create-test-coupons.js.map