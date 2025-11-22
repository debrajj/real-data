const mongoose = require('mongoose');
require('dotenv').config();

const ThemeData = require('../models/ThemeData');
const Shop = require('../models/Shop');
const Media = require('../models/Media');

async function clearDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Clearing ThemeData collection...');
    const themeResult = await ThemeData.deleteMany({});
    console.log(`✅ Deleted ${themeResult.deletedCount} theme data records`);

    console.log('🗑️  Clearing Shop collection...');
    const shopResult = await Shop.deleteMany({});
    console.log(`✅ Deleted ${shopResult.deletedCount} shop records`);

    console.log('🗑️  Clearing Media collection...');
    const mediaResult = await Media.deleteMany({});
    console.log(`✅ Deleted ${mediaResult.deletedCount} media records`);

    console.log('✨ Database cleared successfully!');
    
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
