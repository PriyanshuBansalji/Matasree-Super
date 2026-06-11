import mongoose, { Schema } from 'mongoose';

export interface IAdminConfig {
  _id: mongoose.Types.ObjectId;
  key: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
}

const adminConfigSchema = new Schema<IAdminConfig>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IAdminConfig>('AdminConfig', adminConfigSchema);
