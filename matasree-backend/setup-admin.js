#!/usr/bin/env node

/**
 * Admin Setup Script
 * Creates or updates a user with admin privileges
 */

const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/matasree';
const adminEmail = 'priyanshujibansal@gmail.com';
const adminPassword = 'Matasree@1';
const adminName = 'Admin User';

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  role: { type: String, default: 'customer' },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

async function setupAdmin() {
  try {
    console.log('🔐 Setting up admin account...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Hash password
    const hashedPassword = await bcryptjs.hash(adminPassword, 10);
    console.log('✅ Password hashed\n');

    // Check if user exists
    let user = await User.findOne({ email: adminEmail });

    if (user) {
      // Update existing user
      user.isAdmin = true;
      user.role = 'admin';
      user.password = hashedPassword;
      user.name = adminName;
      await user.save();
      console.log('✅ Updated existing user to admin\n');
    } else {
      // Create new user
      user = await User.create({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isAdmin: true,
      });
      console.log('✅ Created new admin user\n');
    }

    console.log('🎉 Admin Setup Complete!\n');
    console.log('📋 Admin Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}\n`);
    console.log('🚀 Next Steps:');
    console.log('   1. Start both servers (backend & frontend)');
    console.log('   2. Go to http://localhost:8080');
    console.log('   3. Click Login');
    console.log('   4. Enter the credentials above');
    console.log('   5. Click user avatar → ADMIN section\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupAdmin();
