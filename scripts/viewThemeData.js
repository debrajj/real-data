const mongoose = require('mongoose');
require('dotenv').config();

const ThemeData = require('../models/ThemeData');

async function viewThemeData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const theme = await ThemeData.findOne({ themeId: '153818169572' });
    
    if (!theme) {
      console.log('❌ Theme not found');
      process.exit(1);
    }
    
    console.log('📊 Theme Data:\n');
    console.log(JSON.stringify({
      shopDomain: theme.shopDomain,
      themeId: theme.themeId,
      themeName: theme.themeName,
      components: theme.components,
      pages: theme.pages ? Object.keys(theme.pages) : [],
      version: theme.version
    }, null, 2));
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

viewThemeData();
