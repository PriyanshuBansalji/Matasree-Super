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
    { name: 'Blended Masalas', slug: 'blended-masalas', description: 'Authentic stone-ground traditional Indian spice blends' },
    { name: 'Ground Spices', slug: 'ground-spices', description: '100% pure cold-ground single-origin spices' },
    { name: 'Herbs & Seasonings', slug: 'herbs-seasonings', description: 'Sun-dried aromatic Himalayan herbs and digestive compounds' },
    { name: 'Pickle & Achar Masala', slug: 'pickle-achar-masala', description: 'Traditional Indian recipe pickle seasoning masalas' },
];

const products = [
    {
        name: 'Royal Shahi Garam Masala',
        description: 'Authentic 16 whole spice blend including mace, nutmeg, black cardamom, and long pepper (pippali). Sourced from Clement Town, Dehradun.\n\nIngredients: Cumin Seeds, Coriander Seeds, Black Pepper, Dry Ginger, Cinnamon, Fennel Seeds, Black Cardamom, Mace, Star Anise, Red Chilli, Nutmeg, Green Cardamom, Bay Leaf, Cloves, Long Pepper (Pippali).',
        price: 160,
        originalPrice: 190,
        category: 'Blended Masalas',
        stock: 120,
        rating: 4.9,
        reviews: 215,
        sold: 680,
        image: '/official-products/Garam Masala 1.png',
        weight: '100g',
        tags: ['garam masala', 'shahi', 'blend', 'aromatic', 'dehradun', '16 spices'],
        isBestseller: true,
        isNewProduct: false
    },
    {
        name: 'Kitchen King All-Purpose Masala',
        description: 'Master all-purpose seasoning for curries, gravies, and dal. Cold-ground to lock in volatile essential oils.\n\nIngredients: Coriander Seeds, Cumin Seeds, Yellow Mustard Seeds, Poppy Seeds, Black Pepper, Fennel Seeds, Black Salt, Turmeric, Nutmeg, Red Chilli, Badi Elaichi (Black Cardamom Husk), Bay Leaves, Salt, Mace, Star Anise, Black Cardamom, Green Cardamom, Cinnamon, Garlic, Fenugreek Seeds, Dry Mango Powder (Amchur), Hing.',
        price: 150,
        originalPrice: 180,
        category: 'Blended Masalas',
        stock: 100,
        rating: 4.8,
        reviews: 184,
        sold: 520,
        image: '/official-products/Kitchen King.png',
        weight: '100g',
        tags: ['kitchen king', 'all-purpose', 'curry', 'gravy', 'dehradun'],
        isBestseller: true,
        isNewProduct: false
    },
    {
        name: 'Chaat Masala Special',
        description: 'Tangy and aromatic chatpata masala for street food, salads, snacks, and fruits.\n\nIngredients: Black Salt, Salt, Coriander Seeds, Cumin Seeds, Black Pepper, Dry Mango Powder, Red Chilli, Citric Acid (Satrik), Dry Ginger (Sonth), Carom Seeds (Ajwain), Sugar, Kasuri Methi (Dried Fenugreek Leaves), Asafoetida (Hing), Fennel Seeds.',
        price: 130,
        originalPrice: 150,
        category: 'Blended Masalas',
        stock: 90,
        rating: 4.9,
        reviews: 142,
        sold: 410,
        image: '/official-products/Chaat Masala Banner.png',
        weight: '100g',
        tags: ['chaat', 'chatpata', 'tangy', 'mango powder', 'amchur'],
        isBestseller: false,
        isNewProduct: false
    },
    {
        name: 'Meat Masala Special',
        description: 'Rich gravy spice blend infused with Bairki (Himalayan spice), Kachri powder, and Sendha Namak for authentic meat dishes.\n\nIngredients: Cumin Seeds, Bay Leaf, Green Cardamom, Red Chilli, Bairki (Traditional Himalayan Spice), Turmeric, Dry Ginger, Black Cardamom, Black Pepper, Cloves, Garlic, Rock Salt (Sendha Namak), Black Salt, Fennel Seeds, Nutmeg, Poppy Seeds, Kachri Powder, Mace, Cinnamon, Fenugreek Seeds, Kasuri Methi (Dried Fenugreek Leaves), Dry Mango Powder, Coriander Seeds.',
        price: 170,
        originalPrice: 200,
        category: 'Blended Masalas',
        stock: 80,
        rating: 4.8,
        reviews: 126,
        sold: 390,
        image: '/official-products/Meat Masala 1.png',
        weight: '100g',
        tags: ['meat masala', 'non-veg', 'bairki', 'himalayan', 'kachri'],
        isBestseller: true,
        isNewProduct: false
    },
    {
        name: 'Sampuran Masala',
        description: 'Heritage all-in-one complete curry blend crafted with Himalayan Jakhiya seeds (Wild Mustard) and garlic.\n\nIngredients: Turmeric, Red Chilli, Coriander Seeds, Cumin Seeds, Black Pepper, Dry Ginger, Bay Leaves, Cloves, Cinnamon, Nutmeg, Cardamom, Garlic, Onion, Kasuri Methi (Dried Fenugreek Leaves), Jakhiya Seeds (Wild Mustard).',
        price: 160,
        originalPrice: 190,
        category: 'Blended Masalas',
        stock: 110,
        rating: 4.9,
        reviews: 98,
        sold: 310,
        image: '/official-products/Sampuran Masala 1.png',
        weight: '100g',
        tags: ['sampuran', 'jakhiya', 'wild mustard', 'heritage', 'all-in-one'],
        isBestseller: false,
        isNewProduct: true
    },
    {
        name: 'Super Lal Tadka Mirch Powder',
        description: '100% pure cold-ground red chilli powder for rich ruby red color and fiery traditional heat.\n\nIngredients: 100% Pure Red Chilli.',
        price: 180,
        originalPrice: 210,
        category: 'Ground Spices',
        stock: 150,
        rating: 4.9,
        reviews: 310,
        sold: 950,
        image: '/official-products/Super Lal Tadka - 100 gm.jpg',
        weight: '100g',
        tags: ['chilli', 'mirch', 'red', 'tadka', 'pure'],
        isBestseller: true,
        isNewProduct: false
    },
    {
        name: 'Sun-Dried Kasoori Methi',
        description: 'Aromatic sun-dried fenugreek leaves harvested from Himalayan foothills to elevate dal, paneer, and curries.\n\nIngredients: Kasoori Methi (Dried Fenugreek Leaves).',
        price: 90,
        originalPrice: 110,
        category: 'Herbs & Seasonings',
        stock: 130,
        rating: 5.0,
        reviews: 84,
        sold: 290,
        image: '/official-products/Kasoori Methi 1.png',
        weight: '25g',
        tags: ['kasoori methi', 'fenugreek', 'leaves', 'herbs', 'aroma'],
        isBestseller: false,
        isNewProduct: false
    },
    {
        name: 'Mango Achar Masala (200g Box)',
        description: 'Traditional pickle spice mix crafted with mustard oil, Saunf, Methi Kuti, Kalonji, and Iodised Salt.\n\nIngredients: (In descending order by weight) Iodised Salt, Aniseed (Saunf), Kuti Fenugreek (Methi Kuti), Red Chilli Kuti, Red Chilli Powder, Haldi Powder, Mustard Oil, Kalonji, Yellow Mustard.',
        price: 140,
        originalPrice: 170,
        category: 'Pickle & Achar Masala',
        stock: 95,
        rating: 4.8,
        reviews: 76,
        sold: 240,
        image: '/official-products/all5.2.png',
        weight: '200g',
        tags: ['achar', 'mango pickle', 'saunf', 'kalonji', 'mustard oil'],
        isBestseller: false,
        isNewProduct: true
    },
    {
        name: 'Mix Achar Masala (100g Box)',
        description: 'Multi-use pickle seasoning for lemon, chilli, and mixed vegetable pickles.\n\nIngredients: Yellow Mustard Seeds, Coriander Seeds, Black Mustard Seeds (Rai), Fennel Seeds, Fenugreek Seeds, Red Chilli Powder, Turmeric Powder, Asafoetida (Hing), Nigella Seeds (Kalonji), Black Pepper, Salt, Mustard Oil.',
        price: 130,
        originalPrice: 150,
        category: 'Pickle & Achar Masala',
        stock: 105,
        rating: 4.7,
        reviews: 62,
        sold: 190,
        image: '/official-products/all5.3.png',
        weight: '100g',
        tags: ['mix achar', 'pickle', 'rai', 'nigella', 'mustard'],
        isBestseller: false,
        isNewProduct: false
    },
    {
        name: 'Pure Hing (Asafoetida Compound - 10g)',
        description: 'High-potency Asafoetida compound for powerful digestive aroma in dal tadka and curries.\n\nIngredients: Asafoetida Compound.',
        price: 120,
        originalPrice: 140,
        category: 'Herbs & Seasonings',
        stock: 140,
        rating: 5.0,
        reviews: 165,
        sold: 510,
        image: '/official-products/All5.png',
        weight: '10g',
        tags: ['hing', 'asafoetida', 'digestive', 'tadka', 'pure'],
        isBestseller: true,
        isNewProduct: false
    }
];

import Recipe from '../models/Recipe';
import { recipesData } from './seedRecipes';

const seed = async () => {
    try {
        await connectDB();

        // Clear existing data
        await Product.deleteMany({});
        await Category.deleteMany({});
        await Recipe.deleteMany({});
        console.log('Data cleared (Products, Categories, Recipes)');

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
        console.log('Official Matasree Products seeded successfully!');

        // Seed Recipes
        const insertedRecipes = await Recipe.insertMany(recipesData);
        console.log(`Seeded ${insertedRecipes.length} recipes successfully!`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seed();
