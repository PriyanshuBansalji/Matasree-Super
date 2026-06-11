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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Safely ensures indexes on all models after the connection is established.
 * Failures are logged per collection/index but do NOT crash the server.
 */
const ensureIndexes = async () => {
    // Import models so their schemas (and .index() calls) are registered
    const modelEntries = [];
    try {
        const { default: Order } = await Promise.resolve().then(() => __importStar(require('../models/Order')));
        modelEntries.push({ name: 'Order', model: Order });
    }
    catch (err) {
        console.error('[DB] Failed to load Order model for index creation:', err);
    }
    try {
        const { default: Address } = await Promise.resolve().then(() => __importStar(require('../models/Address')));
        modelEntries.push({ name: 'Address', model: Address });
    }
    catch (err) {
        console.error('[DB] Failed to load Address model for index creation:', err);
    }
    try {
        const { default: Payment } = await Promise.resolve().then(() => __importStar(require('../models/Payment')));
        modelEntries.push({ name: 'Payment', model: Payment });
    }
    catch (err) {
        console.error('[DB] Failed to load Payment model for index creation:', err);
    }
    for (const { name, model } of modelEntries) {
        try {
            await model.createIndexes();
            console.log(`[DB] Indexes ensured for collection: ${name}`);
        }
        catch (err) {
            // Log the failure with collection context but do not rethrow — the server keeps running.
            console.error(`[DB] Index creation failed for collection "${name}" (non-fatal):`, err?.message ?? err);
        }
    }
};
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        await mongoose_1.default.connect(mongoUri);
        console.log('MongoDB Connected Successfully');
        // Ensure indexes after connection; failures are isolated and non-fatal.
        await ensureIndexes();
    }
    catch (error) {
        console.error('MongoDB Connection Failed:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        await mongoose_1.default.disconnect();
        console.log('MongoDB Disconnected');
    }
    catch (error) {
        console.error('Error disconnecting MongoDB:', error);
    }
};
exports.disconnectDB = disconnectDB;
//# sourceMappingURL=database.js.map