const mongoose = require('mongoose');
require('dotenv').config();
const ThemeData = require('../models/ThemeData');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const theme = await ThemeData.findOne({ themeId: '153818169572' });
    
    console.log('Pages field type:', typeof theme.pages);
    console.log('Pages keys:', Object.keys(theme.pages || {}));
    console.log('Has index page?', !!theme.pages?.index);
    console.log('Index page components count:', theme.pages?.index?.components?.length || 0);
    
    if (theme.pages?.index) {
      console.log('\nIndex page structure:');
      console.log(JSON.stringify(theme.pages.index, null, 2));
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
