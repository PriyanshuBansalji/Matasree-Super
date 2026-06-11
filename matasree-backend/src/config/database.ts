import mongoose from 'mongoose';

/**
 * Safely ensures indexes on all models after the connection is established.
 * Failures are logged per collection/index but do NOT crash the server.
 */
const ensureIndexes = async () => {
  // Import models so their schemas (and .index() calls) are registered
  const modelEntries: Array<{ name: string; model: mongoose.Model<any> }> = [];

  try {
    const { default: Order } = await import('../models/Order');
    modelEntries.push({ name: 'Order', model: Order });
  } catch (err) {
    console.error('[DB] Failed to load Order model for index creation:', err);
  }

  try {
    const { default: Address } = await import('../models/Address');
    modelEntries.push({ name: 'Address', model: Address });
  } catch (err) {
    console.error('[DB] Failed to load Address model for index creation:', err);
  }

  try {
    const { default: Payment } = await import('../models/Payment');
    modelEntries.push({ name: 'Payment', model: Payment });
  } catch (err) {
    console.error('[DB] Failed to load Payment model for index creation:', err);
  }

  for (const { name, model } of modelEntries) {
    try {
      await model.createIndexes();
      console.log(`[DB] Indexes ensured for collection: ${name}`);
    } catch (err: any) {
      // Log the failure with collection context but do not rethrow — the server keeps running.
      console.error(
        `[DB] Index creation failed for collection "${name}" (non-fatal):`,
        err?.message ?? err
      );
    }
  }
};

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI as string;

    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected Successfully');

    // Ensure indexes after connection; failures are isolated and non-fatal.
    await ensureIndexes();
  } catch (error) {
    console.error('MongoDB Connection Failed:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
};
