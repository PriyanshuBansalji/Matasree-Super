import mongoose, { Schema } from 'mongoose';

export interface IPartnership {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: 'sole-proprietorship' | 'partnership' | 'pvt-ltd' | 'llp' | 'other';
  areaOfInterest: string;
  cities: string[];
  businessExperience: number;
  bankAccountHolder: string;
  bankAccountNumber: string;
  ifscCode: string;
  gstNumber: string;
  businessRegistration: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  additionalInfo?: string;
  status: 'pending' | 'approved' | 'rejected' | 'on-hold';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const partnershipSchema = new Schema<IPartnership>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
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
  },
  { timestamps: true }
);

// Index for faster queries
partnershipSchema.index({ userId: 1 });
partnershipSchema.index({ email: 1 });
partnershipSchema.index({ status: 1 });
partnershipSchema.index({ createdAt: -1 });

export default mongoose.model<IPartnership>('Partnership', partnershipSchema);
