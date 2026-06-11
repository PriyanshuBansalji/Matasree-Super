const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect('mongodb://localhost:27017/matasree');
  try {
    await mongoose.connection.collection('carts').dropIndex('user_1');
    console.log('Dropped user_1 index');
  } catch (e) {
    console.log('Error dropping index (may not exist):', e.message);
  }
  process.exit(0);
}
fix();
