"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Coupon_1 = __importDefault(require("../models/Coupon"));
const createEmailCoupon = async () => {
    try {
        await mongoose_1.default.connect('mongodb://localhost:27017/matasree');
        // Find all MS10 coupons
        const coupons = await Coupon_1.default.find({ code: { $regex: '^MS10' } }).select('code email createdAt isUsed');
        console.log('📊 Existing MS10 coupons:');
        if (coupons.length === 0) {
            console.log('   None found');
        }
        else {
            coupons.forEach(c => console.log('   • ' + c.code + ' | ' + c.email + ' | Used: ' + c.isUsed));
        }
        // Delete if exists
        await Coupon_1.default.deleteOne({ code: 'MS10QMQBUB56' });
        // Create the coupon from the email
        const newCoupon = await Coupon_1.default.create({
            code: 'MS10QMQBUB56',
            email: 'user@example.com',
            discountType: 'percentage',
            discountValue: 10,
            minOrderAmount: 199,
            maxDiscount: 200,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            source: 'newsletter',
            isUsed: false,
        });
        console.log('\n✅ Created your newsletter coupon:');
        console.log('   Code: ' + newCoupon.code);
        console.log('   Discount: 10% off (max ₹200)');
        console.log('   Min order: ₹199');
        console.log('   Expires: ' + newCoupon.expiresAt.toDateString());
        await mongoose_1.default.connection.close();
        process.exit(0);
    }
    catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
};
createEmailCoupon();
//# sourceMappingURL=create-email-coupon.js.map