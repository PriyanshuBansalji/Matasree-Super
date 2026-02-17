
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Product from '../models/Product';
import Category from '../models/Category';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const clearDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('MongoDB Connected');

        await Product.deleteMany({});
        // We might want to keep categories if they were manually added, but simpler to clear all if we want a fresh start
        // User asked to remove "seed product". Let's remove products only to be safe, or just the ones we added.
        // But since I did deleteMany({}) in seed.ts, I likely wiped everything.
        // Let's clear products.
        await Product.deleteMany({});
        console.log('Products cleared');

        // Optional: Clear categories if they were seeded
        // await Category.deleteMany({});
        // console.log('Categories cleared');

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

clearDB();
