"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * LoyaltyTransaction Model
 * Immutable ledger of every loyalty point change for a user.
 * Positive delta = earn; negative delta = redeem or reversal.
 */
const mongoose_1 = __importStar(require("mongoose"));
const loyaltyTransactionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    orderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Order',
    },
    delta: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        enum: ['order_earn', 'order_cancel', 'referral_bonus', 'redemption'],
        required: true,
    },
    balanceAfter: {
        type: Number,
        required: true,
        min: 0,
    },
}, {
    // No updatedAt — transactions are immutable
    timestamps: { createdAt: true, updatedAt: false },
});
// Primary query: user's transaction history ordered newest-first
loyaltyTransactionSchema.index({ userId: 1, createdAt: -1 }, { background: true });
// Support lookup by order (e.g., to reverse points on cancellation)
loyaltyTransactionSchema.index({ orderId: 1 }, { background: true });
exports.default = mongoose_1.default.model('LoyaltyTransaction', loyaltyTransactionSchema);
//# sourceMappingURL=LoyaltyTransaction.js.map