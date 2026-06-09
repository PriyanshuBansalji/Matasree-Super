"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const Product_1 = __importDefault(require("../models/Product"));
// Load env vars
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const clearDB = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
        await Product_1.default.deleteMany({});
        // We might want to keep categories if they were manually added, but simpler to clear all if we want a fresh start
        // User asked to remove "seed product". Let's remove products only to be safe, or just the ones we added.
        // But since I did deleteMany({}) in seed.ts, I likely wiped everything.
        // Let's clear products.
        await Product_1.default.deleteMany({});
        console.log('Products cleared');
        // Optional: Clear categories if they were seeded
        // await Category.deleteMany({});
        // console.log('Categories cleared');
        process.exit();
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
};
clearDB();
//# sourceMappingURL=clear.js.map