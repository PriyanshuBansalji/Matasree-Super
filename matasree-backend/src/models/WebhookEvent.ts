import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookEvent extends Document {
  eventId: string;
  eventType: string;
  processedAt: Date;
  payload?: any;
}

const WebhookEventSchema: Schema = new Schema({
  eventId: { type: String, required: true, unique: true, index: true },
  eventType: { type: String, required: true },
  processedAt: { type: Date, default: Date.now },
  payload: { type: Schema.Types.Mixed },
});

export default mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);
