import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Recipe from '../models/Recipe';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function verify() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/matasree';
    await mongoose.connect(uri);

    const totalCount = await Recipe.countDocuments({});
    console.log(`Total recipes in DB: ${totalCount}`);

    const regions = ['North Indian', 'South Indian', 'Bengali', 'Rajasthani', 'Other'];
    for (const r of regions) {
      const count = await Recipe.countDocuments({ region: r });
      console.log(`Region "${r}": ${count} recipes`);
    }

    const sample = await Recipe.findOne({ title: 'Royal Shahi Paneer' });
    console.log('Sample Recipe:', {
      title: sample?.title,
      region: sample?.region,
      ingredientsCount: sample?.ingredients.length,
      stepsCount: sample?.steps.length,
      productTags: sample?.productTags,
    });

    await mongoose.disconnect();
    console.log('Verification completed successfully!');
  } catch (err: any) {
    console.error('Error during verification:', err.message);
    process.exit(1);
  }
}

verify();
