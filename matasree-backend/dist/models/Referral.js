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
 * Referral Model
 * Records the relationship between a referrer (code owner) and a referee
 * (new user who signed up using the code).
 */
const mongoose_1 = __importStar(require("mongoose"));
const referralSchema = new mongoose_1.Schema({
    referrerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    refereeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    code: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['pending', 'rewarded'],
        default: 'pending',
    },
    rewardedAt: {
        type: Date,
    },
}, { timestamps: true });
// List all referrals made by a given referrer
referralSchema.index({ referrerId: 1 }, { background: true });
// A referee can only use one referral code — one entry per new user
referralSchema.index({ refereeId: 1 }, { unique: true, background: true });
// Look up referrals by code (e.g., during validation)
referralSchema.index({ code: 1 }, { background: true });
exports.default = mongoose_1.default.model('Referral', referralSchema);
//# sourceMappingURL=Referral.js.map