import mongoose, { Schema } from 'mongoose';

export interface IInventoryHistory {
  productId:     mongoose.Types.ObjectId;   // ref: 'Product'
  variantId:     mongoose.Types.ObjectId;   // embedded variant _id
  variantWeight: string;                    // denormalised for readability
  deltaQuantity: number;                    // positive = add, negative = remove
  previousStock: number;
  newStock:      number;
  reason:        string;                    // 'admin_adjustment' | 'order_placed' | 'order_cancelled' | 'import' | 'initial'
  performedBy:   mongoose.Types.ObjectId;   // ref: 'User' (admin userId)
  note?:         string;
  createdAt:     Date;
  updatedAt:     Date;
}

const inventoryHistorySchema = new Schema<IInventoryHistory>(
  {
    productId:     { type: Schema.Types.ObjectId, ref: 'Product',  required: true, index: true },
    variantId:     { type: Schema.Types.ObjectId, required: true },
    variantWeight: { type: String,  required: true },
    deltaQuantity: { type: Number,  required: true },
    previousStock: { type: Number,  required: true },
    newStock:      { type: Number,  required: true },
    reason:        { type: String,  required: true },
    performedBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    note:          { type: String },
  },
  { timestamps: true }
);

inventoryHistorySchema.index({ productId: 1, createdAt: -1 });

export { inventoryHistorySchema };
export default mongoose.model<IInventoryHistory>('InventoryHistory', inventoryHistorySchema);
