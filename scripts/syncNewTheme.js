const { handleThemeUpdate } = require('../services/themeSync');
const { connectDB } = require('../config/database');
require('dotenv').config();

const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN || 'cmstestingg.myshopify.com';
const THEME_ID = process.env.SHOPIFY_THEME_ID || '154029457636';

async function syncTheme() {
  try {
    console.log(`🔄 Syncing theme ${THEME_ID} from ${SHOP_DOMAIN}...`);
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Sync theme
    await handleThemeUpdate(SHOP_DOMAIN, THEME_ID);
    
    console.log('\n✅ Theme sync completed successfully!');
    console.log('📱 Check your app at http://localhost:3002');
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

syncTheme();
