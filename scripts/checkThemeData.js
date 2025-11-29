const mongoose = require('mongoose');
require('dotenv').config();

async function checkThemeData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const ThemeData = require('../models/ThemeData');
    const count = await ThemeData.countDocuments();
    console.log('\nTotal theme data documents:', count);
    
    if (count > 0) {
      const latest = await ThemeData.findOne().sort({ updatedAt: -1 }).lean();
      console.log('\nLatest theme data:');
      console.log('- Shop:', latest.shopDomain);
      console.log('- Theme ID:', latest.themeId);
      console.log('- Theme Name:', latest.themeName);
      console.log('- Version:', latest.version);
      console.log('- Components:', latest.components?.length || 0);
      console.log('- Pages:', Object.keys(latest.pages || {}).join(', '));
      console.log('- Has theme settings:', !!latest.theme);
      
      // Check first few components
      if (latest.components && latest.components.length > 0) {
        console.log('\nFirst 3 components:');
        latest.components.slice(0, 3).forEach((comp, i) => {
          console.log(`  ${i + 1}. ${comp.component || comp.type || 'Unknown'}`);
        });
      }
    } else {
      console.log('\n⚠️ No theme data found in database!');
      console.log('Run: node scripts/syncNewTheme.js to sync theme data');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkThemeData();
