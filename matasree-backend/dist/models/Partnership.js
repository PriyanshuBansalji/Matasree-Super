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
const mongoose_1 = __importStar(require("mongoose"));
const partnershipSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
    },
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    businessName: {
        type: String,
        required: [true, 'Business name is required'],
        trim: true,
    },
    businessType: {
        type: String,
        enum: ['sole-proprietorship', 'partnership', 'pvt-ltd', 'llp', 'other'],
        required: [true, 'Business type is required'],
    },
    areaOfInterest: {
        type: String,
        required: [true, 'Area of interest is required'],
        trim: true,
    },
    cities: {
        type: [String],
        required: [true, 'At least one city must be selected'],
    },
    businessExperience: {
        type: Number,
        required: [true, 'Years of business experience is required'],
        min: 0,
    },
    bankAccountHolder: {
        type: String,
        required: [true, 'Bank account holder name is required'],
        trim: true,
    },
    bankAccountNumber: {
        type: String,
        required: [true, 'Bank account number is required'],
        trim: true,
    },
    ifscCode: {
        type: String,
        required: [true, 'IFSC code is required'],
        trim: true,
        uppercase: true,
    },
    gstNumber: {
        type: String,
        required: [true, 'GST number is required'],
        trim: true,
        uppercase: true,
    },
    businessRegistration: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
    },
    pincode: {
        type: String,
        required: [true, 'Pincode is required'],
        match: [/^[0-9]{6}$/, 'Please provide a valid 6-digit pincode'],
    },
    country: {
        type: String,
        default: 'India',
        trim: true,
    },
    additionalInfo: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'on-hold'],
        default: 'pending',
    },
    rejectionReason: {
        type: String,
        trim: true,
    },
}, { timestamps: true });
// Index for faster queries
partnershipSchema.index({ userId: 1 });
partnershipSchema.index({ email: 1 });
partnershipSchema.index({ status: 1 });
partnershipSchema.index({ createdAt: -1 });
exports.default = mongoose_1.default.model('Partnership', partnershipSchema);
//# sourceMappingURL=Partnership.js.map