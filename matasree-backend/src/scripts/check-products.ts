import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Product from '../models/Product';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function check() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/matasree';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    console.log('Connected!');

    const products = await Product.find({});
    for (const p of products) {
      if (Array.isArray(p.images) && p.images.length > 0 && p.image !== p.images[0]) {
        console.log(`Syncing image for "${p.name}" to: ${p.images[0]}`);
        p.image = p.images[0];
        await p.save();
      }
      console.log(`- Name: ${p.name}`);
      console.log(`  Image: "${p.image}"`);
      console.log(`  Images Array:`, p.images);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

check();
