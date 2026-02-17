
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Category from '../models/Category';
import Product from '../models/Product';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI as string);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const categories = [
    { name: 'Whole Spices', slug: 'whole-spices', description: 'Premium whole spices' },
    { name: 'Ground Spices', slug: 'ground-spices', description: 'Finely ground spices' },
    { name: 'Blended Masalas', slug: 'blended-masalas', description: 'Unique blends for perfect taste' },
    { name: 'Herbs & Seasonings', slug: 'herbs-seasonings', description: 'Aromatic herbs' },
];

const products = [
    {
        name: 'Premium Turmeric Powder',
        description: 'High curcumin turmeric powder sourced from select farms.',
        price: 180,
        originalPrice: 220,
        category: 'Ground Spices',
        stock: 100,
        rating: 4.8,
        reviews: 124,
        sold: 450,
        image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?q=80&w=2070&auto=format&fit=crop',
        weight: '500g',
        tags: ['turmeric', 'haldi', 'yellow', 'organic'],
        isBestseller: true,
        isNewProduct: false
    },
    {
        name: 'Kashmiri Red Chilli Powder',
        description: 'Vibrant red color with moderate heat, perfect for Indian curries.',
        price: 240,
        originalPrice: 280,
        category: 'Ground Spices',
        stock: 85,
        rating: 4.9,
        reviews: 98,
        sold: 320,
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=2070&auto=format&fit=crop',
        weight: '250g',
        tags: ['chilli', 'mirch', 'red', 'spice'],
        isBestseller: true,
        isNewProduct: false
    },
    {
        name: 'Garam Masala Special',
        description: 'Aromatic blend of premium spices for an authentic taste.',
        price: 150,
        originalPrice: 180,
        category: 'Blended Masalas',
        stock: 120,
        rating: 4.7,
        reviews: 156,
        sold: 580,
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=2070&auto=format&fit=crop', // Placeholder reuse if needed
        weight: '100g',
        tags: ['garam masala', 'blend', 'aromatic'],
        isBestseller: true,
        isNewProduct: false
    },
    {
        name: 'Whole Black Pepper',
        description: 'Bold and pungent black pepper corns from Kerala.',
        price: 350,
        originalPrice: 400,
        category: 'Whole Spices',
        stock: 50,
        rating: 4.6,
        reviews: 45,
        sold: 120,
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=2070&auto=format&fit=crop',
        weight: '250g',
        tags: ['pepper', 'kali mirch', 'whole'],
        isBestseller: false,
        isNewProduct: true
    },
    {
        name: 'Cumin Seeds (Jeera)',
        description: 'Premium quality cumin seeds with rich aroma.',
        price: 220,
        originalPrice: 250,
        category: 'Whole Spices',
        stock: 150,
        rating: 4.5,
        reviews: 88,
        sold: 210,
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=2070&auto=format&fit=crop',
        weight: '500g',
        tags: ['cumin', 'jeera', 'seeds'],
        isBestseller: false,
        isNewProduct: false
    },
    {
        name: 'Coriander Powder',
        description: 'Freshly ground coriander powder for enhancing curry flavor.',
        price: 160,
        originalPrice: 190,
        category: 'Ground Spices',
        stock: 90,
        rating: 4.4,
        reviews: 67,
        sold: 180,
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=2070&auto=format&fit=crop',
        weight: '500g',
        tags: ['coriander', 'dhaniya', 'powder'],
        isBestseller: false,
        isNewProduct: false
    },
    {
        name: 'Chicken Masala',
        description: 'Perfect blend for spicy and delicious chicken curry.',
        price: 80,
        originalPrice: 100,
        category: 'Blended Masalas',
        stock: 200,
        rating: 4.8,
        reviews: 210,
        sold: 890,
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=2070&auto=format&fit=crop',
        weight: '100g',
        tags: ['chicken', 'non-veg', 'masala'],
        isBestseller: true,
        isNewProduct: false
    },
    {
        name: 'Biryani Masala',
        description: 'Authentic spice mix for royal biryani.',
        price: 120,
        originalPrice: 150,
        category: 'Blended Masalas',
        stock: 180,
        rating: 4.9,
        reviews: 340,
        sold: 1200,
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=2070&auto=format&fit=crop',
        weight: '100g',
        tags: ['biryani', 'royal', 'rice'],
        isBestseller: true,
        isNewProduct: false
    }
];

const seed = async () => {
    try {
        await connectDB();

        // Clear existing data
        await Product.deleteMany({});
        await Category.deleteMany({});
        console.log('Data cleared');

        // Create categories
        const createdCategories = await Category.insertMany(categories);
        console.log('Categories seeded');

        // Map category names to IDs
        const categoryMap = new Map();
        createdCategories.forEach(cat => {
            categoryMap.set(cat.name, cat._id);
        });

        // Prepare products with category IDs
        const productsWithIds = products.map(product => {
            const categoryId = categoryMap.get(product.category);
            if (!categoryId) {
                console.warn(`Category not found for product: ${product.name}`);
                return null;
            }
            return { ...product, category: categoryId };
        }).filter(Boolean);

        await Product.insertMany(productsWithIds);
        console.log('Products seeded');

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seed();
