const mongoose = require('mongoose');
require('dotenv').config();

const ThemeData = require('../models/ThemeData');

async function checkDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const themes = await ThemeData.find({}).sort({ updatedAt: -1 });
    
    console.log(`📊 Found ${themes.length} theme(s) in database:\n`);
    
    themes.forEach((theme, i) => {
      console.log(`Theme ${i + 1}:`);
      console.log(`  Shop: ${theme.shopDomain}`);
      console.log(`  Theme ID: ${theme.themeId}`);
      console.log(`  Theme Name: ${theme.themeName}`);
      console.log(`  Components: ${theme.components?.length || 0}`);
      console.log(`  Version: ${theme.version}`);
      console.log(`  Updated: ${theme.updatedAt}`);
      console.log('');
    });
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDatabase();
